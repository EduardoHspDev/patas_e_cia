require('dotenv').config();
const path = require('path');
const express = require('express');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/tutores', require('./routes/tutores'));
app.use('/api/consultas', require('./routes/consultas'));
app.use('/api', require('./routes/animais'));

app.use('/api', (req, res) => res.status(404).json({ mensagem: 'Rota não encontrada.' }));

// tratamento central de erros
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ mensagem: 'Erro interno do servidor.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Patas & Cia rodando em http://localhost:${PORT}`));
