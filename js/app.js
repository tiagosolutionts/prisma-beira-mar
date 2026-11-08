import { icon } from './icons.js';
import { createBuilding } from './building.js';
import { createPlan3D, planSVG, ambientes } from './plan.js';
import { EMPREENDIMENTO, brl, mi, contasOutubro, historico, visitantes, PLANTAS } from './data.js';
import { actions, state, emit, onChange, pendentes, chamadosAbertos, atraso, stats, toast, openModal, qrSVG, statusTag, unidades, encomendas, chamados, propostas, clientes, unidade } from './store.js';
import { renderPage } from './pages.js';
import { openResidentApp } from './resident.js';

const NAV = [
  ['VENDAS', [['espelho', 'Espelho 3D', 'rotate-3d'], ['geral', 'Geral', 'layout-dashboard'], ['unidades', 'Unidades', 'layout-grid'], ['clientes', 'Clientes', 'users'], ['propostas', 'Propostas', 'file-text']]],
  ['CONDOMÍNIO', [['portaria', 'Portaria', 'package'], ['chamados', 'Chamados', 'wrench'], ['financeiro', 'Financeiro', 'wallet'], ['reservas', 'Reservas', 'calendar-days'], ['comunicados', 'Comunicados', 'megaphone'], ['moradores', 'Moradores', 'contact'], ['ajustes', 'Ajustes', 'settings']]],
];
const LOGO = `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"><path d="M12 2.5 20 7v10l-8 4.5L4 17V7z"/><path d="M12 2.5V12l8-5M12 12l-8-5M12 12v9.5" opacity=".7"/></svg>`;

function badgeFor(id) {
  if (id === 'portaria') return encomendas.filter((e) => e.status === 'aguardando').length;
  if (id === 'chamados') return chamados.filter((c) => c.status !== 'concluido').length;
  if (id === 'financeiro') return unidades.filter((u) => atraso(u.num)).length;
  return 0;
}
function renderNav() {
  const item = ([id, label, ic]) => { const b = badgeFor(id); return `<button class="nav-i ${state.view === id ? 'on' : ''}" data-a="go" data-v="${id}" aria-label="${label}">${icon(ic, 19)}<span>${label}</span>${b ? `<span class="dot">${b}</span>` : ''}</button>`; };
  document.getElementById('side').innerHTML = `
    <div class="brand"><div class="brand-mark">${LOGO}</div><b>PRISMA</b></div>
    <button class="bell" data-a="notifs" aria-label="Notificações">${icon('bell', 18)}<span class="dot">3</span></button>
    ${NAV.map(([sec, items]) => `<div class="side-sec">${sec}</div>${items.map(item).join('')}`).join('')}`;
  const main = [['espelho', 'Espelho 3D', 'rotate-3d'], ['geral', 'Geral', 'layout-dashboard'], ['unidades', 'Unidades', 'layout-grid'], ['clientes', 'Clientes', 'users'], ['portaria', 'Portaria', 'package']];
  const isMore = !main.some(([id]) => id === state.view);
  document.getElementById('mnav').innerHTML = main.map(item).join('') + `<button class="nav-i ${isMore ? 'on' : ''}" data-a="more">${icon('layers', 19)}<span>Mais</span></button>`;
}

// ===== Navegação =====
let building = null;
function go(view) {
  state.view = view; renderNav();
  const esp = document.getElementById('view-espelho'), page = document.getElementById('view-page');
  if (view === 'espelho') { esp.hidden = false; page.hidden = true; building?.pause(false); building?.resize(); }
  else { esp.hidden = true; page.hidden = false; building?.pause(true); page.scrollTop = 0; renderPage(view, page); }
}

// ===== Espelho 3D =====
const COL = { green: 0x1fe07a, amber: 0xffaa1a, red: 0xff2e45, cyan: 0x22d8f2, violet: 0x9b6bff, idle: 0x39405a, empty: 0x101018 };
function colorFn(num) {
  const u = unidade(num);
  if (state.mode === 'vendas') return { disponivel: { color: COL.green, intensity: 0.95 }, reservado: { color: COL.amber, intensity: 0.95 }, vendido: { color: COL.red, intensity: 0.9 }, bloqueado: { color: COL.idle, intensity: 0.6 } }[u.status];
  if (!u.morador) return { color: COL.empty, intensity: 0.25 };
  if (state.condoTab === 'encomendas') { const n = pendentes(num).length; return n >= 2 ? { color: COL.violet, intensity: 1.2 } : n === 1 ? { color: COL.cyan, intensity: 1.0 } : { color: COL.idle, intensity: 0.5 }; }
  if (state.condoTab === 'chamados') { const c = chamadosAbertos(num); return c.some((x) => x.atrasado) ? { color: COL.red, intensity: 1.0 } : c.length ? { color: COL.amber, intensity: 1.0 } : { color: COL.idle, intensity: 0.5 }; }
  return atraso(num) ? { color: COL.red, intensity: 1.0 } : { color: COL.green, intensity: 0.7 };
}
function badge3d(num) {
  if (state.mode === 'vendas') return null; const u = unidade(num); if (!u.morador) return null;
  if (state.condoTab === 'encomendas') { const n = pendentes(num).length; return n ? { html: icon('package', 12) + n, cls: n >= 2 ? 'v' : '' } : null; }
  if (state.condoTab === 'chamados') { const c = chamadosAbertos(num); return c.length ? { html: icon('wrench', 12), cls: c.some((x) => x.atrasado) ? 'r' : 'a' } : null; }
  const a = atraso(num); return a ? { html: `${a.dias}d`, cls: 'r' } : null;
}
function tipFn(num) {
  const u = unidade(num);
  if (u.morador) {
    const p = pendentes(num).length, c = chamadosAbertos(num).length, a = atraso(num);
    return `<b>Apto ${num} · ${u.morador.nome}</b>${[p ? `${p} na portaria` : 'nada na portaria', c ? `${c} chamado` : null, a ? `<span class="red">${a.dias} dias de atraso</span>` : null].filter(Boolean).join(' · ')}`;
  }
  return `<b>Apto ${num}</b>${u.planta.quartos} quartos · ${u.planta.area} m² · ${mi(u.preco).replace(' mi', ' mi')} · <span class="${u.status === 'reservado' ? 'amber' : 'green'}">${u.status === 'reservado' ? 'Reservado' : 'Disponível'}</span>`;
}
function refreshBuilding() { building?.setColors(colorFn, badge3d, tipFn); applyFilter(); }
function applyFilter() {
  const f = state.filtro;
  building?.setFilter(f === 'todas' ? null : (n) => unidade(n).tipo === f);
}

