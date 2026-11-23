const express = require('express');
const db = require('../db');
const { validarTutor, soDigitos } = require('../validacao');

const router = express.Router();

// LISTAR (com busca por nome do tutor, telefone ou nome do animal)
router.get('/', async (req, res, next) => {
  try {
    const busca = String(req.query.busca || '').trim();
    const params = [];
    let where = '';
    if (busca) {
      const like = `%${busca}%`;
      const digitos = soDigitos(busca);
      const condicoes = ['t.nome LIKE ?', 'EXISTS (SELECT 1 FROM animais a WHERE a.tutor_id = t.id AND a.nome LIKE ?)'];
      params.push(like, like);
      if (digitos) {
        condicoes.push('t.telefone LIKE ?');
        params.push(`%${digitos}%`);
      }
      where = 'WHERE ' + condicoes.join(' OR ');
    }
    const [rows] = await db.query(
      `SELECT t.*, (SELECT COUNT(*) FROM animais a WHERE a.tutor_id = t.id) AS qtd_animais
         FROM tutores t ${where} ORDER BY t.nome`, params);
    res.json(rows);
  } catch (e) { next(e); }
});

// BUSCAR UM
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM tutores WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ mensagem: 'Tutor não encontrado.' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// CRIAR
router.post('/', async (req, res, next) => {
  try {
    const { dados, erros } = validarTutor(req.body);
    if (Object.keys(erros).length) return res.status(400).json({ mensagem: 'Dados inválidos.', erros });
    const [r] = await db.query(
      'INSERT INTO tutores (nome, telefone, email, endereco) VALUES (?, ?, ?, ?)',
      [dados.nome, dados.telefone, dados.email || null, dados.endereco || null]);
    res.status(201).json({ id: r.insertId, ...dados });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ mensagem: 'Dados inválidos.', erros: { telefone: 'Já existe um tutor com este telefone.' } });
    next(e);
  }
});

// ATUALIZAR
router.put('/:id', async (req, res, next) => {
  try {
    const { dados, erros } = validarTutor(req.body);
    if (Object.keys(erros).length) return res.status(400).json({ mensagem: 'Dados inválidos.', erros });
    const [r] = await db.query(
      'UPDATE tutores SET nome = ?, telefone = ?, email = ?, endereco = ? WHERE id = ?',
      [dados.nome, dados.telefone, dados.email || null, dados.endereco || null, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ mensagem: 'Tutor não encontrado.' });
    res.json({ id: Number(req.params.id), ...dados });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ mensagem: 'Dados inválidos.', erros: { telefone: 'Já existe um tutor com este telefone.' } });
    next(e);
  }
});

// EXCLUIR (bloqueia se houver animais)
router.delete('/:id', async (req, res, next) => {
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) AS total FROM animais WHERE tutor_id = ?', [req.params.id]);
    if (total > 0) {
      return res.status(409).json({
        mensagem: `Não é possível excluir: o tutor ainda possui ${total} animal(is) cadastrado(s). Exclua os animais primeiro.`
      });
    }
    const [r] = await db.query('DELETE FROM tutores WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ mensagem: 'Tutor não encontrado.' });
    res.status(204).end();
  } catch (e) {
    if (e.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ mensagem: 'Não é possível excluir: o tutor possui animais cadastrados.' });
    next(e);
  }
});

module.exports = router;
