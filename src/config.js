require('dotenv').config();

const ABERTURA = process.env.HORARIO_ABERTURA || '08:00';
const FECHAMENTO = process.env.HORARIO_FECHAMENTO || '18:00';
const INTERVALO = Number(process.env.INTERVALO_MINUTOS) || 30;

const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const hhmm = (min) => String(Math.floor(min / 60)).padStart(2, '0') + ':' + String(min % 60).padStart(2, '0');

// horários de início possíveis: o último termina até o fechamento
function gerarHorarios() {
  const lista = [];
  for (let m = toMin(ABERTURA); m + INTERVALO <= toMin(FECHAMENTO); m += INTERVALO) lista.push(hhmm(m));
  return lista;
}

module.exports = { ABERTURA, FECHAMENTO, INTERVALO, gerarHorarios };
