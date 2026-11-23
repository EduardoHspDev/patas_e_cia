const express = require('express');
const db = require('../db');
const { gerarHorarios } = require('../config');
const { validarConsulta, dataValida, noPassado } = require('../validacao');

const router = express.Router();
const STATUS = ['agendada', 'realizada', 'cancelada'];

const SQL_BASE = `
  SELECT c.id, c.animal_id, c.data_hora, c.motivo, c.observacoes, c.status,
         a.nome AS animal_nome, a.especie,
         t.id AS tutor_id, t.nome AS tutor_nome, t.telefone AS tutor_telefone
    FROM consultas c
    JOIN animais a ON a.id = c.animal_id
    JOIN tutores t ON t.id = a.tutor_id`;

const rejeitar = (res, status, erros, mensagem = 'Dados inválidos.') =>
  res.status(status).json({ mensagem, erros });

// Regras anti-duplicidade: animal já agendado no horário OU horário já ocupado na clínica
async function conflitos(animalId, dataHora, ignorarId = 0) {
  const erros = {};
  const [doAnimal] = await db.query(
    `SELECT id FROM consultas WHERE animal_id = ? AND data_hora = ? AND status = 'agendada' AND id <> ?`,
    [animalId, dataHora, ignorarId]);
  if (doAnimal.length) {
    erros.hora = 'Este animal já tem uma consulta agendada neste horário.';
    return erros;
  }
  const [ocupado] = await db.query(
    `SELECT a.nome FROM consultas c JOIN animais a ON a.id = c.animal_id
      WHERE c.data_hora = ? AND c.status = 'agendada' AND c.id <> ?`,
    [dataHora, ignorarId]);
  if (ocupado.length) erros.hora = `Horário já ocupado (${ocupado[0].nome}). Escolha outro horário.`;
  return erros;
}

async function animalExiste(id) {
  const [r] = await db.query('SELECT id FROM animais WHERE id = ?', [id]);
  return r.length > 0;
}

