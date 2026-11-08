import { icon } from './icons.js';
import { EMPREENDIMENTO, brl, cotas, consumo, documentos, AREAS } from './data.js';
import { state, pendentes, chamadosAbertos, atraso, toast, qrSVG, encomendas, chamados, reservas, comunicados, unidade, onChange, emit } from './store.js';
import { modalPix, modalPlan3D } from './app.js';
import { planSVG } from './plan.js';

let ctx = null; // { num, screen, param, root, chart }

export function openResidentApp(num) {
  closeResident();
  const bg = document.createElement('div'); bg.className = 'phone-bg';
  bg.innerHTML = `<div class="phone" role="dialog" aria-label="App do morador"><div class="phone-screen"><div class="notch"></div>
    <div class="status-bar"><span>17:40</span><span class="row" style="gap:5px">${icon('gauge', 14)}${icon('zap', 14)}</span></div>
    <div class="ma-top"><b>${icon('smartphone', 14)}App do morador</b><button class="close-x" data-ma="close">${icon('x', 14)}Fechar</button></div>
    <div class="ma-body" id="ma-body"></div></div></div>`;
  document.body.appendChild(bg);
  ctx = { num, screen: 'home', root: bg, body: bg.querySelector('#ma-body') };
  bg.addEventListener('click', (e) => {
    if (e.target === bg) return closeResident();
    const el = e.target.closest('[data-ma]'); if (!el) return; e.preventDefault(); e.stopPropagation();
    MA[el.dataset.ma]?.(el.dataset, el);
  });
  document.addEventListener('keydown', escH);
  render();
}
function escH(e) { if (e.key === 'Escape' && !document.querySelector('.modal-bg')) closeResident(); }
function closeResident() { if (!ctx) return; ctx.chart?.destroy(); ctx.root.remove(); ctx = null; document.removeEventListener('keydown', escH); }
onChange(() => { if (ctx) render(); });

const nav = (screen, param) => { ctx.screen = screen; ctx.param = param; render(); ctx.body.scrollTop = 0; };
const backBtn = (to = 'home', label = 'Início') => `<button class="back" data-ma="nav" data-s="${to}" style="margin-top:4px">${icon('chevron-left', 15)}${label}</button>`;

function render() {
  ctx.chart?.destroy(); ctx.chart = null;
  ctx.body.innerHTML = (SCREENS[ctx.screen] || SCREENS.home)(unidade(ctx.num));
  AFTER[ctx.screen]?.();
}

