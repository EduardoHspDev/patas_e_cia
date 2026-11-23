const express = require('express');
const db = require('../db');
const { validarAnimal } = require('../validacao');

const router = express.Router();
const msgDuplicado = { mensagem: 'Dados inválidos.', erros: { nome: 'Este tutor já tem um animal com este nome.' } };

async function tutorExiste(id) {
  const [rows] = await db.query('SELECT id FROM tutores WHERE id = ?', [id]);
  return rows.length > 0;
}

// LISTAR animais de um tutor
router.get('/tutores/:tutorId/animais', async (req, res, next) => {
  try {
    if (!(await tutorExiste(req.params.tutorId)))
      return res.status(404).json({ mensagem: 'Tutor não encontrado.' });
    const [rows] = await db.query(
      'SELECT * FROM animais WHERE tutor_id = ? ORDER BY nome', [req.params.tutorId]);
    res.json(rows);
  } catch (e) { next(e); }
});

// CRIAR animal para um tutor
router.post('/tutores/:tutorId/animais', async (req, res, next) => {
  try {
    if (!(await tutorExiste(req.params.tutorId)))
      return res.status(404).json({ mensagem: 'Tutor não encontrado.' });
    const { dados, erros } = validarAnimal(req.body);
    if (Object.keys(erros).length) return res.status(400).json({ mensagem: 'Dados inválidos.', erros });
    const [r] = await db.query(
      `INSERT INTO animais (tutor_id, nome, especie, raca, sexo, data_nascimento, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.params.tutorId, dados.nome, dados.especie, dados.raca || null, dados.sexo,
       dados.data_nascimento || null, dados.observacoes || null]);
    res.status(201).json({ id: r.insertId, tutor_id: Number(req.params.tutorId), ...dados });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json(msgDuplicado);
    next(e);
  }
});

// BUSCAR um animal
router.get('/animais/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM animais WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ mensagem: 'Animal não encontrado.' });
    res.json(rows[0]);
  } catch (e) { next(e); }
});

// ATUALIZAR animal
router.put('/animais/:id', async (req, res, next) => {
  try {
    const { dados, erros } = validarAnimal(req.body);
    if (Object.keys(erros).length) return res.status(400).json({ mensagem: 'Dados inválidos.', erros });
    const [r] = await db.query(
      `UPDATE animais SET nome = ?, especie = ?, raca = ?, sexo = ?, data_nascimento = ?, observacoes = ?
        WHERE id = ?`,
      [dados.nome, dados.especie, dados.raca || null, dados.sexo,
       dados.data_nascimento || null, dados.observacoes || null, req.params.id]);
    if (!r.affectedRows) return res.status(404).json({ mensagem: 'Animal não encontrado.' });
    res.json({ id: Number(req.params.id), ...dados });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json(msgDuplicado);
    next(e);
  }
});

// EXCLUIR animal (bloqueia se houver consultas agendadas ou realizadas)
router.delete('/animais/:id', async (req, res, next) => {
  const conn = await db.getConnection();
  try {
    const [[{ total }]] = await conn.query(
      `SELECT COUNT(*) AS total FROM consultas WHERE animal_id = ? AND status <> 'cancelada'`, [req.params.id]);
    if (total > 0) {
      return res.status(409).json({
        mensagem: `Não é possível excluir: o animal possui ${total} consulta(s) agendada(s) ou realizada(s). Cancele as agendadas ou mantenha o histórico.`
      });
    }
    await conn.beginTransaction();
    await conn.query('DELETE FROM consultas WHERE animal_id = ?', [req.params.id]); // só canceladas restam
    const [r] = await conn.query('DELETE FROM animais WHERE id = ?', [req.params.id]);
    await conn.commit();
    if (!r.affectedRows) return res.status(404).json({ mensagem: 'Animal não encontrado.' });
    res.status(204).end();
  } catch (e) {
    await conn.rollback().catch(() => {});
    next(e);
  } finally {
    conn.release();
  }
});

module.exports = router;