// LISTAR (filtros: data, animal_id, status)
router.get('/', async (req, res, next) => {
  try {
    const where = [], params = [];
    if (req.query.data) {
      if (!dataValida(req.query.data)) return rejeitar(res, 400, { data: 'Data inválida.' });
      where.push('c.data_hora BETWEEN ? AND ?');
      params.push(`${req.query.data} 00:00:00`, `${req.query.data} 23:59:59`);
    }
    if (req.query.animal_id) { where.push('c.animal_id = ?'); params.push(Number(req.query.animal_id)); }
    if (STATUS.includes(req.query.status)) { where.push('c.status = ?'); params.push(req.query.status); }
    const [rows] = await db.query(
      `${SQL_BASE} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY c.data_hora`, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// HORÁRIOS do dia: livres/ocupados (usado no formulário de agendamento)
router.get('/horarios', async (req, res, next) => {
  try {
    const { data } = req.query;
    if (!dataValida(data || '')) return rejeitar(res, 400, { data: 'Data inválida.' });
    const ignorar = Number(req.query.ignorar) || 0;
    const [rows] = await db.query(
      `SELECT TIME_FORMAT(c.data_hora, '%H:%i') AS hora, a.nome AS animal_nome
         FROM consultas c JOIN animais a ON a.id = c.animal_id
        WHERE c.data_hora BETWEEN ? AND ? AND c.status = 'agendada' AND c.id <> ?`,
      [`${data} 00:00:00`, `${data} 23:59:59`, ignorar]);
    const mapa = new Map(rows.map((r) => [r.hora, r.animal_nome]));
    res.json(gerarHorarios().map((hora) => ({
      hora,
      ocupado: mapa.has(hora),
      animal_nome: mapa.get(hora) || null,
      passado: noPassado(data, hora)
    })));
  } catch (e) { next(e); }
});

// BUSCAR UMA
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query(`${SQL_BASE} WHERE c.id = ?`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ mensagem: 'Consulta não encontrada.' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// CRIAR
router.post('/', async (req, res, next) => {
  try {
    const { dados, erros } = validarConsulta(req.body);
    if (Object.keys(erros).length) return rejeitar(res, 400, erros);
    if (!(await animalExiste(dados.animal_id))) return rejeitar(res, 400, { animal_id: 'Animal não encontrado.' });
    if (noPassado(dados.data, dados.hora)) return rejeitar(res, 400, { hora: 'Não é possível agendar no passado.' });

    const dataHora = `${dados.data} ${dados.hora}:00`;
    const conf = await conflitos(dados.animal_id, dataHora);
    if (Object.keys(conf).length) return rejeitar(res, 409, conf);

    const [r] = await db.query(
      'INSERT INTO consultas (animal_id, data_hora, motivo, observacoes) VALUES (?, ?, ?, ?)',
      [dados.animal_id, dataHora, dados.motivo, dados.observacoes || null]);
    res.status(201).json({ id: r.insertId, ...dados, status: 'agendada' });
  } catch (e) {
    // duas pessoas agendando ao mesmo tempo: o índice único do banco é a última barreira
    if (e.code === 'ER_DUP_ENTRY') return rejeitar(res, 409, { hora: 'Este horário acabou de ser ocupado. Escolha outro.' });
    next(e);
  }
});

// ATUALIZAR / REMARCAR (somente consultas agendadas)
router.put('/:id', async (req, res, next) => {
  try {
    const [atual] = await db.query('SELECT * FROM consultas WHERE id = ?', [req.params.id]);
    if (!atual.length) return res.status(404).json({ mensagem: 'Consulta não encontrada.' });
    if (atual[0].status !== 'agendada')
      return res.status(409).json({ mensagem: 'Só é possível editar ou remarcar consultas com status "agendada".' });

    const { dados, erros } = validarConsulta(req.body);
    if (Object.keys(erros).length) return rejeitar(res, 400, erros);
    if (!(await animalExiste(dados.animal_id))) return rejeitar(res, 400, { animal_id: 'Animal não encontrado.' });

    const dataHora = `${dados.data} ${dados.hora}:00`;
    if (dataHora !== atual[0].data_hora && noPassado(dados.data, dados.hora))
      return rejeitar(res, 400, { hora: 'Não é possível remarcar para o passado.' });

    const conf = await conflitos(dados.animal_id, dataHora, Number(req.params.id));
    if (Object.keys(conf).length) return rejeitar(res, 409, conf);

    await db.query(
      'UPDATE consultas SET animal_id = ?, data_hora = ?, motivo = ?, observacoes = ? WHERE id = ?',
      [dados.animal_id, dataHora, dados.motivo, dados.observacoes || null, req.params.id]);
    res.json({ id: Number(req.params.id), ...dados, status: 'agendada' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return rejeitar(res, 409, { hora: 'Este horário acabou de ser ocupado. Escolha outro.' });
    next(e);
  }
});

// MUDAR STATUS (agendada / realizada / cancelada)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const status = String(req.body.status || '');
    if (!STATUS.includes(status)) return rejeitar(res, 400, { status: 'Status inválido.' });
    const [atual] = await db.query('SELECT * FROM consultas WHERE id = ?', [req.params.id]);
    if (!atual.length) return res.status(404).json({ mensagem: 'Consulta não encontrada.' });
    const c = atual[0];

    // reativar uma consulta cancelada exige horário livre e futuro
    if (status === 'agendada' && c.status !== 'agendada') {
      const [data, hora] = [c.data_hora.slice(0, 10), c.data_hora.slice(11, 16)];
      if (noPassado(data, hora)) return rejeitar(res, 409, { status: 'Horário no passado.' }, 'Não é possível reativar uma consulta no passado.');
      const conf = await conflitos(c.animal_id, c.data_hora, c.id);
      if (Object.keys(conf).length) return rejeitar(res, 409, conf, conf.hora);
    }
    await db.query('UPDATE consultas SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ id: c.id, status });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ mensagem: 'Este horário já foi ocupado por outra consulta.' });
    next(e);
  }
});

// EXCLUIR
router.delete('/:id', async (req, res, next) => {
  try {
    const [r] = await db.query('DELETE FROM consultas WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ mensagem: 'Consulta não encontrada.' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
