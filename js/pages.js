import { icon } from './icons.js';
import { EMPREENDIMENTO, brl, mi, vendasMes, ranking, ETAPAS, AREAS, documentos } from './data.js';
import { actions, state, pendentes, chamadosAbertos, atraso, stats, toast, openModal, statusTag, unidades, encomendas, chamados, propostas, clientes, reservas, comunicados, unidade, emit } from './store.js';
import { propTag, modalParcel, modalPlan3D, modalPix } from './app.js';
import { openResidentApp } from './resident.js';

let charts = [];
const local = { uq: '', us: 'todas', ut: 'todas', pf: 'aguardando', cq: '' };

export function renderPage(view, el, isUpdate = false) {
  charts.forEach((c) => c.destroy()); charts = [];
  const scroll = el.scrollTop;
  el.innerHTML = (PAGES[view] || PAGES.geral)();
  AFTER[view]?.(el);
  if (isUpdate) el.scrollTop = scroll;
}

const head = (eyebrow, title, small, right = '') => `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><div class="h1" style="margin-top:6px">${title}${small ? ` <small>${small}</small>` : ''}</div></div><div class="row wrap">${right}</div></div>`;
const kpi = (ic, cls, lab, val, meta) => `<div class="card kpi"><div class="lab"><span class="ico ${cls}">${icon(ic, 15)}</span>${lab}</div><div class="val">${val}</div><div class="meta">${meta}</div></div>`;
const ini = (n) => n.split(' ').map((x) => x[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join('');

function chartDefaults() {
  const C = window.Chart; if (!C) return null;
  C.defaults.color = '#9a9ab0'; C.defaults.font.family = 'Satoshi, system-ui, sans-serif'; C.defaults.font.size = 11;
  C.defaults.borderColor = 'rgba(255,255,255,.06)';
  return C;
}
function grad(ctx, a, b) { const g = ctx.createLinearGradient(0, 0, 0, ctx.canvas.clientHeight || 230); g.addColorStop(0, a); g.addColorStop(1, b); return g; }

const PAGES = {
  geral() {
    const s = stats(); const pct = Math.round((s.vendidoV / s.vgv) * 100);
    const funil = ETAPAS.map(([id, l]) => [l, clientes.filter((c) => c.etapa === id).length]); const maxF = Math.max(...funil.map((f) => f[1]));
    return `${head('Prisma Incorporadora', 'Visão geral', 'nov. 2026', `<span class="tag p">1 empreendimento</span><span class="tag">${s.total} unidades</span>`)}
    <div class="grid dash">
      <div class="card glow hero-kpi span-8"><div><div class="kpi"><div class="lab"><span class="ico">${icon('trophy', 15)}</span>VGV vendido</div><div class="val" style="font-size:38px">${mi(s.vendidoV)}</div><div class="meta">${pct}% do VGV lançado de ${mi(s.vgv)} · ${s.vendido} unidades · ${s.familias} famílias morando</div></div>
        <div class="bar lg" style="margin-top:16px;max-width:520px"><i style="width:${(s.vendido / s.total) * 100}%;background:linear-gradient(90deg,#ff4d5e,#ff7a86)"></i><i style="width:${(s.reservado / s.total) * 100}%;background:var(--amber)"></i><i style="width:${(s.disponivel / s.total) * 100}%;background:linear-gradient(90deg,#1fb86a,#2fd27a)"></i></div>
        <div class="legend" style="margin-top:8px"><span><i class="sw" style="color:var(--red)"></i>Vendido <b>${s.vendido}</b></span><span><i class="sw" style="color:var(--amber)"></i>Reservado <b>${s.reservado}</b></span><span><i class="sw" style="color:var(--green)"></i>Disponível <b>${s.disponivel}</b></span></div></div>
        ${stackArt(s)}</div>
      <div class="span-4 grid" style="grid-template-columns:1fr 1fr">
        ${kpi('layout-grid', 'g', 'Disponível', s.disponivel, mi(s.dispV) + ' em estoque')}
        ${kpi('key', 'a', 'Reservas ativas', s.reservado, '1 vence em 24 h')}
        ${kpi('trending-up', 'c', 'VSO outubro', '5,3%', '1 venda no mês')}
        ${kpi('badge-dollar-sign', '', 'Ticket médio', mi(s.vendidoV / s.vendido), 'unidades vendidas')}
      </div>
      <div class="card span-8"><div class="card-h"><div class="h2">Vendas por mês <small>unidades · 2026</small></div><span class="tag g">${icon('trending-up', 12)}3 vendas em nov.</span></div><div class="chart-box"><canvas id="ch-vendas" aria-label="Vendas por mês"></canvas></div></div>
      <div class="card span-4"><div class="card-h"><div class="h2">Funil de clientes <small>${clientes.length} no CRM</small></div></div><div class="funnel">${funil.map(([l, n]) => `<div class="fr"><span class="muted">${l}</span><div class="bar" style="height:10px"><i class="fb" style="width:${(n / maxF) * 100}%"></i></div><b class="num right">${n}</b></div>`).join('')}</div>
        <div class="sep"></div><div class="row between" style="font-size:12px"><span class="muted">Conversão visita → contrato</span><b class="num">47%</b></div></div>
      <div class="card span-7"><div class="card-h"><div class="h2">Empreendimentos</div><button class="btn xs" data-a="go" data-v="espelho">${icon('rotate-3d', 13)}Abrir espelho 3D</button></div>
        <div class="row between wrap" style="gap:14px"><div><div style="font-weight:800;font-size:15px">${EMPREENDIMENTO.nome}</div><div class="sub" style="margin:2px 0 0">${EMPREENDIMENTO.local} · pronto para morar · entregue em ${EMPREENDIMENTO.entrega}</div></div><div style="min-width:200px;flex:1;max-width:320px"><div class="bar"><i style="width:${pct}%;background:linear-gradient(90deg,#1fb86a,#2fd27a)"></i><i style="width:${100 - pct}%;background:rgba(255,77,94,.55)"></i></div><div class="row between" style="font-size:11.5px;margin-top:4px"><span class="muted">vendido</span><b>${pct}% vendido</b></div></div></div>
        <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-top:14px">${[['VGV', mi(s.vgv)], ['Vendido', mi(s.vendidoV)], ['Estoque', mi(s.dispV)], ['m² médio', brl(Math.round(s.vgv / unidades.reduce((a, u) => a + u.planta.area, 0)))]].map(([l, v]) => `<div class="spec" style="text-align:left"><span>${l}</span><b style="font-size:14px;margin-top:2px">${v}</b></div>`).join('')}</div></div>
      <div class="card span-5"><div class="card-h"><div class="h2">Ranking de corretores <small>vendas desde o lançamento</small></div></div><div class="rank">${ranking.map(([n, q, v], i) => `<div class="rr"><span class="medal m${i + 1}">${i + 1}</span><span class="av sm">${ini(n)}</span><div><div style="font-weight:700">${n}</div><div class="s muted" style="font-size:11.5px">${q} vendas</div></div><b class="num">${mi(v)}</b></div>`).join('')}</div></div>
    </div>`;
  },

  unidades() {
    const s = stats();
    const rows = unidades.filter((u) => (local.us === 'todas' || u.status === local.us) && (local.ut === 'todas' || u.tipo === local.ut) && (!local.uq || String(u.num).includes(local.uq) || (u.morador?.nome || '').toLowerCase().includes(local.uq.toLowerCase())));
    return `${head(EMPREENDIMENTO.nome, 'Unidades', 'tabela de novembro', `<button class="btn sm" data-a="export-csv">${icon('file-bar-chart', 14)}Exportar CSV</button>`)}
    <div class="card glow" style="margin-bottom:14px"><div class="row between wrap"><div><div class="eyebrow">Disponíveis para venda</div><div class="val num" style="font-size:30px;font-weight:800;margin-top:4px">${s.disponivel} <span class="muted" style="font-size:18px;font-weight:500">de ${s.total}</span></div><div class="sub" style="margin:0">${mi(s.dispV)} em estoque</div></div>
      <div style="flex:1;min-width:240px;max-width:640px"><div class="bar lg"><i style="width:${(s.disponivel / s.total) * 100}%;background:linear-gradient(90deg,#1fb86a,#2fd27a)"></i><i style="width:${(s.reservado / s.total) * 100}%;background:var(--amber)"></i><i style="width:${(s.vendido / s.total) * 100}%;background:linear-gradient(90deg,#ff4d5e,#c4283a)"></i></div>
      <div class="legend" style="margin-top:8px"><span><i class="sw" style="color:var(--green)"></i>Disponível <b>${s.disponivel}</b></span><span><i class="sw" style="color:var(--amber)"></i>Reservado <b>${s.reservado}</b></span><span><i class="sw" style="color:var(--red)"></i>Vendido <b>${s.vendido}</b></span><span><i class="sw" style="color:#4a4a58"></i>Bloqueado <b>${s.bloqueado}</b></span></div></div></div></div>
    <div class="row wrap" style="margin-bottom:12px;gap:8px"><div style="position:relative;flex:1;min-width:200px;max-width:340px"><span style="position:absolute;left:11px;top:9px" class="muted">${icon('search', 16)}</span><input class="input" id="uq" placeholder="Buscar por número ou comprador" value="${local.uq}" style="width:100%;padding-left:34px"></div>
      <select class="select" id="ut"><option value="todas">Todas as plantas</option><option value="A" ${local.ut === 'A' ? 'selected' : ''}>Tipo A · 98 m²</option><option value="B" ${local.ut === 'B' ? 'selected' : ''}>Tipo B · 74 m²</option></select>
      <select class="select" id="us"><option value="todas">Todas as situações</option>${['disponivel', 'reservado', 'vendido'].map((x) => `<option value="${x}" ${local.us === x ? 'selected' : ''}>${{ disponivel: 'Disponível', reservado: 'Reservado', vendido: 'Vendido' }[x]}</option>`).join('')}</select></div>
    <div class="tbl-wrap"><table><thead><tr><th>Unidade</th><th>Empreendimento</th><th>Planta</th><th class="right">Área</th><th class="right">Andar</th><th class="right">Valor</th><th class="right">R$/m²</th><th>Situação</th><th>Cliente</th><th></th></tr></thead><tbody>
      ${rows.map((u) => `<tr class="click" data-a="sel" data-n="${u.num}"><td><b>${u.num}</b></td><td class="muted">${EMPREENDIMENTO.nome}</td><td>${u.planta.quartos} quartos (${u.planta.suites} suíte)</td><td class="right">${u.planta.area} m²</td><td class="right">${u.andar}º</td><td class="right"><b>${brl(u.preco)}</b></td><td class="right muted">${brl(Math.round(u.preco / u.planta.area))}</td><td>${statusTag(u.status)}</td><td>${u.morador?.nome || (u.status === 'reservado' ? 'Marcelo Ventura' : '<span class="faint">—</span>')}</td><td class="right"><button class="btn xs" data-a="plan3d" data-n="${u.num}">${icon('rotate-3d', 12)}Planta</button></td></tr>`).join('') || '<tr><td colspan="10" class="muted" style="text-align:center;padding:30px">Nenhuma unidade encontrada com esses filtros.</td></tr>'}
    </tbody></table></div>`;
  },

  clientes() {
    return `${head('CRM de vendas', 'Clientes do CRM', `${clientes.length} clientes`, `<button class="btn pri sm" data-a="novo-cliente">${icon('plus', 14)}Novo cliente</button>`)}
    <div class="kanban">${ETAPAS.map(([id, l]) => { const cs = clientes.filter((c) => c.etapa === id); return `<div class="kcol"><div class="kcol-h"><span>${l}</span><span class="tag">${cs.length}</span></div>${cs.map((c) => `<div class="kcard"><div class="row"><span class="av sm">${ini(c.nome)}</span><div style="min-width:0"><div class="t">${c.nome}</div><div class="s">${c.interesse} · ${c.origem}</div></div></div><div class="row between"><span class="s">${c.corretor} · ${c.ultimo}</span>${id !== 'contrato' ? `<button class="btn xs" data-a="avancar" data-id="${c.id}" aria-label="Avançar etapa">${icon('chevron-right', 13)}</button>` : `<span class="tag g">${icon('check', 11)}</span>`}</div></div>`).join('')}</div>`; }).join('')}</div>`;
  },

  propostas() {
    const cnt = (s) => propostas.filter((p) => p.status === s).length; const tot = propostas.length;
    return `${head('Comercial', 'Propostas comerciais', '', '')}
    <div class="card glow" style="margin-bottom:14px"><div class="eyebrow">Total registrado</div><div class="val num" style="font-size:30px;font-weight:800;margin-top:4px">${tot} propostas</div>
      <div class="bar lg" style="margin-top:10px">${[['enviada', '#8b5cff'], ['analise', 'var(--amber)'], ['aceita', 'var(--green)'], ['recusada', '#5b5b6b']].map(([s, c]) => `<i style="width:${(cnt(s) / tot) * 100}%;background:${c}"></i>`).join('')}</div>
      <div class="legend" style="margin-top:8px"><span><i class="sw" style="color:#8b5cff"></i>Enviada <b>${cnt('enviada')}</b></span><span><i class="sw" style="color:var(--amber)"></i>Em análise <b>${cnt('analise')}</b></span><span><i class="sw" style="color:var(--green)"></i>Aceita <b>${cnt('aceita')}</b></span><span><i class="sw" style="color:#5b5b6b"></i>Recusada <b>${cnt('recusada')}</b></span></div></div>
    <div class="tbl-wrap"><table><thead><tr><th>Nº</th><th>Cliente</th><th>Unidade</th><th class="right">Valor total</th><th class="right">Desconto</th><th>Situação</th><th>Validade</th><th></th></tr></thead><tbody>
      ${propostas.map((p) => `<tr><td class="muted">${p.id}</td><td><b>${p.cliente}</b></td><td>${EMPREENDIMENTO.nome} · ${p.unidade}</td><td class="right"><span class="vbar"><i style="width:${(p.valor / 1.6e6) * 100}%"></i></span><b>${brl(p.valor)}</b></td><td class="right">${p.desconto}%</td><td>${propTag(p.status)}</td><td>${p.validade}</td><td class="right">${p.status === 'enviada' || p.status === 'analise' ? `<button class="btn xs ok" data-a="prop-aceitar" data-id="${p.id}">Aceitar</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div>`;
  },

  portaria() {
    const ag = encomendas.filter((e) => e.status === 'aguardando'); const ret = encomendas.filter((e) => e.status === 'retirada');
    const paradas = ag.filter((e) => /\d+ dias/.test(e.ha) && parseInt(e.ha.match(/\d+/)[0]) >= 3);
    const lockersUsed = new Map(ag.filter((e) => e.local.startsWith('Armário')).map((e) => [parseInt(e.local.match(/\d+/)[0]), e]));
    const list = local.pf === 'aguardando' ? ag : local.pf === 'paradas' ? paradas : local.pf === 'retiradas' ? ret : encomendas;
    return `${head('Portaria · ' + EMPREENDIMENTO.porteiro + ' de plantão', 'Encomendas e visitantes', '', `<button class="btn sm" data-a="retirada">${icon('qr-code', 14)}Retirada</button><button class="btn pri sm" data-a="nova-enc">${icon('camera', 14)}Registrar encomenda</button>`)}
    <div class="card locker-hero" style="margin-bottom:14px"><img src="./assets/locker.jpg" alt="Armário inteligente da portaria">
      <div class="lk-side"><div class="row between"><div class="h2">Armário inteligente</div><span class="tag c">${lockersUsed.size} de 24 ocupados</span></div>
        <div class="lockers" style="margin-top:12px">${Array.from({ length: 24 }, (_, i) => { const e = lockersUsed.get(i + 1); const late = e && /dias/.test(e.ha); return `<button class="lk ${e ? (late ? 'late' : 'on') : ''}" ${e ? `data-a="parcel" data-id="${e.id}" title="Apto ${e.unidade} · ${e.loja}"` : ''}>${e ? e.unidade : 'A-' + String(i + 1).padStart(2, '0')}</button>`; }).join('')}</div>
        <div class="legend" style="margin-top:10px"><span><i class="sw" style="color:var(--cyan)"></i>Ocupado</span><span><i class="sw" style="color:var(--amber)"></i>Parado há +2 dias</span><span><i class="sw" style="color:#2a2a35"></i>Livre</span></div></div></div>
    <div class="grid kpis" style="margin-bottom:18px">
      ${kpi('archive', 'c', 'Armários ocupados', `${lockersUsed.size} <small>de 24</small>`, 'prateleiras P1 e P2 à parte')}
      ${kpi('truck', '', 'Chegaram hoje', ag.filter((e) => e.recebido.startsWith('03/11')).length, 'até agora')}
      ${kpi('check-check', 'g', 'Retiradas hoje', ret.length, 'com código ou QR')}
      ${kpi('alert-triangle', 'a', 'Paradas há mais de 3 dias', paradas.length, 'lembrete automático enviado')}
    </div>
    <div class="row between wrap" style="margin-bottom:12px"><div class="h2" style="font-size:17px">Correspondências <small style="color:#b494ff">com foto da portaria</small></div>
      <div class="pills">${[['aguardando', 'Aguardando', ag.length], ['paradas', 'Paradas há +3 dias', paradas.length], ['retiradas', 'Retiradas hoje', ret.length], ['todas', 'Todas', encomendas.length]].map(([k, l, n]) => `<button class="pill ${local.pf === k ? 'on' : ''}" data-a="pf" data-k="${k}">${l} <span class="faint">${n}</span></button>`).join('')}</div></div>
    <div class="parcels">${list.map((e) => { const u = unidade(e.unidade); return `<div class="parcel"><button class="ph" data-a="parcel" data-id="${e.id}" aria-label="Ver encomenda ${e.id}"><img src="./assets/${e.foto}.jpg" alt="" loading="lazy"><span class="apt">${icon('home', 11)} ${e.unidade}</span><span class="ha">${e.ha}</span>${e.status === 'aguardando' ? '<span class="tag g"><i class="d"></i>Disponível para retirar</span>' : '<span class="tag">Retirada</span>'}</button>
      <div class="bd"><div class="row between"><span class="t">${e.loja}</span>${e.fragil ? '<span class="tag a">Frágil</span>' : ''}</div><div class="s">${e.tipo} · ${u.morador?.nome || '—'}</div><div class="s">${e.local} · ${e.id}</div>
      ${e.status === 'aguardando' ? `<div class="acts"><button class="btn xs wa" style="flex:1" data-a="avisar" data-id="${e.id}">${icon('message-circle', 12)}Avisar</button><button class="btn xs ok" style="flex:1" data-a="entregar" data-id="${e.id}">${icon('check', 12)}Entregar</button></div>` : ''}</div></div>`; }).join('') || '<div class="card muted">Nada por aqui.</div>'}</div>
    <div class="h2" style="font-size:17px;margin:26px 0 12px">Visitantes e prestadores <small>hoje</small></div>
    <div class="tbl-wrap"><table><thead><tr><th>Hora</th><th>Nome</th><th>Tipo</th><th>Destino</th><th>Status</th></tr></thead><tbody>${(window.__vis || []).concat(VIS()).map((v) => `<tr><td class="num">${v.hora}</td><td><b>${v.nome}</b></td><td class="muted">${v.tipo}</td><td>${v.destino}</td><td>${v.status === 'No prédio' ? '<span class="tag g"><i class="d"></i>No prédio</span>' : `<span class="tag">${v.status}</span>`}</td></tr>`).join('')}</tbody></table></div>`;
  },

  chamados() {
    const col = (st, l) => { const cs = chamados.filter((c) => c.status === st); return `<div class="kcol"><div class="kcol-h"><span>${l}</span><span class="tag">${cs.length}</span></div>${cs.map((c) => `<div class="kcard" style="${c.atrasado ? 'border-color:rgba(255,77,94,.4);background:linear-gradient(180deg,rgba(255,77,94,.14),rgba(255,77,94,.03))' : ''}"><div class="row between"><span class="faint" style="font-size:11px">${c.id} · Apto ${c.unidade}</span><span class="tag ${c.prioridade === 'alta' ? 'r' : c.prioridade === 'media' ? 'a' : ''}">${{ alta: 'Alta', media: 'Média', baixa: 'Baixa' }[c.prioridade]}</span></div><div class="t">${c.titulo}</div><div class="s">${c.desc}</div><div class="row wrap" style="gap:6px"><span class="tag">${c.categoria}</span><span class="tag ${c.atrasado ? 'r' : ''}">${icon('clock', 11)}${c.prazo}</span></div><div class="s">${c.responsavel}</div>
      ${st !== 'concluido' ? `<div class="row" style="gap:6px">${st === 'aberto' ? `<button class="btn xs" style="flex:1" data-a="ch-iniciar" data-id="${c.id}">${icon('play', 12)}Iniciar</button>` : ''}<button class="btn xs ok" style="flex:1" data-a="ch-concluir" data-id="${c.id}">${icon('check-check', 12)}Concluir</button><button class="btn xs" data-a="sel" data-n="${c.unidade}" aria-label="Ver no prédio">${icon('building-2', 12)}</button></div>` : ''}</div>`).join('') || '<div class="s muted" style="padding:6px">Nenhum.</div>'}</div>`; };
    const ab = chamados.filter((c) => c.status !== 'concluido');
    return `${head('Condomínio', 'Chamados', `${ab.length} em aberto`, `<button class="btn pri sm" data-a="novo-chamado">${icon('plus', 14)}Abrir chamado</button>`)}
    <div class="grid kpis" style="margin-bottom:16px">${kpi('wrench', 'a', 'Em aberto', ab.length, 'aguardando ou em execução')}${kpi('alert-triangle', 'r', 'Fora do prazo', ab.filter((c) => c.atrasado).length, 'SLA de 24 h para alta prioridade')}${kpi('check-check', 'g', 'Concluídos no mês', chamados.filter((c) => c.status === 'concluido').length + 9, 'tempo médio 1,8 dia')}${kpi('star', '', 'Satisfação', '4,7', 'avaliação dos moradores')}</div>
    <div class="kanban k3">${col('aberto', 'Abertos')}${col('andamento', 'Em andamento')}${col('concluido', 'Concluídos')}</div>`;
  },

  financeiro() {
    const mor = unidades.filter((u) => u.morador); const inad = mor.filter((u) => atraso(u.num));
    const totalAtraso = inad.reduce((s, u) => s + atraso(u.num).valor, 0); const arrec = (mor.length - inad.length) * 1421.2;
    return `${head('Condomínio · outubro 2026', 'Financeiro', '', `<button class="btn sm" data-a="prest">${icon('file-bar-chart', 14)}Prestação de contas</button>`)}
    <div class="grid kpis" style="margin-bottom:14px">${kpi('circle-dollar-sign', 'g', 'Arrecadado em outubro', brl(arrec, true), `${mor.length - inad.length} de ${mor.length} cotas pagas`)}${kpi('alert-triangle', 'r', 'Inadimplência', ((inad.length / mor.length) * 100).toFixed(1).replace('.', ',') + '%', `${brl(totalAtraso, true)} em aberto`)}${kpi('wallet', '', 'Fundo de reserva', 'R$ 86.420,00', '+ R$ 2.410 no mês')}${kpi('receipt', 'a', 'Cota de novembro', 'R$ 1.418,58', 'vence em 10/11')}</div>
    <div class="grid dash">
      <div class="card span-7"><div class="card-h"><div class="h2">Arrecadação x despesas <small>2026</small></div></div><div class="chart-box"><canvas id="ch-fin"></canvas></div></div>
      <div class="card span-5"><div class="card-h"><div class="h2">Em atraso <small>${inad.length} unidades</small></div></div><div class="list">${inad.map((u) => { const a = atraso(u.num); return `<div class="li"><div class="av sm">${u.morador.iniciais}</div><div style="flex:1;min-width:0"><div class="t">Apto ${u.num} · ${u.morador.nome}</div><div class="s">Cota de outubro · <span class="red">${a.dias} dias</span></div></div><div style="text-align:right"><b class="num red">${brl(a.valor, true)}</b><div class="row" style="gap:4px;margin-top:4px;justify-content:flex-end"><button class="btn xs" data-a="pix" data-n="${u.num}">Pix</button><button class="btn xs ok" data-a="marcar-pago" data-n="${u.num}">Pago</button></div></div></div>`; }).join('') || '<div class="li muted">Nenhuma unidade em atraso. Tudo em dia.</div>'}</div></div>
      <div class="card span-12"><div class="card-h"><div class="h2">Despesas de outubro</div></div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${[['Folha e encargos', 6840], ['Água e esgoto', 2120.4], ['Energia áreas comuns', 1780.1], ['Manutenção elevadores', 1650], ['Limpeza e jardinagem', 1380], ['Segurança / portaria', 2650], ['Administradora', 1100]].map(([n, v]) => `<div class="spec" style="text-align:left"><span>${n}</span><b style="font-size:15px;margin-top:3px">${brl(v, true)}</b></div>`).join('')}</div></div>
    </div>`;
  },

  reservas() {
    return `${head('Condomínio', 'Reservas', 'áreas comuns', `<button class="btn pri sm" data-a="nova-reserva">${icon('plus', 14)}Nova reserva</button>`)}
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));margin-bottom:16px">${AREAS.map((a) => { const n = reservas.filter((r) => r.area === a).length; return `<div class="card"><div class="row between"><b>${a}</b><span class="tag ${n ? 'p' : ''}">${n}</span></div><div class="s muted" style="font-size:12px;margin-top:4px">${n ? 'próxima: ' + reservas.find((r) => r.area === a).quando : 'livre esta semana'}</div></div>`; }).join('')}</div>
    <div class="tbl-wrap"><table><thead><tr><th>Área</th><th>Unidade</th><th>Morador</th><th>Quando</th><th>Situação</th><th></th></tr></thead><tbody>${reservas.map((r, i) => `<tr><td><b>${r.area}</b></td><td>Apto ${r.unidade}</td><td>${r.quem}</td><td>${r.data} · ${r.quando}</td><td>${r.status === 'confirmada' ? '<span class="tag g">Confirmada</span>' : '<span class="tag a">Pendente</span>'}</td><td class="right">${r.status === 'pendente' ? `<button class="btn xs ok" data-a="res-conf" data-i="${i}">Confirmar</button>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
  },

  comunicados() {
    return `${head('Condomínio', 'Comunicados', 'mural do prédio', '')}
    <div class="grid dash"><div class="span-7 col">${comunicados.map((c) => `<div class="card"><div class="row between"><div class="h2">${c.titulo}</div><span class="tag ${c.tag === 'Novo' ? 'p' : ''}">${c.tag}</span></div><div class="s muted" style="font-size:12px;margin:4px 0 8px">${c.autor} · ${c.quando}</div><div style="font-size:13.5px;color:#d6d6e4">${c.texto}</div><div class="row" style="margin-top:10px;gap:14px;font-size:12px" class="muted"><span class="muted">${icon('eye', 13)} ${12 + c.titulo.length % 6} de 17 leram</span></div></div>`).join('')}</div>
    <div class="span-5"><div class="card glow"><div class="h2" style="margin-bottom:12px">${icon('megaphone', 16)}Novo comunicado</div><form id="fcom" class="col"><input class="input" name="t" placeholder="Título" required><textarea class="input" name="x" rows="5" placeholder="Escreva o aviso para os moradores"></textarea><label class="row" style="font-size:12.5px;gap:8px"><input type="checkbox" checked name="wa"> Enviar também pelo WhatsApp</label><button class="btn pri" type="submit">${icon('send', 15)}Publicar no mural</button></form></div></div></div>`;
  },

  moradores() {
    const mor = unidades.filter((u) => u.morador).filter((u) => !local.cq || u.morador.nome.toLowerCase().includes(local.cq.toLowerCase()) || String(u.num).includes(local.cq));
    return `${head('Condomínio', 'Moradores', `${unidades.filter((u) => u.morador).length} famílias`, `<div style="position:relative"><span style="position:absolute;left:11px;top:9px" class="muted">${icon('search', 16)}</span><input class="input" id="cq" placeholder="Buscar morador ou apto" value="${local.cq}" style="padding-left:34px;width:240px"></div>`)}
    <div class="tbl-wrap"><table><thead><tr><th>Apto</th><th>Morador</th><th>Moradores</th><th>Telefone</th><th>Vaga</th><th>Portaria</th><th>Financeiro</th><th></th></tr></thead><tbody>${mor.map((u) => { const a = atraso(u.num); const p = pendentes(u.num).length; return `<tr class="click" data-a="sel" data-n="${u.num}"><td><b>${u.num}</b></td><td><div class="row" style="gap:8px"><span class="av sm">${u.morador.iniciais}</span>${u.morador.nome}</div></td><td>${u.morador.moradores}${u.morador.pet ? ' · pet' : ''}</td><td class="muted">${u.morador.telefone}</td><td>${u.morador.vaga}</td><td>${p ? `<span class="tag c">${p} ${p > 1 ? 'itens' : 'item'}</span>` : '<span class="faint">—</span>'}</td><td>${a ? `<span class="tag r">${a.dias} dias</span>` : '<span class="tag g">Em dia</span>'}</td><td class="right"><button class="btn xs" data-a="morador-app" data-n="${u.num}">${icon('smartphone', 12)}App</button></td></tr>`; }).join('')}</tbody></table></div>`;
  },

  ajustes() {
    return `${head('Sistema', 'Ajustes', '', '')}
    <div class="grid dash"><div class="card span-6"><div class="h2" style="margin-bottom:12px">Empreendimento</div><div class="col"><label class="f">Nome<input class="input" value="${EMPREENDIMENTO.nome}"></label><label class="f">Endereço<input class="input" value="${EMPREENDIMENTO.endereco}"></label><label class="f">Síndica<input class="input" value="${EMPREENDIMENTO.sindica}"></label><label class="f">Tabela vigente<select class="select"><option>Novembro 2026</option><option>Outubro 2026</option></select></label></div></div>
    <div class="card span-6"><div class="h2" style="margin-bottom:12px">Avisos automáticos</div><div class="col">${[['Avisar morador no WhatsApp quando a encomenda chegar', true], ['Lembrete de encomenda parada há 3 dias', true], ['Cobrança amigável 3 dias após o vencimento', true], ['Resumo diário de chamados para a síndica', false]].map(([l, on]) => `<label class="row between li" style="cursor:pointer"><span style="font-size:13px">${l}</span><input type="checkbox" ${on ? 'checked' : ''} data-a="toggle-set" style="width:18px;height:18px;accent-color:#8b5cff"></label>`).join('')}</div>
    <div class="h2" style="margin:16px 0 8px">Modelo de mensagem · encomenda</div><textarea class="input" rows="3" style="width:100%">Olá, {nome}! Chegou {loja} para você na portaria. Local: {local}. Código de retirada: {codigo}.</textarea></div></div>`;
  },
};

const VIS = () => [
  { nome: 'Paulo Costa', tipo: 'Corretor', destino: 'Apto 601 (visita)', hora: '16:20', status: 'No prédio' },
  { nome: 'Marcos Vinícius', tipo: 'Prestador · hidráulica', destino: 'Apto 501', hora: '15:05', status: 'No prédio' },
  { nome: 'Sofia Lacerda', tipo: 'Visitante', destino: 'Apto 103', hora: '14:12', status: 'Saiu 15:40' },
  { nome: 'Entregador Loggi', tipo: 'Entrega', destino: 'Portaria', hora: '13:30', status: 'Saiu 13:34' },
];

function stackArt(s) {
  // pilha isométrica de andares (verde/vermelho), como no painel original
  let svg = '<svg class="stack-art" viewBox="0 0 150 130" aria-hidden="true">';
  for (let f = 0; f < 8; f++) {
    const y = 108 - f * 11;
    for (let c = 0; c < 4; c++) {
      const u = unidades[f * 4 + c]; const col = u.status === 'vendido' ? ['#ff4d5e', '#c4283a', '#8f1d2b'] : u.status === 'reservado' ? ['#ffc24d', '#d99213', '#9a6608'] : ['#3ae08a', '#1fb86a', '#127a45'];
      const x = 30 + c * 22 - 0; const yy = y - c * 0;
      svg += `<g transform="translate(${x - f * 0},${yy})"><path d="M0 0 l11 -6 l11 6 l-11 6z" fill="${col[0]}"/><path d="M0 0 l11 6 v5 l-11 -6z" fill="${col[1]}"/><path d="M22 0 l-11 6 v5 l11 -6z" fill="${col[2]}"/></g>`;
    }
  }
  return svg + '</svg>';
}

const AFTER = {
  geral(el) {
    const C = chartDefaults(); if (!C) return; const cv = el.querySelector('#ch-vendas'); const ctx = cv.getContext('2d');
    charts.push(new C(cv, { type: 'bar', data: { labels: vendasMes.map((v) => v[0]), datasets: [{ data: vendasMes.map((v) => v[1]), backgroundColor: grad(ctx, 'rgba(196,176,255,.95)', 'rgba(106,67,255,.35)'), borderRadius: 8, borderSkipped: false, maxBarThickness: 34 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ${c.raw} ${c.raw === 1 ? 'venda' : 'vendas'}` } } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(255,255,255,.05)' } }, x: { grid: { display: false } } } } }));
  },
  unidades(el) {
    const q = el.querySelector('#uq'); q.oninput = () => { local.uq = q.value; renderPage('unidades', el, true); const n = el.querySelector('#uq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
    el.querySelector('#us').onchange = (e) => { local.us = e.target.value; renderPage('unidades', el, true); };
    el.querySelector('#ut').onchange = (e) => { local.ut = e.target.value; renderPage('unidades', el, true); };
  },
  financeiro(el) {
    const C = chartDefaults(); if (!C) return; const cv = el.querySelector('#ch-fin');
    const labels = ['MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT'];
    charts.push(new C(cv, { type: 'line', data: { labels, datasets: [
      { label: 'Arrecadação', data: [11.2, 14.1, 17.0, 19.9, 22.7, 19.9], borderColor: '#b494ff', backgroundColor: grad(cv.getContext('2d'), 'rgba(139,92,255,.35)', 'rgba(139,92,255,0)'), fill: true, tension: 0.4, pointRadius: 3 },
      { label: 'Despesas', data: [12.6, 14.2, 15.8, 16.9, 17.6, 17.5], borderColor: '#ff7a86', borderDash: [5, 4], tension: 0.4, pointRadius: 0 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, usePointStyle: true } }, tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: R$ ${c.raw.toFixed(1).replace('.', ',')} mil` } } }, scales: { y: { ticks: { callback: (v) => 'R$ ' + v + ' mil' }, grid: { color: 'rgba(255,255,255,.05)' } }, x: { grid: { display: false } } } } }));
  },
  comunicados(el) {
    el.querySelector('#fcom').onsubmit = (e) => { e.preventDefault(); const f = e.target; if (!f.t.value.trim()) return; comunicados.unshift({ titulo: f.t.value, autor: 'Helena Duarte · síndica', quando: 'agora', texto: f.x.value || '—', tag: 'Novo' }); toast(f.wa.checked ? 'Comunicado publicado e enviado no WhatsApp' : 'Comunicado publicado'); renderPage('comunicados', el); };
  },
  moradores(el) {
    const q = el.querySelector('#cq'); q.oninput = () => { local.cq = q.value; renderPage('moradores', el, true); const n = el.querySelector('#cq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); };
  },
};

// Ações específicas das páginas
Object.assign(actions, {
  pf: (d) => { local.pf = d.k; renderPage('portaria', document.getElementById('view-page'), true); },
  avancar: (d) => { const c = clientes.find((x) => x.id === +d.id); const i = ETAPAS.findIndex((e) => e[0] === c.etapa); c.etapa = ETAPAS[i + 1][0]; c.ultimo = 'agora'; toast(`${c.nome} avançou para “${ETAPAS[i + 1][1]}”`); renderPage('clientes', document.getElementById('view-page'), true); },
  'prop-aceitar': (d) => { const p = propostas.find((x) => x.id === d.id); p.status = 'aceita'; toast(`Proposta ${p.id} aceita`); renderPage('propostas', document.getElementById('view-page'), true); },
  'res-conf': (d) => { reservas[+d.i].status = 'confirmada'; toast('Reserva confirmada'); renderPage('reservas', document.getElementById('view-page'), true); },
  'toggle-set': (_d, el) => { setTimeout(() => toast(el.checked ? 'Aviso ativado' : 'Aviso desativado'), 0); },
  prest: () => toast('Prestação de contas de outubro gerada (PDF)', 'file-check'),
  'export-csv': () => {
    const rows = [['Unidade', 'Planta', 'Area', 'Andar', 'Valor', 'Situacao', 'Cliente']].concat(unidades.map((u) => [u.num, u.planta.nome, u.planta.area, u.andar, u.preco, u.status, u.morador?.nome || '']));
    const blob = new Blob(['\ufeff' + rows.map((r) => r.join(';')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'unidades-prisma-beira-mar.csv'; a.click(); toast('CSV exportado');
  },
  'novo-cliente': () => openModal(`<div class="modal-h"><div class="h2">${icon('users', 18)}Novo cliente</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div><div class="modal-b"><form class="col" id="fnc"><label class="f">Nome<input class="input" name="n" required></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="f">Origem<select class="select" name="o"><option>Instagram</option><option>Site</option><option>Indicação</option><option>Stand</option><option>WhatsApp</option></select></label><label class="f">Interesse<select class="select" name="i">${unidades.filter((u) => u.status === 'disponivel').map((u) => `<option>Apto ${u.num}</option>`).join('')}</select></label></div></form></div><div class="modal-f"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="ncs">Adicionar ao funil</button></div>`, '', (m, close) => {
    m.querySelector('#ncs').onclick = () => { const f = m.querySelector('#fnc'); if (!f.n.value.trim()) { f.n.focus(); return; } clientes.unshift({ id: Date.now(), nome: f.n.value, etapa: 'novo', origem: f.o.value, interesse: f.i.value, corretor: 'Paulo Costa', ultimo: 'agora' }); close(); toast('Cliente adicionado'); renderPage('clientes', document.getElementById('view-page'), true); };
  }),
  'nova-reserva': () => openModal(`<div class="modal-h"><div class="h2">${icon('calendar-days', 18)}Nova reserva</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div><div class="modal-b"><form class="col" id="fnr"><label class="f">Área<select class="select" name="a">${AREAS.map((a) => `<option>${a}</option>`).join('')}</select></label><label class="f">Unidade<select class="select" name="u">${unidades.filter((u) => u.morador).map((u) => `<option value="${u.num}">Apto ${u.num} · ${u.morador.nome}</option>`).join('')}</select></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="f">Data<input class="input" type="date" name="d" value="2026-11-14"></label><label class="f">Horário<select class="select" name="h"><option>10h às 14h</option><option>15h às 19h</option><option>19h às 23h</option></select></label></div></form></div><div class="modal-f"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="nrs">Reservar</button></div>`, '', (m, close) => {
    m.querySelector('#nrs').onclick = () => { const f = m.querySelector('#fnr'); const u = unidade(f.u.value); const [y, mo, d] = f.d.value.split('-'); reservas.push({ area: f.a.value, unidade: u.num, quem: u.morador.nome, quando: f.h.value, data: `${d}/${mo}`, status: 'confirmada' }); close(); toast('Reserva confirmada'); renderPage('reservas', document.getElementById('view-page'), true); };
  }),
  'nova-enc': () => openModal(`<div class="modal-h"><div class="h2">${icon('camera', 18)}Registrar encomenda</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div><div class="modal-b"><form class="col" id="fne"><label class="f">Apartamento<select class="select" name="u">${unidades.filter((u) => u.morador).map((u) => `<option value="${u.num}">Apto ${u.num} · ${u.morador.nome}</option>`).join('')}</select></label><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><label class="f">Remetente<input class="input" name="l" value="Amazon"></label><label class="f">Tipo<select class="select" name="t"><option value="caixa pequena|smallbox">Caixa pequena</option><option value="caixa média|box">Caixa média</option><option value="envelope|envelope">Envelope</option><option value="pacote grande|bluebag">Pacote grande</option></select></label></div><label class="f">Local<select class="select" name="lo"><option>Armário A-01</option><option>Armário A-03</option><option>Armário A-05</option><option>Prateleira P1</option></select></label><label class="row" style="font-size:12.5px;gap:8px"><input type="checkbox" checked name="wa"> Avisar morador no app e WhatsApp com foto</label></form></div><div class="modal-f"><button class="btn" data-close>Cancelar</button><button class="btn pri" id="nes">${icon('check', 15)}Registrar</button></div>`, '', (m, close) => {
    m.querySelector('#nes').onclick = () => { const f = m.querySelector('#fne'); const [tipo, foto] = f.t.value.split('|'); encomendas.unshift({ id: 'ENC-' + (1846 + encomendas.length - 16), unidade: +f.u.value, loja: f.l.value || 'Remetente', tipo, foto, local: f.lo.value, recebido: '03/11/2026 17:40', ha: 'agora', recebidoPor: 'Joaquim', codigo: String(1000 + Math.floor(Math.random() * 8999)), status: 'aguardando', rastreio: '—' }); close(); toast(`Encomenda registrada para o apto ${f.u.value}${f.wa.checked ? ' · morador avisado' : ''}`, 'package'); emit('enc'); };
  }),
  retirada: () => openModal(`<div class="modal-h"><div class="h2">${icon('qr-code', 18)}Retirada por código</div><button class="btn icon sm" data-close aria-label="Fechar">${icon('x', 16)}</button></div><div class="modal-b"><div class="sub" style="margin:0 0 10px">Digite o código de 4 números que o morador mostra no app.</div><input class="input num" id="rc" maxlength="4" inputmode="numeric" placeholder="0000" style="width:100%;font-size:28px;height:60px;text-align:center;letter-spacing:.3em"><div id="rr" style="margin-top:12px"></div></div>`, '', (m, close) => {
    const inp = m.querySelector('#rc'); setTimeout(() => inp.focus(), 50);
    inp.oninput = () => { const e = encomendas.find((x) => x.codigo === inp.value && x.status === 'aguardando'); m.querySelector('#rr').innerHTML = inp.value.length < 4 ? '' : e ? `<div class="li"><img class="thumb" src="./assets/${e.foto}.jpg" alt=""><div style="flex:1"><div class="t">${e.loja} · Apto ${e.unidade}</div><div class="s">${e.local}</div></div><button class="btn ok sm" id="rok">Entregar</button></div>` : '<div class="li red">Código não encontrado.</div>'; m.querySelector('#rok')?.addEventListener('click', () => { e.status = 'retirada'; e.ha = 'retirada agora'; close(); toast(`Encomenda entregue ao apto ${e.unidade}`, 'package'); emit('enc'); }); };
  }),
});
