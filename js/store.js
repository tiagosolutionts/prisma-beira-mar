import { unidades, encomendas, chamados, ATRASOS, propostas, clientes, reservas, comunicados, unidade } from './data.js';
import { icon } from './icons.js';

export const actions = {};
export const state = {
  view: 'espelho', mode: 'vendas', condoTab: 'encomendas', selected: null, filtro: 'todas',
  paid: new Set(), contasPagas: new Set(), // `${num}:${id}`
};

const listeners = new Set();
export const onChange = (fn) => listeners.add(fn);
export const emit = (what) => listeners.forEach((fn) => fn(what));

export const pendentes = (num) => encomendas.filter((e) => e.unidade === num && e.status === 'aguardando');
export const chamadosAbertos = (num) => chamados.filter((c) => c.unidade === num && c.status !== 'concluido');
export const atraso = (num) => (ATRASOS[num] && !state.paid.has(num) ? ATRASOS[num] : null);
export const stats = () => {
  const s = { disponivel: 0, reservado: 0, vendido: 0, bloqueado: 0, vgv: 0, vendidoV: 0, dispV: 0, reservV: 0 };
  unidades.forEach((u) => {
    s[u.status]++; s.vgv += u.preco;
    if (u.status === 'vendido') s.vendidoV += u.preco; if (u.status === 'disponivel') s.dispV += u.preco; if (u.status === 'reservado') s.reservV += u.preco;
  });
  s.total = unidades.length; s.familias = unidades.filter((u) => u.morador).length;
  return s;
};

export function toast(msg, ic = 'check') {
  const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = icon(ic, 18) + `<span>${msg}</span>`;
  document.getElementById('toasts').appendChild(el); setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600); setTimeout(() => el.remove(), 3000);
}

export function openModal(html, cls = '', onMount) {
  const root = document.getElementById('modal-root');
  const bg = document.createElement('div'); bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  root.appendChild(bg);
  const close = () => { bg.dispatchEvent(new CustomEvent('closed')); bg.remove(); };
  bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) close(); });
  const esc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } };
  document.addEventListener('keydown', esc);
  onMount?.(bg.querySelector('.modal'), close, bg);
  return close;
}

export function qrSVG(text, cell = 3) {
  try { const q = window.qrcode(0, 'M'); q.addData(text); q.make(); return q.createSvgTag({ cellSize: cell, margin: 0, scalable: true }); }
  catch { return ''; }
}

export const statusLabel = { disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido', bloqueado: 'Bloqueado' };
export const statusTag = (s) => `<span class="tag ${{ disponivel: 'g', reservado: 'a', vendido: 'r', bloqueado: '' }[s]}"><i class="d"></i>${statusLabel[s]}</span>`;

export { unidades, encomendas, chamados, propostas, clientes, reservas, comunicados, unidade };
