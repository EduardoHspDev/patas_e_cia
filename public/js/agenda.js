const form = document.getElementById('form');
const corpo = document.getElementById('corpo');
const dia = document.getElementById('dia');
const selTutor = document.getElementById('tutor');
const selAnimal = document.getElementById('animal_id');
const selHora = document.getElementById('hora');
let consultas = [];

const hojeISO = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-DD local
const somarDias = (iso, n) => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d + n).toLocaleDateString('sv-SE');
};

/* ---------- lista do dia ---------- */
async function carregarDia() {
  try {
    consultas = await api('/api/consultas?data=' + dia.value);
    if (!consultas.length) {
      corpo.innerHTML = '<tr><td colspan="6" class="vazio">Nenhuma consulta neste dia.</td></tr>';
      return;
    }
    corpo.innerHTML = consultas.map((c) => {
      const ag = c.status === 'agendada';
      return `<tr class="${c.status}">
        <td><strong>${c.data_hora.slice(11, 16)}</strong></td>
        <td>${esc(c.animal_nome)} <small>(${esc(c.especie)})</small></td>
        <td>${esc(c.tutor_nome)}<br><small>${esc(formatarTelefone(c.tutor_telefone))}</small></td>
        <td>${esc(c.motivo)}</td>
        <td><span class="st st-${c.status}">${c.status}</span></td>
        <td class="acoes">
          ${ag ? `<button class="btn peq sec" data-acao="remarcar" data-id="${c.id}">Remarcar</button>
                  <button class="btn peq" data-acao="realizada" data-id="${c.id}">Realizada</button>
                  <button class="btn peq sec" data-acao="cancelada" data-id="${c.id}">Cancelar</button>`
              : `<button class="btn peq sec" data-acao="agendada" data-id="${c.id}">Reativar</button>`}
          <button class="btn peq perigo" data-acao="excluir" data-id="${c.id}">Excluir</button>
        </td></tr>`;
    }).join('');
  } catch (e) { mostrarAlerta(e.message); }
}

corpo.addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-acao]');
  if (!b) return;
  const c = consultas.find((x) => x.id === Number(b.dataset.id));
  const acao = b.dataset.acao;
  try {
    if (acao === 'remarcar') return preencherEdicao(c);
    if (acao === 'excluir') {
      if (!confirm(`Excluir a consulta de ${c.animal_nome}?`)) return;
      await api('/api/consultas/' + c.id, { method: 'DELETE' });
    } else {
      if (acao === 'cancelada' && !confirm(`Cancelar a consulta de ${c.animal_nome}?`)) return;
      await api(`/api/consultas/${c.id}/status`, { method: 'PATCH', body: { status: acao } });
    }
    mostrarAlerta('Consulta atualizada.', 'ok');
    carregarDia(); carregarHorarios();
  } catch (e) { mostrarAlerta(e.message); }
});

dia.addEventListener('change', carregarDia);
document.getElementById('ant').onclick = () => { dia.value = somarDias(dia.value, -1); carregarDia(); };
document.getElementById('prox').onclick = () => { dia.value = somarDias(dia.value, 1); carregarDia(); };
document.getElementById('hoje').onclick = () => { dia.value = hojeISO(); carregarDia(); };

/* ---------- formulário ---------- */
async function carregarTutores() {
  const tutores = await api('/api/tutores');
  selTutor.innerHTML = '<option value="">Selecione...</option>' +
    tutores.map((t) => `<option value="${t.id}">${esc(t.nome)} — ${esc(formatarTelefone(t.telefone))}</option>`).join('');
}

async function carregarAnimais(tutorId, selecionado = '') {
  if (!tutorId) {
    selAnimal.disabled = true;
    selAnimal.innerHTML = '<option value="">Selecione o tutor primeiro</option>';
    return;
  }
  const animais = await api(`/api/tutores/${tutorId}/animais`);
  selAnimal.disabled = false;
  selAnimal.innerHTML = animais.length
    ? '<option value="">Selecione...</option>' +
      animais.map((a) => `<option value="${a.id}">${esc(a.nome)} (${esc(a.especie)})</option>`).join('')
    : '<option value="">Este tutor não tem animais cadastrados</option>';
  selAnimal.value = selecionado;
}

async function carregarHorarios(selecionado = selHora.value) {
  const data = form.elements.data.value;
  if (!data) {
    selHora.disabled = true;
    selHora.innerHTML = '<option value="">Escolha a data</option>';
    return;
  }
  try {
    const ignorar = form.elements.id.value ? `&ignorar=${form.elements.id.value}` : '';
    const slots = await api(`/api/consultas/horarios?data=${data}${ignorar}`);
    selHora.disabled = false;
    selHora.innerHTML = '<option value="">Selecione...</option>' + slots.map((s) => {
      const bloq = s.ocupado || s.passado;
      const rotulo = s.ocupado ? `${s.hora} — ocupado (${s.animal_nome})` : s.passado ? `${s.hora} — já passou` : s.hora;
      return `<option value="${s.hora}" ${bloq ? 'disabled' : ''}>${esc(rotulo)}</option>`;
    }).join('');
    selHora.value = selecionado;
  } catch (e) { mostrarAlerta(e.message); }
}

selTutor.addEventListener('change', () => carregarAnimais(selTutor.value));
form.elements.data.addEventListener('change', () => carregarHorarios(''));

function resetarForm() {
  form.reset();
  form.elements.id.value = '';
  limparErros(form);
  carregarAnimais('');
  carregarHorarios('');
  document.getElementById('form-titulo').textContent = 'Nova consulta';
}

async function preencherEdicao(c) {
  limparErros(form);
  form.elements.id.value = c.id;
  selTutor.value = c.tutor_id;
  await carregarAnimais(c.tutor_id, c.animal_id);
  form.elements.data.value = c.data_hora.slice(0, 10);
  await carregarHorarios(c.data_hora.slice(11, 16));
  form.elements.motivo.value = c.motivo;
  form.elements.observacoes.value = c.observacoes || '';
  document.getElementById('form-titulo').textContent = `Remarcar / editar: ${c.animal_nome}`;
  form.scrollIntoView({ behavior: 'smooth' });
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  limparErros(form);
  const dados = Object.fromEntries(new FormData(form));
  const id = dados.id;
  try {
    const salva = await api(id ? '/api/consultas/' + id : '/api/consultas', {
      method: id ? 'PUT' : 'POST', body: dados
    });
    mostrarAlerta(id ? 'Consulta remarcada/atualizada.' : 'Consulta agendada.', 'ok');
    dia.value = dados.data;
    resetarForm();
    carregarDia();
  } catch (e) {
    if (Object.keys(e.erros).length) { mostrarErros(form, e.erros); carregarHorarios(); }
    else mostrarAlerta(e.message);
  }
});

document.getElementById('cancelar').addEventListener('click', resetarForm);

/* ---------- início (aceita ?animal=ID vindo da tela de animais) ---------- */
(async () => {
  dia.value = hojeISO();
  try {
    await carregarTutores();
    const animalId = new URLSearchParams(location.search).get('animal');
    if (animalId) {
      const a = await api('/api/animais/' + animalId);
      selTutor.value = a.tutor_id;
      await carregarAnimais(a.tutor_id, a.id);
      form.elements.data.value = hojeISO();
      await carregarHorarios('');
      form.scrollIntoView();
    }
  } catch (e) { mostrarAlerta(e.message); }
  carregarDia();
})();