function legend() {
  const s = stats();
  if (state.mode === 'vendas') return `<span><i class="sw" style="color:var(--green)"></i>Disponível <b>${s.disponivel}</b></span><span><i class="sw" style="color:var(--amber)"></i>Reservado <b>${s.reservado}</b></span><span><i class="sw" style="color:var(--red)"></i>Vendido <b>${s.vendido}</b></span><span><i class="sw" style="color:#4a4a58"></i>Bloqueado <b>${s.bloqueado}</b></span>`;
  const mor = unidades.filter((u) => u.morador);
  if (state.condoTab === 'encomendas') {
    const one = mor.filter((u) => pendentes(u.num).length === 1).length, two = mor.filter((u) => pendentes(u.num).length >= 2).length;
    return `<span><i class="sw" style="color:var(--cyan)"></i>1 encomenda <b>${one}</b></span><span><i class="sw" style="color:#9b6bff"></i>2 ou mais <b>${two}</b></span><span><i class="sw" style="color:#39405a"></i>Nada na portaria <b>${mor.length - one - two}</b></span><span><i class="sw" style="color:#1a1a24"></i>Sem morador <b>${unidades.length - mor.length}</b></span>`;
  }
  if (state.condoTab === 'chamados') {
    const late = mor.filter((u) => chamadosAbertos(u.num).some((c) => c.atrasado)).length, open = mor.filter((u) => chamadosAbertos(u.num).length).length - late;
    return `<span><i class="sw" style="color:var(--red)"></i>Fora do prazo <b>${late}</b></span><span><i class="sw" style="color:var(--amber)"></i>Em aberto <b>${open}</b></span><span><i class="sw" style="color:#39405a"></i>Sem chamado <b>${mor.length - late - open}</b></span>`;
  }
  const at = mor.filter((u) => atraso(u.num)).length;
  return `<span><i class="sw" style="color:var(--red)"></i>Em atraso <b>${at}</b></span><span><i class="sw" style="color:var(--green)"></i>Em dia <b>${mor.length - at}</b></span><span><i class="sw" style="color:#1a1a24"></i>Sem morador <b>${unidades.length - mor.length}</b></span>`;
}

function renderStageChrome() {
  const top = document.getElementById('stage-top');
  top.innerHTML = `
    <div class="col">
      <div class="pills" role="tablist">
        <button class="pill ${state.mode === 'vendas' ? 'on' : ''}" data-a="mode" data-m="vendas">${icon('trending-up', 14)}Vendas</button>
        <button class="pill ${state.mode === 'condominio' ? 'on' : ''}" data-a="mode" data-m="condominio">${icon('building-2', 14)}Condomínio</button>
      </div>
      ${state.mode === 'condominio' ? `<div class="pills">
        <button class="pill ${state.condoTab === 'encomendas' ? 'on' : ''}" data-a="ctab" data-t="encomendas">${icon('package', 14)}Encomendas</button>
        <button class="pill ${state.condoTab === 'chamados' ? 'on' : ''}" data-a="ctab" data-t="chamados">${icon('wrench', 14)}Chamados</button>
        <button class="pill ${state.condoTab === 'financeiro' ? 'on' : ''}" data-a="ctab" data-t="financeiro">${icon('wallet', 14)}Financeiro</button>
      </div>` : ''}
    </div>
    <select class="select" id="filtro" aria-label="Filtrar por planta" style="background-color:rgba(10,10,18,.75);backdrop-filter:blur(12px)">
      <option value="todas" ${state.filtro === 'todas' ? 'selected' : ''}>Todas as plantas</option>
      <option value="A" ${state.filtro === 'A' ? 'selected' : ''}>Tipo A · 3 quartos · 98 m²</option>
      <option value="B" ${state.filtro === 'B' ? 'selected' : ''}>Tipo B · 2 quartos · 74 m²</option>
    </select>`;
  top.querySelector('#filtro').onchange = (e) => { state.filtro = e.target.value; applyFilter(); };
  document.getElementById('legend').innerHTML = legend();
  const L = building?.getLighting() || 'noite';
  document.getElementById('stage-tools').innerHTML = `
    <button class="tool ${building?.isAutoRotate() ? 'on' : ''}" data-a="spin" title="Girar automaticamente" aria-label="Girar automaticamente">${icon('rotate-ccw', 17)}</button>
    <button class="tool ${L === 'noite' ? 'on' : ''}" data-a="light" data-l="noite" title="Noite" aria-label="Iluminação noite">${icon('moon', 17)}</button>
    <button class="tool ${L === 'por-do-sol' ? 'on' : ''}" data-a="light" data-l="por-do-sol" title="Pôr do sol" aria-label="Iluminação pôr do sol">${icon('sunset', 17)}</button>
    <button class="tool ${L === 'dia' ? 'on' : ''}" data-a="light" data-l="dia" title="Dia" aria-label="Iluminação dia">${icon('sun', 17)}</button>
    <button class="tool" data-a="reset" title="Centralizar" aria-label="Centralizar câmera">${icon('scan-eye', 17)}</button>
    <button class="tool" data-a="fullscreen" title="Tela cheia" aria-label="Tela cheia">${icon('maximize', 17)}</button>`;
}

function mountEspelho() {
  const el = document.getElementById('view-espelho');
  el.innerHTML = `<div class="mirror">
    <div class="stage" id="stage">
      <div class="stage-top" id="stage-top"></div>
      <div class="stage-tools" id="stage-tools"></div>
      <div class="hint">${icon('rotate-3d', 14)}Arraste para girar · role para aproximar · clique num apartamento</div>
      <div class="stage-bottom"><div class="legend" id="legend"></div><span class="credit">Prédio Residencial Prisma Beira-Mar · modelo 3D procedural</span></div>
    </div>
    <aside class="rpanel" id="rpanel" aria-live="polite"></aside>
  </div>`;
  building = createBuilding(document.getElementById('stage'), { onPick: (n) => selectUnit(n) });
  refreshBuilding(); renderStageChrome(); renderPanel();
}

