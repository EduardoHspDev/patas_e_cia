const { gerarHorarios, ABERTURA, FECHAMENTO, INTERVALO } = require('./config');

const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');
const texto = (v) => String(v ?? '').trim();

// DDD (2 dígitos) + celular (9 + 8 dígitos) ou fixo (2-5 + 7 dígitos)
const REGEX_TELEFONE = /^[1-9]{2}(?:9\d{8}|[2-5]\d{7})$/;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarTutor(body = {}) {
  const dados = {
    nome: texto(body.nome),
    telefone: soDigitos(body.telefone),
    email: texto(body.email),
    endereco: texto(body.endereco)
  };
  const erros = {};

  if (!dados.nome) erros.nome = 'Informe o nome do tutor.';
  else if (dados.nome.length < 3) erros.nome = 'O nome deve ter ao menos 3 caracteres.';
  else if (dados.nome.length > 100) erros.nome = 'O nome deve ter no máximo 100 caracteres.';

  if (!dados.telefone) erros.telefone = 'Informe o telefone.';
  else if (!REGEX_TELEFONE.test(dados.telefone))
    erros.telefone = 'Telefone inválido. Use DDD + número, ex.: (85) 99999-9999.';

  if (dados.email && (!REGEX_EMAIL.test(dados.email) || dados.email.length > 120))
    erros.email = 'E-mail inválido.';

  if (dados.endereco.length > 200) erros.endereco = 'Endereço muito longo (máx. 200).';

  return { dados, erros };
}

function validarAnimal(body = {}) {
  const dados = {
    nome: texto(body.nome),
    especie: texto(body.especie),
    raca: texto(body.raca),
    sexo: texto(body.sexo).toUpperCase(),
    data_nascimento: texto(body.data_nascimento),
    observacoes: texto(body.observacoes)
  };
  const erros = {};

  if (!dados.nome) erros.nome = 'Informe o nome do animal.';
  else if (dados.nome.length > 80) erros.nome = 'O nome deve ter no máximo 80 caracteres.';

  if (!dados.especie) erros.especie = 'Informe a espécie.';
  else if (dados.especie.length > 30) erros.especie = 'Espécie muito longa (máx. 30).';

  if (dados.raca.length > 60) erros.raca = 'Raça muito longa (máx. 60).';

  if (!dados.sexo) erros.sexo = 'Informe o sexo.';
  else if (!['M', 'F'].includes(dados.sexo)) erros.sexo = 'Sexo deve ser M ou F.';

  if (dados.data_nascimento) {
    const d = new Date(dados.data_nascimento + 'T00:00:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.data_nascimento) || Number.isNaN(d.getTime()))
      erros.data_nascimento = 'Data inválida.';
    else if (d > new Date()) erros.data_nascimento = 'A data de nascimento não pode estar no futuro.';
  }

  if (dados.observacoes.length > 255) erros.observacoes = 'Observações muito longas (máx. 255).';

  return { dados, erros };
}

function dataValida(str) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [a, m, d] = str.split('-').map(Number);
  const dt = new Date(a, m - 1, d);
  return dt.getFullYear() === a && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function noPassado(data, hora) {
  return new Date(`${data}T${hora}:00`) <= new Date();
}

function validarConsulta(body = {}) {
  const dados = {
    animal_id: Number(body.animal_id) || 0,
    data: texto(body.data),
    hora: texto(body.hora),
    motivo: texto(body.motivo),
    observacoes: texto(body.observacoes)
  };
  const erros = {};

  if (!dados.animal_id) erros.animal_id = 'Selecione o animal.';

  if (!dados.data) erros.data = 'Informe a data.';
  else if (!dataValida(dados.data)) erros.data = 'Data inválida.';

  if (!dados.hora) erros.hora = 'Selecione o horário.';
  else if (!gerarHorarios().includes(dados.hora))
    erros.hora = `Horário fora do expediente (${ABERTURA} às ${FECHAMENTO}, de ${INTERVALO} em ${INTERVALO} min).`;

  if (!dados.motivo) erros.motivo = 'Informe o motivo da consulta.';
  else if (dados.motivo.length > 150) erros.motivo = 'Motivo muito longo (máx. 150).';

  if (dados.observacoes.length > 255) erros.observacoes = 'Observações muito longas (máx. 255).';

  return { dados, erros };
}

module.exports = { validarTutor, validarAnimal, validarConsulta, dataValida, noPassado, soDigitos };