const SCREENS = {
  home(u) {
    const m = u.morador; const pend = pendentes(u.num); const ch = chamadosAbertos(u.num); const a = atraso(u.num);
    const minhas = reservas.filter((r) => r.unidade === u.num);
    const notif = pend.length + ch.length + (a ? 1 : 0);
    return `
    <div class="row between" style="margin:4px 0 2px"><div class="row"><div class="av">${m.iniciais}</div><div><div style="font-weight:800">${EMPREENDIMENTO.nome}</div><div class="muted" style="font-size:12px">Apto ${u.num} · proprietário</div></div></div><button class="bell" style="background:rgba(255,255,255,.06);border-radius:50%" aria-label="Notificações" data-ma="nav" data-s="mural">${icon('bell', 18)}${notif ? `<span class="dot">${notif}</span>` : ''}</button></div>
    <div class="ma-hello">Boa tarde, ${m.nome.split(' ')[0]}</div>
    <div class="ma-card" style="border-color:rgba(45,212,238,.25)"><div class="row between"><span class="row" style="gap:6px;font-size:12px;font-weight:700;color:var(--cyan)">${icon('package', 14)}Na portaria agora</span><button style="font-size:12px;color:#b494ff;font-weight:600" data-ma="nav" data-s="corresp">Ver todas</button></div>
      <div style="margin-top:6px"><span style="font-size:30px;font-weight:800">${pend.length}</span> <span class="muted">${pend.length === 1 ? 'correspondência' : 'correspondências'} para retirar</span></div>
      ${pend.length ? `<div class="ma-photos">${pend.slice(0, 2).map((e) => `<button class="ma-photo" data-ma="nav" data-s="enc" data-p="${e.id}"><img src="./assets/${e.foto}.jpg" alt="Foto da encomenda"><div class="cap"><b>${e.loja}</b><br><span>${e.local.toLowerCase()} · ${e.ha}</span></div></button>`).join('')}</div>` : '<div class="muted" style="font-size:12px;margin-top:6px">Nada para retirar. Avisaremos quando chegar.</div>'}
    </div>
    <div class="ma-two">
      <button class="ma-card ${a ? 'alert' : ''}" style="text-align:left" data-ma="nav" data-s="fin"><div class="row" style="gap:5px;font-size:11px;font-weight:700;color:${a ? '#ff8d98' : 'var(--green)'}">${icon('building-2', 13)}Condomínio</div><div style="font-weight:800;font-size:16px;margin-top:4px">${a ? 'Atrasado' : 'Em dia'}</div><div class="muted" style="font-size:11px">${a ? a.dias + ' dias · cota de outubro' : 'próxima: 10/11'}</div><div style="font-weight:800;margin-top:8px" class="num">${a ? brl(a.valor, true) : brl(1418.58, true)}</div></button>
      <button class="ma-card ${ch.some((c) => c.atrasado) ? 'alert' : ''}" style="text-align:left" data-ma="nav" data-s="chamados"><div class="row" style="gap:5px;font-size:11px;font-weight:700;color:${ch.length ? '#ff8d98' : 'var(--muted)'}">${icon('key', 13)}Chamado</div><div style="font-weight:800;font-size:14px;margin-top:4px;line-height:1.2">${ch[0]?.titulo || 'Nenhum chamado aberto'}</div><div class="${ch[0]?.atrasado ? 'red' : 'muted'}" style="font-size:11px">${ch[0]?.prazo || 'tudo certo'}</div>${ch[0] ? `<div style="font-size:11px;margin-top:6px;color:#ff8d98;font-weight:700">${ch[0].status === 'aberto' ? 'Aberto' : 'Em andamento'}</div>` : ''}</button>
    </div>
    <div class="ma-tiles">
      ${[['corresp', 'Correspondências', 'package', 'c', pend.length, 'c'], ['fin', 'Financeiro', 'receipt', 'r', a ? 1 : 0, ''], ['chamados', 'Chamados', 'key', 'a', ch.length, 'a'], ['reservas', 'Reservas', 'calendar-days', '', minhas.length, 'p'], ['unidade', 'Minha unidade', 'home', '', 0], ['reunioes', 'Reuniões', 'users', '', 0], ['mural', 'Mural', 'megaphone', '', 1, 'p'], ['docs', 'Documentos', 'file-text', '', 0], ['consumo', 'Consumo', 'gauge', 'g', 0]]
        .map(([s, l, ic, cls, n, dc]) => `<button class="ma-tile" data-ma="nav" data-s="${s}"><span class="ti ${cls}">${icon(ic, 19)}</span>${l}${n ? `<span class="dot ${dc}">${n}</span>` : ''}</button>`).join('')}
    </div>
    <div class="ma-sec">Em breve</div>
    ${minhas.map((r) => `<div class="ma-li"><span class="ti" style="color:#cbb8ff">${icon('calendar-days', 18)}</span><div class="grow"><div class="t">${r.area}</div><div class="s">${r.quando}</div></div><span class="tag g">Confirmada</span></div>`).join('')}
    <button class="ma-li" style="width:100%;text-align:left" data-ma="nav" data-s="reunioes"><span style="color:#cbb8ff">${icon('megaphone', 18)}</span><div class="grow"><div class="t">Assembleia geral ordinária</div><div class="s">há 2 dias · ${EMPREENDIMENTO.sindica}</div></div><span class="tag p">Novo</span></button>`;
  },

  corresp(u) {
    const tab = ctx.param || 'retirar'; const pend = pendentes(u.num); const ret = encomendas.filter((e) => e.unidade === u.num && e.status === 'retirada');
    const list = tab === 'retirar' ? pend : ret;
    return `${backBtn()}<div class="ma-h">Correspondências apto ${u.num}</div>
      <div class="pills" style="margin-bottom:12px"><button class="pill ${tab === 'retirar' ? 'on' : ''}" data-ma="nav" data-s="corresp" data-p="retirar">Para retirar ${pend.length}</button><button class="pill ${tab === 'ret' ? 'on' : ''}" data-ma="nav" data-s="corresp" data-p="ret">Retiradas ${ret.length}</button></div>
      ${list.map((e) => `<button class="ma-li" style="width:100%;text-align:left" data-ma="nav" data-s="enc" data-p="${e.id}"><img class="thumb" src="./assets/${e.foto}.jpg" alt=""><div class="grow"><div class="t">${e.loja} <span class="muted" style="font-weight:500">${e.tipo}</span></div>${e.status === 'aguardando' ? '<span class="tag g" style="margin:3px 0">Disponível para retirar</span>' : '<span class="tag" style="margin:3px 0">Retirada</span>'}<div class="s">${icon('clock', 11)} ${e.recebido}</div><div class="s">${icon('map-pin', 11)} Portaria · ${e.local.toLowerCase()}</div></div>${icon('chevron-right', 16, 'muted')}</button>`).join('') || '<div class="ma-li muted" style="font-size:12.5px">Nada por aqui.</div>'}
      <div class="row" style="gap:8px;font-size:11.5px;color:var(--muted);margin-top:8px;align-items:flex-start">${icon('info', 14)}Na portaria, mostre o QR do app ou diga o código de 4 números.</div>`;
  },

  enc(u) {
    const e = encomendas.find((x) => x.id === ctx.param);
    return `${backBtn('corresp', 'Correspondências')}<div class="ma-h">${e.loja} · ${e.tipo}</div>
      <div class="ma-photo" style="aspect-ratio:4/3;margin-bottom:12px"><img src="./assets/${e.foto}.jpg" alt="Foto da encomenda tirada pela portaria"><div class="cap">Foto tirada pela portaria · ${e.recebido}</div></div>
      ${e.status === 'aguardando' ? `<div class="ma-card" style="display:flex;gap:14px;align-items:center"><div class="qr">${qrSVG(`PRISMA|${e.id}|${e.codigo}`)}</div><div><div class="muted" style="font-size:11px;font-weight:700;letter-spacing:.08em">CÓDIGO DE RETIRADA</div><div class="num" style="font-size:32px;font-weight:800;letter-spacing:.14em">${e.codigo}</div><div class="muted" style="font-size:11px">Mostre na portaria</div></div></div>` : '<div class="ma-card muted">Retirada · obrigado!</div>'}
      <div class="ma-card"><div class="kv"><div><div class="k">Local</div>${e.local}</div><div><div class="k">Recebido por</div>${e.recebidoPor}</div><div><div class="k">Chegou</div>${e.ha}</div><div><div class="k">Rastreio</div><span class="num">${e.rastreio}</span></div></div></div>
      ${e.status === 'aguardando' ? `<button class="btn block" data-ma="terceiro" data-p="${e.id}">${icon('user-round', 15)}Autorizar outra pessoa a retirar</button>` : ''}`;
  },

  fin(u) {
    const a = atraso(u.num); const cs = cotas(u.num).map((c) => (c.mes === 'Outubro' && !a ? { ...c, status: 'pago', pagoEm: '03/11' } : c));
    return `${backBtn()}<div class="ma-h">Financeiro apto ${u.num}</div>
      ${a ? `<div class="ma-card alert"><div class="row" style="gap:6px;font-size:12px;font-weight:700;color:#ff8d98">${icon('alert-triangle', 14)}Em atraso</div><div class="big-price" style="margin-top:4px">${brl(a.valor, true)}</div><div class="muted" style="font-size:12px">Cota de outubro · venceu em 10/10/2026 · ${a.dias} dias · com multa e juros</div>
        <div class="row" style="gap:8px;margin-top:12px"><button class="btn pri" style="flex:1.4" data-ma="pix">${icon('qr-code', 15)}Pagar com Pix</button><button class="btn" style="flex:1" data-ma="japaguei">Já paguei</button></div></div>`
      : `<div class="ma-card" style="border-color:rgba(47,210,122,.35)"><div class="row" style="gap:6px;font-size:12px;font-weight:700;color:var(--green)">${icon('check-check', 14)}Tudo em dia</div><div style="font-size:13px;margin-top:6px">Próxima cota: <b>${brl(1418.58, true)}</b> · vence 10/11</div></div>`}
      <div class="ma-two"><button class="ma-card" style="text-align:left" data-ma="quitacao"><span style="color:#cbb8ff">${icon('file-check', 18)}</span><div style="font-weight:700;font-size:13px;margin-top:6px">Declaração de quitação</div><div class="muted" style="font-size:11px">${a ? 'Sai quando estiver em dia' : 'Disponível para baixar'}</div></button><button class="ma-card" style="text-align:left" data-ma="toast" data-t="Balancete de outubro aberto"><span style="color:#cbb8ff">${icon('file-bar-chart', 18)}</span><div style="font-weight:700;font-size:13px;margin-top:6px">Prestação de contas</div><div class="muted" style="font-size:11px">Balancetes do prédio</div></button></div>
      <div class="row between" style="margin:4px 0 8px"><div class="ma-sec" style="margin:0">Cotas condominiais</div><span class="muted" style="font-size:11px">vencem todo dia 10</span></div>
      ${cs.map((c) => `<div class="ma-li"><div class="grow"><div class="t">Cota de ${c.mes.toLowerCase()}</div><div class="s">Vencimento ${c.venc}</div></div><div style="text-align:right"><b class="num">${brl(c.valor, true)}</b><div style="margin-top:3px">${c.status === 'avencer' ? '<span class="tag">A vencer</span>' : c.status === 'atrasado' ? `<span class="tag r">Atrasado ${c.dias} dias</span>` : '<span class="tag g">Pago</span>'}</div></div></div>`).join('')}`;
  },

  chamados(u) {
    const all = chamados.filter((c) => c.unidade === u.num);
    return `${backBtn()}<div class="ma-h">Chamados</div>
      <button class="btn pri block" style="margin-bottom:12px" data-ma="nav" data-s="novoch">${icon('plus', 15)}Abrir chamado</button>
      ${all.map((c) => `<div class="ma-card ${c.atrasado && c.status !== 'concluido' ? 'alert' : ''}"><div class="row between"><b>${c.titulo}</b>${c.status === 'concluido' ? '<span class="tag g">Concluído</span>' : c.status === 'andamento' ? '<span class="tag p">Em andamento</span>' : '<span class="tag a">Aberto</span>'}</div><div class="muted" style="font-size:12px;margin-top:4px">${c.desc}</div><div class="row wrap" style="gap:6px;margin-top:8px"><span class="tag">${c.categoria}</span><span class="tag ${c.atrasado && c.status !== 'concluido' ? 'r' : ''}">${icon('clock', 11)}${c.prazo}</span></div><div class="muted" style="font-size:11px;margin-top:6px">Aberto ${c.abertoEm} · ${c.responsavel}</div></div>`).join('') || '<div class="ma-li muted" style="font-size:12.5px">Você ainda não abriu chamados.</div>'}`;
  },
  novoch() {
    return `${backBtn('chamados', 'Chamados')}<div class="ma-h">Novo chamado</div><form class="col" id="ma-fc"><label class="f">O que aconteceu?<input class="input" name="t" placeholder="Ex.: Tomada da varanda sem energia" required></label><label class="f">Categoria<select class="select" name="c"><option>Hidráulica</option><option>Elétrica</option><option>Manutenção</option><option>Convivência</option></select></label><label class="f">Detalhes<textarea class="input" name="d" rows="4"></textarea></label><button class="btn pri" data-ma="enviarch">${icon('send', 15)}Enviar para a administração</button></form>`;
  },

  reservas(u) {
    const minhas = reservas.filter((r) => r.unidade === u.num);
    return `${backBtn()}<div class="ma-h">Reservas</div>
      <div class="ma-sec">Minhas reservas</div>${minhas.map((r) => `<div class="ma-li"><span style="color:#cbb8ff">${icon('calendar-days', 18)}</span><div class="grow"><div class="t">${r.area}</div><div class="s">${r.data} · ${r.quando}</div></div><span class="tag g">Confirmada</span></div>`).join('') || '<div class="ma-li muted" style="font-size:12.5px">Nenhuma reserva.</div>'}
      <div class="ma-sec" style="margin-top:14px">Reservar área</div><div class="ma-tiles" style="grid-template-columns:1fr 1fr">${AREAS.map((a) => `<button class="ma-tile" style="aspect-ratio:auto;padding:14px 8px" data-ma="reservar" data-a="${a}"><span class="ti">${icon(a === 'Academia' ? 'gauge' : a === 'Quadra' ? 'trophy' : 'calendar-days', 18)}</span>${a}</button>`).join('')}</div>`;
  },

  unidade(u) {
    const P = u.planta;
    return `${backBtn()}<div class="muted" style="font-size:12px">${EMPREENDIMENTO.nome} · Apto ${u.num}</div><div class="ma-h" style="margin-top:2px">${P.quartos} quartos (${P.suites} suíte) ${P.area} m²</div>
      <div class="row" style="gap:6px;margin-bottom:10px"><button class="btn sm pri" data-ma="plan3d">${icon('rotate-3d', 14)}Ver em 3D</button></div>
      <div class="plan-thumb" style="margin-bottom:12px" data-ma="plan3d">${planSVG(u.tipo)}</div>
      <div class="specs" style="margin-bottom:12px"><div class="spec"><b>${P.quartos}</b><span>Quartos</span></div><div class="spec"><b>${P.suites}</b><span>Suíte</span></div><div class="spec"><b>${P.vagas}</b><span>Vagas</span></div><div class="spec"><b>${P.area}</b><span>m²</span></div></div>
      <div class="ma-card"><div class="kv"><div><div class="k">Andar</div>${u.andar}º · ${P.posicao}</div><div><div class="k">Vaga</div>${u.morador.vaga}</div><div><div class="k">Moradores</div>${u.morador.moradores}</div><div><div class="k">Garantia</div>até mar/2031</div></div></div>`;
  },

  reunioes() {
    return `${backBtn()}<div class="ma-h">Reuniões</div>
      <div class="ma-card" style="border-color:rgba(139,92,255,.4)"><span class="tag p">Novo</span><div style="font-weight:800;font-size:16px;margin-top:8px">Assembleia geral ordinária</div><div class="muted" style="font-size:12px;margin-top:2px">18/11/2026 · 19h30 · salão de festas</div><div style="font-size:12.5px;margin-top:8px;color:#d6d6e4">Pauta: aprovação de contas, previsão orçamentária 2027 e regras do pet place.</div>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn pri sm" style="flex:1" data-ma="toast" data-t="Presença confirmada na AGO">Confirmar presença</button><button class="btn sm" style="flex:1" data-ma="toast" data-t="Procuração digital enviada">Enviar procuração</button></div></div>
      <div class="ma-sec">Anteriores</div><div class="ma-li"><span style="color:#cbb8ff">${icon('file-text', 18)}</span><div class="grow"><div class="t">Assembleia de instalação</div><div class="s">12/03/2026 · ata disponível</div></div></div>`;
  },

  mural() {
    return `${backBtn()}<div class="ma-h">Mural</div>${comunicados.map((c) => `<div class="ma-card"><div class="row between"><b>${c.titulo}</b><span class="tag ${c.tag === 'Novo' ? 'p' : ''}">${c.tag}</span></div><div class="muted" style="font-size:11px;margin:3px 0 6px">${c.autor} · ${c.quando}</div><div style="font-size:12.5px;color:#d6d6e4">${c.texto}</div></div>`).join('')}`;
  },

  docs(u) {
    return `${backBtn()}<div class="ma-h">Documentos</div>${documentos.map(([n, s]) => `<button class="ma-li" style="width:100%;text-align:left" data-ma="toast" data-t="Baixando “${n}”"><span style="color:#cbb8ff">${icon('file-text', 18)}</span><div class="grow"><div class="t">${n.replace('501', u.num)}</div><div class="s">${s}</div></div>${icon('chevron-right', 16, 'muted')}</button>`).join('')}`;
  },

  consumo() {
    const i = consumo.meses.length - 2;
    return `${backBtn()}<div class="ma-h">Consumo</div>
      <div class="ma-two"><div class="ma-card"><span style="color:var(--cyan)">${icon('droplet', 18)}</span><div class="muted" style="font-size:11px;margin-top:6px">Água · outubro</div><div style="font-size:22px;font-weight:800">${String(consumo.agua[i]).replace('.', ',')} m³</div><div class="muted" style="font-size:11px">média do prédio 9,8</div></div>
      <div class="ma-card"><span style="color:var(--amber)">${icon('flame', 18)}</span><div class="muted" style="font-size:11px;margin-top:6px">Gás · outubro</div><div style="font-size:22px;font-weight:800">${String(consumo.gas[i]).replace('.', ',')} m³</div><div class="muted" style="font-size:11px">média do prédio 3,1</div></div></div>
      <div class="ma-card"><div class="ma-sec" style="margin-top:0">Últimos meses</div><div style="height:200px;position:relative"><canvas id="ma-ch"></canvas></div></div>
      <div class="ma-li"><span style="color:var(--amber)">${icon('lightbulb', 18)}</span><div class="grow"><div class="t">Água acima da média</div><div class="s">Seu consumo em outubro ficou 16% acima da média. Pode ter relação com o vazamento na cozinha.</div></div></div>`;
  },
};

