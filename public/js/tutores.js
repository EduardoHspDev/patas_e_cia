const corpo = document.getElementById('corpo');
const busca = document.getElementById('busca');

async function carregar() {
  try {
    const tutores = await api('/api/tutores?busca=' + encodeURIComponent(busca.value.trim()));
    if (!tutores.length) {
      corpo.innerHTML = '<tr><td colspan="4" class="vazio">Nenhum tutor encontrado.</td></tr>';
      return;
    }
    corpo.innerHTML = tutores.map((t) => `
      <tr>
        <td><strong>${esc(t.nome)}</strong></td>
        <td>${esc(formatarTelefone(t.telefone))}</td>
        <td><span class="badge">${t.qtd_animais}</span></td>
        <td class="acoes">
          <a class="btn peq" href="/animais.html?tutor=${t.id}">Animais</a>
          <a class="btn peq sec" href="/tutor-form.html?id=${t.id}">Editar</a>
          <button class="btn peq perigo" data-excluir="${t.id}" data-nome="${esc(t.nome)}">Excluir</button>
        </td>
      </tr>`).join('');
  } catch (e) {
    mostrarAlerta(e.message);
  }
}

corpo.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('[data-excluir]');
  if (!btn) return;
  if (!confirm(`Excluir o tutor "${btn.dataset.nome}"?`)) return;
  try {
    await api('/api/tutores/' + btn.dataset.excluir, { method: 'DELETE' });
    mostrarAlerta('Tutor excluído com sucesso.', 'ok');
    carregar();
  } catch (e) {
    mostrarAlerta(e.message); // ex.: tutor ainda possui animais
  }
});

let timer;
busca.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(carregar, 250); });
carregar();
