async function api(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const e = new Error((data && data.mensagem) || 'Erro inesperado. Tente novamente.');
    e.status = res.status;
    e.erros = (data && data.erros) || {};
    throw e;
  }
  return data;
}

function esc(v) {
  const d = document.createElement('div');
  d.textContent = v ?? '';
  return d.innerHTML;
}

function formatarTelefone(v) {
  const d = String(v ?? '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function aplicarMascaraTelefone(input) {
  input.addEventListener('input', () => { input.value = formatarTelefone(input.value); });
}

function formatarData(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function mostrarAlerta(msg, tipo = 'erro') {
  const el = document.getElementById('alerta');
  el.className = 'alerta ' + (tipo === 'erro' ? 'erro-box' : 'ok-box');
  el.textContent = msg;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparErros(form) {
  form.querySelectorAll('[data-erro]').forEach((s) => (s.textContent = ''));
  form.querySelectorAll('.invalido').forEach((i) => i.classList.remove('invalido'));
}

function mostrarErros(form, erros) {
  limparErros(form);
  Object.entries(erros).forEach(([campo, msg]) => {
    const span = form.querySelector(`[data-erro="${campo}"]`);
    const input = form.elements[campo];
    if (span) span.textContent = msg;
    if (input) input.classList.add('invalido');
  });
}
