const form = document.getElementById('form');
const id = new URLSearchParams(location.search).get('id');
aplicarMascaraTelefone(form.elements.telefone);

if (id) {
  document.getElementById('titulo').textContent = 'Editar tutor';
  api('/api/tutores/' + id).then((t) => {
    form.elements.nome.value = t.nome;
    form.elements.telefone.value = formatarTelefone(t.telefone);
    form.elements.email.value = t.email || '';
    form.elements.endereco.value = t.endereco || '';
  }).catch((e) => mostrarAlerta(e.message));
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  limparErros(form);
  const dados = Object.fromEntries(new FormData(form));
  try {
    const salvo = await api(id ? '/api/tutores/' + id : '/api/tutores', {
      method: id ? 'PUT' : 'POST', body: dados
    });
    // novo tutor: já segue para o cadastro dos animais
    location.href = id ? '/' : '/animais.html?tutor=' + salvo.id;
  } catch (e) {
    if (Object.keys(e.erros).length) mostrarErros(form, e.erros);
    else mostrarAlerta(e.message);
  }
});