const AFTER = {
  consumo() {
    const C = window.Chart; const cv = ctx.body.querySelector('#ma-ch'); if (!C || !cv) return;
    ctx.chart = new C(cv, { type: 'bar', data: { labels: consumo.meses, datasets: [{ label: 'Água (m³)', data: consumo.agua, backgroundColor: 'rgba(45,212,238,.75)', borderRadius: 6 }, { label: 'Gás (m³)', data: consumo.gas, backgroundColor: 'rgba(255,176,32,.8)', borderRadius: 6 }] },
      options: { maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 10, color: '#9a9ab0' } } }, scales: { x: { grid: { display: false }, ticks: { color: '#9a9ab0' } }, y: { grid: { color: 'rgba(255,255,255,.05)' }, ticks: { color: '#9a9ab0' } } } } });
  },
};

const MA = {
  close: () => closeResident(),
  nav: (d) => nav(d.s, d.p),
  pix: () => modalPix(ctx.num),
  japaguei: () => { state.paid.add(ctx.num); toast('Pagamento informado · a administração vai confirmar'); emit('fin'); },
  quitacao: () => toast(atraso(ctx.num) ? 'A declaração sai quando as cotas estiverem em dia' : 'Declaração de quitação baixada', atraso(ctx.num) ? 'info' : 'file-check'),
  toast: (d) => toast(d.t),
  terceiro: () => toast('Autorização enviada para a portaria', 'user-round'),
  plan3d: () => modalPlan3D(ctx.num),
  reservar: (d) => { reservas.push({ area: d.a, unidade: ctx.num, quem: unidade(ctx.num).morador.nome, quando: 'sáb · 15h às 19h', data: '14/11', status: 'confirmada' }); toast(`${d.a} reservado para sáb, 14/11`); emit('res'); },
  enviarch: () => { const f = ctx.body.querySelector('#ma-fc'); if (!f.t.value.trim()) { f.t.focus(); return; } chamados.unshift({ id: 'CH-0' + (220 + chamados.length), unidade: ctx.num, titulo: f.t.value, desc: f.d.value || 'Sem detalhes.', categoria: f.c.value, prioridade: 'media', status: 'aberto', abertoEm: '03/11 17:40', prazo: 'vence em 2 dias', responsavel: 'Zelador · Sérgio' }); toast('Chamado enviado'); ctx.screen = 'chamados'; emit('ch'); },
};