function selectUnit(num, fly = true) {
  state.selected = num; building?.select(num, fly); renderPanel();
  if (window.innerWidth <= 900) document.getElementById('rpanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  else document.getElementById('rpanel').scrollTop = 0;
}
function clearUnit() { state.selected = null; building?.clearSelection(); renderPanel(); }

// ===== Painel lateral =====
function renderPanel() {
  const p = document.getElementById('rpanel'); if (!p) return;
  const u = state.selected ? unidade(state.selected) : null;
  p.innerHTML = !u ? (state.mode === 'vendas' ? panelResumoVendas() : panelResumoCondo()) : u.morador ? panelMorador(u) : panelVenda(u);
}

function mirrorGrid() {
  let h = '<div class="mirror-grid">';
  for (let f = 8; f >= 1; f--) {
    h += `<div class="fl">${f}º</div>`;
    for (let c = 1; c <= 4; c++) { const u = unidade(f * 100 + c); h += `<button class="cell s-${u.status} ${state.selected === u.num ? 'sel' : ''}" data-a="sel" data-n="${u.num}" aria-label="Apto ${u.num} ${u.status}">${u.num}</button>`; }
  }
  return h + '</div>';
}
function panelResumoVendas() {
  const s = stats(); const pct = Math.round((s.vendidoV / s.vgv) * 100);
  return `
    <div><div class="eyebrow">Empreendimento</div><div class="h1" style="font-size:24px;margin-top:4px">${EMPREENDIMENTO.nome}</div><div class="sub">${EMPREENDIMENTO.local} · pronto para morar · entregue em ${EMPREENDIMENTO.entrega}</div></div>
    <div class="card" style="padding:12px 14px"><div class="row between"><span class="row" style="gap:6px;font-weight:600;font-size:12.5px">${icon('users', 15)}Famílias morando</span><b class="num">${s.familias} de ${s.total}</b></div><div class="bar" style="margin-top:8px"><i style="width:${(s.familias / s.total) * 100}%;background:linear-gradient(90deg,#6a43ff,#b494ff)"></i></div></div>
    <div class="mini-kpis">
      <div><div class="l">VGV</div><div class="v" style="font-size:14.5px;white-space:nowrap">${mi(s.vgv)}</div><div class="x">${s.total} unidades</div></div>
      <div><div class="l">Vendido</div><div class="v" style="font-size:14.5px;white-space:nowrap">${mi(s.vendidoV)}</div><div class="x">${pct}% do VGV</div></div>
      <div><div class="l">Unidades</div><div class="v" style="font-size:14.5px">${s.total}</div><div class="x">${s.disponivel} disponíveis</div></div>
    </div>
    <div class="bar lg"><i style="width:${(s.vendido / s.total) * 100}%;background:var(--red)"></i><i style="width:${(s.reservado / s.total) * 100}%;background:var(--amber)"></i><i style="width:${(s.disponivel / s.total) * 100}%;background:var(--green)"></i></div>
    <div><div class="section-t">Espelho de vendas<span class="c">${EMPREENDIMENTO.nome}</span></div>${mirrorGrid()}</div>
    <div class="li" style="font-size:12px;color:var(--muted)">${icon('info', 16)}Clique em um apartamento no prédio ou no espelho para ver os detalhes.</div>`;
}
function panelResumoCondo() {
  const mor = unidades.filter((u) => u.morador);
  const naPort = encomendas.filter((e) => e.status === 'aguardando').length;
  const ab = chamados.filter((c) => c.status !== 'concluido'); const late = ab.filter((c) => c.atrasado).length;
  const inad = mor.filter((u) => atraso(u.num)); const inadPct = ((inad.length / mor.length) * 100).toFixed(1).replace('.', ',');
  let lista = '';
  if (state.condoTab === 'encomendas') {
    lista = `<div class="section-t">Na portaria agora<span class="c">${naPort} itens</span></div><div class="list">${mor.filter((u) => pendentes(u.num).length).sort((a, b) => pendentes(b.num).length - pendentes(a.num).length).map((u) => { const p = pendentes(u.num); return `<button class="li" data-a="sel" data-n="${u.num}" style="text-align:left"><img class="thumb" src="./assets/${p[0].foto}.jpg" alt=""><div style="flex:1;min-width:0"><div class="t">Apto ${u.num} · ${u.morador.nome.split(' ')[0]}</div><div class="s">${p.map((e) => e.loja).join(', ')} · ${p[0].ha}</div></div><span class="tag ${p.length > 1 ? 'p' : 'c'}">${p.length}</span></button>`; }).join('')}</div>`;
  } else if (state.condoTab === 'chamados') {
    lista = `<div class="section-t">Chamados por apartamento<span class="c">${ab.length} abertos</span></div><div class="list">${ab.map((c) => `<button class="li" data-a="sel" data-n="${c.unidade}" style="text-align:left"><div class="kpi"><div class="ico ${c.atrasado ? 'r' : 'a'}">${icon('wrench', 15)}</div></div><div style="flex:1;min-width:0"><div class="t">${c.titulo}</div><div class="s">Apto ${c.unidade} · ${c.categoria} · <span class="${c.atrasado ? 'red' : ''}">${c.prazo}</span></div></div></button>`).join('')}</div>`;
  } else {
    lista = `<div class="section-t">Em atraso<span class="c">${inad.length} unidades</span></div><div class="list">${inad.map((u) => { const a = atraso(u.num); return `<button class="li" data-a="sel" data-n="${u.num}" style="text-align:left"><div class="av sm">${u.morador.iniciais}</div><div style="flex:1"><div class="t">Apto ${u.num} · ${u.morador.nome}</div><div class="s">Cota de outubro · ${a.dias} dias</div></div><b class="red num">${brl(a.valor, true)}</b></button>`; }).join('') || '<div class="li muted">Nenhuma unidade em atraso.</div>'}</div>`;
  }
  return `
    <div><div class="eyebrow">Condomínio · entregue em ${EMPREENDIMENTO.entrega}</div><div class="h1" style="font-size:24px;margin-top:4px">Condomínio ${EMPREENDIMENTO.nome}</div><div class="sub">${EMPREENDIMENTO.sindica} · síndica profissional · ${mor.length} apartamentos com morador</div></div>
    <div class="mini-kpis" style="grid-template-columns:1fr 1fr">
      <div><div class="l">${icon('package', 13)}Na portaria</div><div class="v">${naPort}</div><div class="x">${encomendas.filter((e) => e.status === 'aguardando' && /dias/.test(e.ha)).length} há mais de 3 dias</div></div>
      <div class="${late ? 'alert' : ''}"><div class="l">${icon('wrench', 13)}Chamados abertos</div><div class="v">${ab.length}</div><div class="x">${late} fora do prazo</div></div>
      <div><div class="l">${icon('wallet', 13)}Inadimplência</div><div class="v">${inadPct}%</div><div class="x">${inad.length} unidades</div></div>
      <div><div class="l">${icon('calendar-days', 13)}Reservas</div><div class="v">5</div><div class="x">esta semana</div></div>
    </div>
    ${lista}
    <div><div class="section-t">Hoje no prédio<span class="c">portaria · ${EMPREENDIMENTO.porteiro}</span></div><div class="timeline">${visitantes.map((v) => `<div class="ti"><i></i><div><b>${v.hora}</b> · ${v.nome} <span class="muted">— ${v.tipo} · ${v.destino} · ${v.status}</span></div></div>`).join('')}</div></div>
    <div class="li" style="font-size:12px;color:var(--muted)">${icon('info', 16)}Toque num apartamento vermelho para abrir o CRM do morador.</div>`;
}

function panelVenda(u) {
  const P = u.planta; const m2 = Math.round(u.preco / P.area);
  const interessados = clientes.filter((c) => c.interesse === `Apto ${u.num}` && c.etapa !== 'contrato');
  const props = propostas.filter((p) => p.unidade === u.num);
  return `
    <button class="back" data-a="clear">${icon('chevron-left', 15)}Voltar ao espelho</button>
    <div><div class="row between"><div class="eyebrow">${EMPREENDIMENTO.nome}</div>${statusTag(u.status)}</div>
      <div class="h1" style="margin-top:4px">Apto ${u.num}</div>
      <div class="sub">${P.quartos} quartos (${P.suites} suíte) · ${P.area} m² · ${u.andar}º andar · ${P.posicao}</div></div>
    <div><div class="big-price">${brl(u.preco)}</div><div class="sub">${brl(m2)}/m² · tabela de novembro</div></div>
    ${u.status === 'reservado' ? `<div class="li" style="border-color:rgba(255,176,32,.35);background:var(--amber-soft)">${icon('clock', 18, 'amber')}<div><div class="t">Reservado para Marcelo Ventura</div><div class="s">Proposta PR-413 aceita · reserva vence em 24 h</div></div></div>` : ''}
    <div class="plan-thumb" data-a="plan3d" data-n="${u.num}" title="Abrir planta 3D">${planSVG(u.tipo)}<span class="btn sm pri">${icon('rotate-3d', 14)}Planta 3D</span></div>
    <div class="specs"><div class="spec"><b>${P.quartos}</b><span>Quartos</span></div><div class="spec"><b>${P.suites}</b><span>Suítes</span></div><div class="spec"><b>${P.vagas}</b><span>Vagas</span></div><div class="spec"><b>${P.area}</b><span>m²</span></div></div>
    <div class="col" style="gap:8px">
      ${u.status === 'disponivel' ? `<button class="btn pri block" data-a="proposta" data-n="${u.num}">${icon('file-text', 16)}Gerar proposta</button><button class="btn block" data-a="reservar" data-n="${u.num}">${icon('key', 16)}Reservar</button>`
      : `<button class="btn pri block" data-a="vender" data-n="${u.num}">${icon('handshake', 16)}Converter em venda</button><button class="btn block" data-a="liberar" data-n="${u.num}">${icon('rotate-ccw', 16)}Liberar reserva</button>`}
      <button class="btn block" data-a="plan3d" data-n="${u.num}">${icon('armchair', 16)}Ver planta 3D mobiliada</button>
    </div>
    ${interessados.length ? `<div><div class="section-t">Clientes interessados<span class="c">${interessados.length}</span></div><div class="list">${interessados.map((c) => `<div class="li"><div class="av sm">${c.nome.split(' ').map((x) => x[0]).slice(0, 2).join('')}</div><div style="flex:1"><div class="t">${c.nome}</div><div class="s">${({ novo: 'Novo contato', visita: 'Visita agendada', proposta: 'Proposta', reserva: 'Reserva' })[c.etapa]} · ${c.corretor}</div></div></div>`).join('')}</div></div>` : ''}
    ${props.length ? `<div><div class="section-t">Propostas desta unidade</div><div class="list">${props.map((p) => `<div class="li"><div style="flex:1"><div class="t">${p.id} · ${p.cliente}</div><div class="s">${brl(p.valor)} · ${p.desconto}% desc. · válida até ${p.validade}</div></div>${propTag(p.status)}</div>`).join('')}</div></div>` : ''}`;
}
export const propTag = (s) => ({ enviada: '<span class="tag p">Enviada</span>', analise: '<span class="tag a">Em análise</span>', aceita: '<span class="tag g">Aceita</span>', recusada: '<span class="tag r">Recusada</span>' })[s];

function panelMorador(u) {
  const m = u.morador; const P = u.planta;
  const pend = pendentes(u.num); const chs = chamadosAbertos(u.num); const a = atraso(u.num);
  const contas = contasOutubro(u.num);
  return `
    <button class="back" data-a="clear">${icon('chevron-left', 15)}Voltar ao ${state.mode === 'vendas' ? 'espelho' : 'condomínio'}</button>
    <div><div class="row between"><div class="eyebrow">${u.andar}º andar · ${P.posicao} · desde ${m.desde}</div><span class="tag p">Proprietário</span></div>
      <div class="h1" style="margin-top:4px">Apto ${u.num}</div>
      <div class="sub">${P.quartos} quartos (${P.suites} suíte) · ${P.area} m² · ${pend.length} ${pend.length === 1 ? 'encomenda' : 'encomendas'} na portaria</div></div>
    <div class="card glow">
      <div class="row"><div class="av">${m.iniciais}</div><div><div class="faint" style="font-size:11px">mora desde ${m.desde}</div><div style="font-weight:800;font-size:16px">${m.nome}</div><div class="s muted" style="font-size:12px">${m.moradores} moradores${m.pet ? ' · ' + (m.pet === '1 pet' ? '1 pet' : '1 ' + m.pet) : ''} · vaga ${m.vaga}</div></div></div>
      <div class="col" style="gap:4px;margin-top:12px;font-size:12.5px"><span class="row" style="gap:8px">${icon('phone', 14, 'muted')}${m.telefone}</span><span class="row" style="gap:8px">${icon('mail', 14, 'muted')}${m.email}</span></div>
      <div class="row" style="margin-top:12px;gap:8px"><button class="btn wa sm" style="flex:1" data-a="wa" data-n="${u.num}">${icon('message-circle', 15)}WhatsApp</button><button class="btn sm" style="flex:1" data-a="focus" data-n="${u.num}">${icon('building-2', 15)}Ver no prédio</button></div>
    </div>
    <div class="mini-kpis">
      <div><div class="l">${icon('package', 13)}Portaria</div><div class="v">${pend.length}</div><div class="x">${pend.map((e) => e.local.replace('Armário ', '').replace('Prateleira ', '')).join(' · ') || 'nada'}</div></div>
      <div class="${chs.some((c) => c.atrasado) ? 'alert' : ''}"><div class="l">${icon('wrench', 13)}Chamados</div><div class="v">${chs.length}</div><div class="x ${chs.some((c) => c.atrasado) ? 'red' : ''}">${chs.some((c) => c.atrasado) ? 'fora do prazo' : chs.length ? 'no prazo' : 'nenhum'}</div></div>
      <div class="${a ? 'alert' : ''}"><div class="l">${icon('alert-triangle', 13)}Em atraso</div><div class="v ${a ? 'red' : 'green'}" style="font-size:${a ? 15 : 20}px">${a ? brl(a.valor, true) : 'R$ 0'}</div><div class="x">${a ? a.dias + ' dias' : 'em dia'}</div></div>
    </div>
    <button class="li" data-a="morador-app" data-n="${u.num}" style="text-align:left;background:linear-gradient(90deg,rgba(139,92,255,.2),rgba(139,92,255,.05));border-color:rgba(139,92,255,.35)"><div class="kpi"><div class="ico">${icon('smartphone', 16)}</div></div><div style="flex:1"><div class="t">Ver o app do morador</div><div class="s">O que ${m.nome.split(' ')[0]} vê no celular: encomendas, boletos e avisos</div></div>${icon('chevron-right', 16, 'muted')}</button>

    <div><div class="section-t">${icon('package', 15)} Encomendas na portaria<span class="c">${pend.length}</span></div><div class="list">
      ${pend.map((e) => `<div class="li" style="flex-direction:column;align-items:stretch;gap:8px">
        <div class="row" data-a="parcel" data-id="${e.id}" style="cursor:pointer"><img class="thumb" src="./assets/${e.foto}.jpg" alt="Foto da encomenda"><div style="flex:1;min-width:0"><div class="t">${e.loja}</div><div class="s">${cap(e.tipo)} · para ${m.nome.split(' ')[0]}</div><div class="s">Chegou ${e.ha} · por ${e.recebidoPor} · ${e.id}</div></div></div>
        <div class="kv" style="grid-template-columns:1fr 1fr 1fr;font-size:12px"><div><div class="k">Local</div>${e.local}</div><div><div class="k">Retirada</div><b class="num">${e.codigo}</b></div><div><div class="k">Aviso no app</div><span class="green">✓ visto</span></div></div>
        <div class="row" style="gap:6px"><button class="btn wa sm" style="flex:1" data-a="avisar" data-id="${e.id}">${icon('message-circle', 14)}Avisar</button><button class="btn ok sm" style="flex:1" data-a="entregar" data-id="${e.id}">${icon('check', 14)}Entregar</button></div>
      </div>`).join('') || '<div class="li muted" style="font-size:12.5px">Nada na portaria para este apartamento.</div>'}
    </div></div>

    <div><div class="section-t">${icon('wrench', 15)} Chamados<button class="btn xs" data-a="novo-chamado" data-n="${u.num}">${icon('plus', 13)}Abrir chamado</button></div><div class="list">
      ${chs.map((c) => `<div class="li" style="flex-direction:column;align-items:stretch;gap:8px;${c.atrasado ? 'border-color:rgba(255,77,94,.35);background:linear-gradient(180deg,rgba(255,77,94,.12),rgba(255,77,94,.03))' : ''}">
        <div><div class="row between"><div class="t">${c.titulo}</div>${c.status === 'aberto' ? '<span class="tag a">Aberto</span>' : '<span class="tag p">Em andamento</span>'}</div><div class="s" style="margin-top:3px">${c.desc}</div>
        <div class="row wrap" style="gap:6px;margin-top:6px"><span class="tag ${c.prioridade === 'alta' ? 'r' : ''}">${c.prioridade === 'alta' ? 'Alta' : c.prioridade === 'media' ? 'Média' : 'Baixa'}</span><span class="tag ${c.atrasado ? 'r' : ''}">${icon('clock', 11)}${c.prazo}</span></div>
        <div class="s" style="margin-top:6px">Aberto ${c.abertoEm} · ${c.responsavel}</div></div>
        <div class="row" style="gap:6px">${c.status === 'aberto' ? `<button class="btn sm" style="flex:1" data-a="ch-iniciar" data-id="${c.id}">${icon('play', 14)}Iniciar</button>` : ''}<button class="btn ok sm" style="flex:1" data-a="ch-concluir" data-id="${c.id}">${icon('check-check', 14)}Concluir</button></div>
      </div>`).join('') || '<div class="li muted" style="font-size:12.5px">Nenhum chamado aberto.</div>'}
    </div></div>

    <div><div class="section-t">${icon('receipt', 15)} Contas de outubro<span class="c">vencimento dia 10</span></div>
      ${a ? `<div class="card" style="border-color:rgba(255,77,94,.35);background:linear-gradient(160deg,rgba(255,77,94,.2),rgba(255,77,94,.04));margin-bottom:8px;padding:14px">
        <div class="row" style="gap:6px;color:#ff8d98;font-size:12px;font-weight:700">${icon('alert-triangle', 14)}Cota de outubro em atraso · ${a.dias} dias</div>
        <div class="big-price" style="margin-top:4px">${brl(a.valor, true)}</div>
        <div class="s muted" style="font-size:11.5px">${brl(a.original, true)} + multa de 2% e juros de 1% ao mês</div>
        <div class="row" style="gap:6px;margin-top:10px"><button class="btn sm pri" style="flex:1" data-a="pix" data-n="${u.num}">${icon('qr-code', 14)}2ª via com Pix</button><button class="btn sm ok" style="flex:1" data-a="marcar-pago" data-n="${u.num}">${icon('check', 14)}Marcar pago</button></div>
      </div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${contas.map((c) => { const pago = state.contasPagas.has(`${u.num}:${c.id}`) || c.status === 'pago' || (c.id === 'cond' && !a); const late = c.id === 'cond' && a; return `<div class="li" style="flex-direction:column;align-items:stretch;gap:2px;${late ? 'border-color:rgba(255,77,94,.35)' : ''}"><div class="row between"><span class="row" style="gap:6px;font-size:12px;font-weight:700">${icon(c.icon, 14, 'muted')}${c.nome}</span></div><b class="num" style="font-size:16px">${brl(c.valor, true)}</b><span class="s">${late ? `<span class="red">Atrasado ${a.dias} dias</span>` : pago ? '<span class="green">● Pago</span>' : '<span class="green">● Em dia</span>'} · ${c.venc}</span>${!pago && !late ? `<button class="btn xs" style="margin-top:6px" data-a="conta-paga" data-n="${u.num}" data-c="${c.id}">Marcar pago</button>` : ''}</div>`; }).join('')}
      </div></div>

    <div><div class="section-t">${icon('scroll-text', 15)} Histórico</div><div class="timeline">${historico(u).map(([ic, t, s]) => `<div class="ti"><i></i><div><b>${t}</b> <span class="muted">· ${s}</span></div></div>`).join('')}</div></div>

    <div><div class="section-t">${icon('message-circle', 15)} Mensagem pronta para o WhatsApp</div>
      <textarea class="input" id="wa-msg" rows="4" style="width:100%">${waText(u)}</textarea>
      <a class="btn wa block" style="margin-top:8px;text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(waText(u))}" data-a="wa-send">${icon('send', 15)}Enviar para ${m.nome.split(' ')[0]}</a>
    </div>`;
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
function waText(u) {
  const m = u.morador; const pend = pendentes(u.num); const a = atraso(u.num);
  let t = `Olá, ${m.nome.split(' ')[0]}! Aqui é da portaria do ${EMPREENDIMENTO.nome}.`;
  if (pend.length) t += ` Você tem ${pend.length} ${pend.length > 1 ? 'encomendas' : 'encomenda'} aguardando (${pend.map((e) => `${e.loja} – ${e.local}, código ${e.codigo}`).join('; ')}).`;
  if (a) t += ` Lembrete: a cota de outubro está em aberto (${brl(a.valor, true)}). A 2ª via com Pix está no app.`;
  return t + ' Qualquer dúvida, estamos à disposição.';
}

// ===== Modais =====
function modalProposta(num) {
  const u = unidade(num);
  openModal(`<div class="modal-h"><div><div class="eyebrow">Nova proposta</div><div class="h2" style="font-size:18px">Apto ${num} · ${u.planta.quartos} quartos · ${u.planta.area} m²</div></div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div>
    <div class="modal-b"><form id="fp" class="col" style="gap:12px">
      <label class="f">Cliente<select class="select" name="cliente">${clientes.filter((c) => c.etapa !== 'contrato').map((c) => `<option>${c.nome}</option>`).join('')}</select></label>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
        <label class="f">Desconto (%)<input class="input" name="desc" type="number" min="0" max="10" step="0.5" value="3"></label>
        <label class="f">Entrada (%)<input class="input" name="ent" type="number" min="10" max="100" step="5" value="30"></label>
        <label class="f">Parcelas<select class="select" name="parc"><option>36</option><option selected>60</option><option>120</option></select></label>
      </div>
      <div class="card" id="psum"></div>
    </form></div>
    <div class="modal-f"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="psend">${icon('send', 15)}Gerar e enviar proposta</button></div>`, '', (m, close) => {
    const f = m.querySelector('#fp');
    const calc = () => {
      const d = +f.desc.value || 0, e = +f.ent.value || 0, n = +f.parc.value; const total = Math.round(u.preco * (1 - d / 100)); const ent = total * e / 100; const parc = (total - ent) / n;
      m.querySelector('#psum').innerHTML = `<div class="row between"><span class="muted">Tabela</span><span class="num">${brl(u.preco)}</span></div><div class="row between" style="margin-top:4px"><span class="muted">Desconto</span><span class="num green">− ${brl(u.preco - total)}</span></div><div class="sep" style="margin:10px 0"></div><div class="row between"><b>Valor total</b><b class="num" style="font-size:20px">${brl(total)}</b></div><div class="row between" style="margin-top:6px;font-size:12.5px"><span class="muted">Entrada</span><span class="num">${brl(ent)}</span></div><div class="row between" style="font-size:12.5px"><span class="muted">${n}× mensais</span><span class="num">${brl(parc, true)}</span></div>`;
      return { total, d };
    };
    f.oninput = calc; calc();
    m.querySelector('#psend').onclick = () => { const { total, d } = calc(); const id = 'PR-' + (419 + propostas.length - 7); propostas.unshift({ id, cliente: f.cliente.value, unidade: num, valor: total, desconto: d, status: 'enviada', validade: '10/11' }); close(); toast(`Proposta ${id} enviada para ${f.cliente.value}`); renderPanel(); };
  });
}
function modalWA(u, texto) {
  openModal(`<div class="modal-h"><div class="h2">${icon('message-circle', 18)}WhatsApp · ${u.morador.nome}</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div>
    <div class="modal-b"><div class="sub" style="margin:0 0 8px">${u.morador.telefone}</div><textarea class="input" id="wat" rows="6" style="width:100%">${texto}</textarea></div>
    <div class="modal-f"><button class="btn" data-close>Cancelar</button><a class="btn wa" id="wago" target="_blank" rel="noopener" style="text-decoration:none">${icon('send', 15)}Abrir no WhatsApp</a></div>`, '', (m, close) => {
    const upd = () => (m.querySelector('#wago').href = 'https://wa.me/?text=' + encodeURIComponent(m.querySelector('#wat').value));
    m.querySelector('#wat').oninput = upd; upd(); m.querySelector('#wago').addEventListener('click', () => { setTimeout(close, 50); toast('Aviso enviado pelo WhatsApp'); });
  });
}
export function modalParcel(id) {
  const e = encomendas.find((x) => x.id === id); const u = unidade(e.unidade);
  openModal(`<div class="parcel-detail"><img src="./assets/${e.foto}.jpg" alt="Foto da encomenda tirada na portaria">
    <div class="col" style="padding:18px;gap:12px">
      <div class="row between"><div><div class="h2" style="font-size:18px">${e.loja} · ${e.tipo}</div><div class="sub" style="margin:2px 0 0">${e.id} · apto ${e.unidade} · chegou ${e.ha}</div></div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div>
      ${e.status === 'aguardando' ? '<span class="tag g" style="width:max-content"><i class="d"></i>Disponível para retirar</span>' : '<span class="tag" style="width:max-content">Retirada</span>'}
      <div class="kv"><div><div class="k">Unidade</div>Apto ${e.unidade}</div><div><div class="k">Destinatário</div>${u.morador?.nome || '—'}</div><div><div class="k">Tipo</div>${cap(e.tipo)}</div><div><div class="k">Recebido</div>${e.recebido}</div><div><div class="k">Local</div>${e.local}</div><div><div class="k">Recebido por</div>${e.recebidoPor} · portaria</div><div><div class="k">Rastreio</div><span class="num">${e.rastreio}</span></div><div><div class="k">Aviso</div>Enviado · ${e.status === 'aguardando' ? 'ainda não lido' : 'lido'}</div></div>
      <div class="row" style="gap:12px;align-items:flex-start"><div class="qr">${qrSVG(`PRISMA|${e.id}|${e.codigo}`)}</div><div><div class="k eyebrow" style="font-size:10px">Código de retirada</div><div style="font-size:28px;font-weight:800;letter-spacing:.12em" class="num">${e.codigo}</div><div class="s muted" style="font-size:11.5px">QR de retirada · o morador mostra no app</div></div></div>
      <div><div class="eyebrow" style="font-size:10px;margin-bottom:6px">Histórico da correspondência</div><div class="timeline"><div class="ti"><i></i><div>${e.recebido.slice(0, 5)} ${e.recebido.slice(11)} · Registrada na portaria por ${e.recebidoPor}</div></div><div class="ti"><i></i><div>${e.recebido.slice(0, 5)} ${e.recebido.slice(11)} · Aviso enviado no app e no WhatsApp</div></div></div></div>
      <div class="row" style="gap:8px;margin-top:auto;justify-content:flex-end;flex-wrap:wrap"><button class="btn" data-close>Fechar</button><button class="btn wa" data-a="avisar" data-id="${e.id}" data-close>${icon('message-circle', 15)}Avisar</button>${e.status === 'aguardando' ? `<button class="btn pri" data-a="entregar" data-id="${e.id}" data-close>${icon('check', 15)}Entregar</button>` : ''}</div>
    </div></div>`, 'wide');
}
export function modalPlan3D(num) {
  const u = unidade(num); const amb = ambientes(u.tipo); const total = amb.reduce((s, [, a]) => s + a, 0);
  let plan;
  const close = openModal(`<div class="modal-h"><div><div class="eyebrow">${EMPREENDIMENTO.nome} · Apto ${num}</div><div class="h2" style="font-size:18px">${u.planta.quartos} quartos (${u.planta.suites} suíte) · ${u.planta.area} m²</div></div><div class="row" style="gap:6px"><button class="btn sm" id="spin">${icon('pause', 14)}Parar giro</button><button class="btn sm" data-close>${icon('x', 14)}Fechar</button></div></div>
    <div class="plan-view"><div class="plan-stage" id="pst"></div>
    <div class="plan-side"><div class="section-t">Ambientes<span class="c">${amb.length}</span></div>${amb.map(([n, a]) => `<div class="amb"><span>${n}</span><b>${a.toFixed(1).replace('.', ',')} m²</b></div>`).join('')}<div class="amb" style="border:0;margin-top:4px"><b>Área privativa</b><b>${u.planta.area} m²</b></div><div class="s muted" style="font-size:11px;margin-top:8px">Áreas internas aproximadas. Planta ilustrativa, mobiliário decorativo.</div>
      ${u.status !== 'vendido' ? `<div class="sep"></div><div class="big-price" style="font-size:22px">${brl(u.preco)}</div><button class="btn pri block" style="margin-top:10px" data-a="proposta" data-n="${num}" data-close>${icon('file-text', 15)}Gerar proposta</button>` : ''}
    </div></div>`, 'xl', (m, _c, bg) => {
    requestAnimationFrame(() => { plan = createPlan3D(m.querySelector('#pst'), u.tipo); });
    m.querySelector('#spin').onclick = (ev) => { const on = plan.toggleSpin(); ev.currentTarget.innerHTML = on ? icon('pause', 14) + 'Parar giro' : icon('play', 14) + 'Girar'; };
    bg.addEventListener('closed', () => plan?.dispose());
  });
}
export function modalPix(num, onPaid) {
  const a = atraso(num); const code = `00020126580014BR.GOV.BCB.PIX0136prisma-beira-mar-condominio520400005303986540${a.valor.toFixed(2)}5802BR5925COND PRISMA BEIRA MAR6009ORLA NORTE62070503${num}6304A1F3`;
  openModal(`<div class="modal-h"><div class="h2">${icon('qr-code', 18)}2ª via com Pix · Apto ${num}</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div>
    <div class="modal-b" style="display:grid;justify-items:center;gap:12px;text-align:center"><div class="qr" style="padding:10px">${qrSVG(code, 4).replace('<svg', '<svg style="width:180px;height:180px"')}</div><div class="big-price">${brl(a.valor, true)}</div><div class="sub" style="margin:0">Cota de outubro · venceu em 10/10/2026 · ${a.dias} dias com multa e juros</div>
    <input class="input" readonly value="${code}" style="width:100%;font-size:11px" id="pixc"></div>
    <div class="modal-f"><button class="btn" id="copy">${icon('file-text', 15)}Copiar código Pix</button><button class="btn ok" id="paid">${icon('check', 15)}Já paguei</button></div>`, '', (m, close) => {
    m.querySelector('#copy').onclick = () => { try { navigator.clipboard.writeText(code); } catch { } m.querySelector('#pixc').select(); toast('Código Pix copiado'); };
    m.querySelector('#paid').onclick = () => { markPaid(num); close(); onPaid?.(); };
  });
}
function markPaid(num) { state.paid.add(num); toast(`Cota de outubro do apto ${num} marcada como paga`); emit('fin'); }
function modalNovoChamado(num) {
  openModal(`<div class="modal-h"><div class="h2">${icon('wrench', 18)}Abrir chamado${num ? ' · Apto ' + num : ''}</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div>
  <div class="modal-b"><form class="col" id="fc" style="gap:12px">
    ${num ? '' : `<label class="f">Unidade<select class="select" name="un">${unidades.filter((u) => u.morador).map((u) => `<option value="${u.num}">Apto ${u.num} · ${u.morador.nome}</option>`).join('')}</select></label>`}
    <label class="f">Título<input class="input" name="t" required placeholder="Ex.: Tomada da varanda sem energia"></label>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="f">Categoria<select class="select" name="c"><option>Hidráulica</option><option>Elétrica</option><option>Manutenção</option><option>Estrutural</option><option>Convivência</option></select></label><label class="f">Prioridade<select class="select" name="p"><option value="baixa">Baixa</option><option value="media" selected>Média</option><option value="alta">Alta</option></select></label></div>
    <label class="f">Descrição<textarea class="input" name="d" rows="3"></textarea></label></form></div>
  <div class="modal-f"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="cs">Abrir chamado</button></div>`, '', (m, close) => {
    m.querySelector('#cs').onclick = () => { const f = m.querySelector('#fc'); if (!f.t.value.trim()) { f.t.focus(); return; } chamados.unshift({ id: 'CH-0' + (215 + chamados.length - 6), unidade: num || +f.un.value, titulo: f.t.value, desc: f.d.value || 'Sem descrição.', categoria: f.c.value, prioridade: f.p.value, status: 'aberto', abertoEm: '03/11 17:40', prazo: 'vence em 2 dias', responsavel: 'Zelador · Sérgio' }); close(); toast('Chamado aberto'); emit('ch'); };
  });
}

// ===== Ações =====
Object.assign(actions, {
  go: (d) => go(d.v),
  more: () => {
    const items = NAV[1][1].concat([['propostas', 'Propostas', 'file-text']]);
    const bg = document.createElement('div'); bg.className = 'sheet-bg';
    const sh = document.createElement('div'); sh.className = 'sheet';
    sh.innerHTML = items.map(([id, l, ic]) => `<button class="nav-i ${state.view === id ? 'on' : ''}" data-a="go" data-v="${id}">${icon(ic, 20)}<span>${l}</span></button>`).join('');
    const close = () => { bg.remove(); sh.remove(); };
    bg.onclick = close; sh.addEventListener('click', (e) => { if (e.target.closest('[data-a]')) setTimeout(close, 0); });
    document.body.append(bg, sh);
  },
  notifs: () => openModal(`<div class="modal-h"><div class="h2">${icon('bell', 18)}Notificações</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div><div class="modal-b list">
    <div class="li">${icon('alert-triangle', 18, 'red')}<div><div class="t">Chamado fora do prazo</div><div class="s">Apto 501 · Vazamento no cano da cozinha · há 2 h</div></div></div>
    <div class="li">${icon('package', 18, 'amber')}<div><div class="t">Encomenda parada há 5 dias</div><div class="s">Apto 403 · Jadlog · armário A-11</div></div></div>
    <div class="li">${icon('file-text', 18)}<div><div class="t">Proposta PR-417 em análise</div><div class="s">Vítor Hugo Rezende · Apto 601 · vence em 5 dias</div></div></div></div>`),
  mode: (d) => { state.mode = d.m; refreshBuilding(); renderStageChrome(); renderPanel(); },
  ctab: (d) => { state.condoTab = d.t; refreshBuilding(); renderStageChrome(); renderPanel(); },
  sel: (d) => { if (state.view !== 'espelho') go('espelho'); selectUnit(+d.n); },
  clear: () => clearUnit(),
  focus: (d) => { building?.select(+d.n, true); if (window.innerWidth <= 900) document.getElementById('stage').scrollIntoView({ behavior: 'smooth' }); },
  spin: () => { building.setAutoRotate(!building.isAutoRotate()); renderStageChrome(); },
  light: (d) => { building.setLighting(d.l); renderStageChrome(); },
  reset: () => building.resetView(),
  fullscreen: () => { const s = document.getElementById('stage'); try { document.fullscreenElement ? document.exitFullscreen() : s.requestFullscreen?.(); } catch { } },
  proposta: (d) => modalProposta(+d.n),
  plan3d: (d) => modalPlan3D(+d.n),
  reservar: (d) => { const u = unidade(d.n); u.status = 'reservado'; toast(`Apto ${u.num} reservado por 24 h`, 'key'); refreshBuilding(); renderStageChrome(); renderPanel(); },
  liberar: (d) => { const u = unidade(d.n); u.status = 'disponivel'; toast(`Reserva do apto ${u.num} liberada`); refreshBuilding(); renderStageChrome(); renderPanel(); },
  vender: (d) => { const u = unidade(d.n); u.status = 'vendido'; u.morador = { nome: 'Marcelo Ventura', moradores: 3, pet: null, desde: 'nov/2026', iniciais: 'MV', telefone: '(00) 98812-4410', email: 'marcelo.ventura@exemplo.com.br', vaga: 'G1-34', corretor: 'Paulo Costa' }; toast(`Venda do apto ${u.num} registrada`, 'handshake'); refreshBuilding(); renderStageChrome(); renderPanel(); renderNav(); },
  wa: (d) => modalWA(unidade(d.n), waText(unidade(d.n))),
  'wa-send': () => toast('Abrindo o WhatsApp…', 'message-circle'),
  avisar: (d) => { const e = encomendas.find((x) => x.id === d.id); const u = unidade(e.unidade); modalWA(u, `Olá, ${u.morador.nome.split(' ')[0]}! Chegou uma encomenda para você na portaria do ${EMPREENDIMENTO.nome}: ${e.loja} (${e.tipo}), em ${e.local}. Código de retirada: ${e.codigo}.`); },
  entregar: (d) => { const e = encomendas.find((x) => x.id === d.id); e.status = 'retirada'; e.ha = 'retirada agora'; toast(`Encomenda ${e.loja} entregue ao apto ${e.unidade}`, 'package'); emit('enc'); },
  parcel: (d) => modalParcel(d.id),
  'ch-iniciar': (d) => { const c = chamados.find((x) => x.id === d.id); c.status = 'andamento'; toast(`Chamado “${c.titulo}” iniciado`, 'play'); emit('ch'); },
  'ch-concluir': (d) => { const c = chamados.find((x) => x.id === d.id); c.status = 'concluido'; c.atrasado = false; c.prazo = 'concluído 03/11'; toast(`Chamado “${c.titulo}” concluído`, 'check-check'); emit('ch'); },
  'novo-chamado': (d) => modalNovoChamado(d.n ? +d.n : null),
  'marcar-pago': (d) => markPaid(+d.n),
  'conta-paga': (d) => { state.contasPagas.add(`${d.n}:${d.c}`); toast('Conta marcada como paga'); renderPanel(); },
  pix: (d) => modalPix(+d.n),
  'morador-app': (d) => openResidentApp(+d.n),
});

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const fn = actions[el.dataset.a]; if (!fn) return;
  if (el.tagName !== 'A') e.preventDefault();
  fn(el.dataset, el, e);
});

onChange(() => {
  renderNav(); refreshBuilding(); renderStageChrome(); renderPanel();
  if (state.view !== 'espelho') renderPage(state.view, document.getElementById('view-page'), true);
});

renderNav(); mountEspelho();
