const tutorId = new URLSearchParams(location.search).get('tutor');
const form = document.getElementById('form');
const corpo = document.getElementById('corpo');
let animais = [];

if (!tutorId) location.href = '/';

async function carregarTutor() {
  try {
    const t = await api('/api/tutores/' + tutorId);
    document.getElementById('tutor-nome').textContent = 'Animais de ' + t.nome;
    document.getElementById('tutor-info').textContent =
      'Telefone: ' + formatarTelefone(t.telefone) + (t.email ? ' · ' + t.email : '');
  } catch (e) {
    mostrarAlerta(e.message);
  }
}

async function carregarAnimais() {
  try {
    animais = await api(`/api/tutores/${tutorId}/animais`);
    if (!animais.length) {
      corpo.innerHTML = '<tr><td colspan="6" class="vazio">Nenhum animal cadastrado para este tutor.</td></tr>';
      return;
    }
    corpo.innerHTML = animais.map((a) => `
      <tr>
        <td><strong>${esc(a.nome)}</strong></td>
        <td>${esc(a.especie)}</td>
        <td>${esc(a.raca || '—')}</td>
        <td>${a.sexo === 'M' ? 'Macho' : 'Fêmea'}</td>
        <td>${formatarData(a.data_nascimento)}</td>
        <td class="acoes">
          <a class="btn peq" href="/agenda.html?animal=${a.id}">Agendar</a>
          <button class="btn peq sec" data-editar="${a.id}">Editar</button>
          <button class="btn peq perigo" data-excluir="${a.id}">Excluir</button>
        </td>
      </tr>`).join('');
  } catch (e) {
    mostrarAlerta(e.message);
  }
}

function resetarForm() {
  form.reset();
  form.elements.id.value = '';
  limparErros(form);
  document.getElementById('form-titulo').textContent = 'Novo animal';
}

corpo.addEventListener('click', async (ev) => {
  const bEditar = ev.target.closest('[data-editar]');
  const bExcluir = ev.target.closest('[data-excluir]');
  if (bEditar) {
    const a = animais.find((x) => x.id === Number(bEditar.dataset.editar));
    form.elements.id.value = a.id;
    ['nome', 'especie', 'raca', 'sexo', 'data_nascimento', 'observacoes']
      .forEach((c) => (form.elements[c].value = a[c] || ''));
    limparErros(form);
    document.getElementById('form-titulo').textContent = 'Editar animal: ' + a.nome;
    form.scrollIntoView({ behavior: 'smooth' });
  }
  if (bExcluir) {
    const a = animais.find((x) => x.id === Number(bExcluir.dataset.excluir));
    if (!confirm(`Excluir o animal "${a.nome}"?`)) return;
    try {
      await api('/api/animais/' + a.id, { method: 'DELETE' });
      mostrarAlerta('Animal excluído com sucesso.', 'ok');
      if (form.elements.id.value === String(a.id)) resetarForm();
      carregarAnimais();
    } catch (e) { mostrarAlerta(e.message); }
  }
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  limparErros(form);
  const dados = Object.fromEntries(new FormData(form));
  const editId = dados.id;
  delete dados.id;
  try {
    await api(editId ? '/api/animais/' + editId : `/api/tutores/${tutorId}/animais`, {
      method: editId ? 'PUT' : 'POST', body: dados
    });
    mostrarAlerta(editId ? 'Animal atualizado.' : 'Animal cadastrado.', 'ok');
    resetarForm();
    carregarAnimais();
  } catch (e) {
    if (Object.keys(e.erros).length) mostrarErros(form, e.erros);
    else mostrarAlerta(e.message);
  }
});

document.getElementById('cancelar').addEventListener('click', resetarForm);
carregarTutor();
carregarAnimais();
