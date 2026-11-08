// Prisma Beira-Mar — dados de demonstração (estado em memória)
export const HOJE = new Date(2026, 10, 3, 17, 40); // 03/11/2026

export const brl = (v, cents = false) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 });
export const mi = (v) => 'R$ ' + (v / 1e6).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' mi';
export const centsSplit = (v) => {
  const s = v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [a, b] = s.split(',');
  return { int: a, dec: b };
};

export const EMPREENDIMENTO = {
  nome: 'Prisma Beira-Mar',
  incorporadora: 'Prisma Incorporadora',
  local: 'Orla Norte',
  entrega: 'mar/2026',
  endereco: 'Av. Beira-Mar, 1.840 · Orla Norte',
  sindica: 'Helena Duarte',
  porteiro: 'Joaquim',
};

export const PLANTAS = {
  A: {
    id: 'A', nome: 'Tipo A', quartos: 3, suites: 1, banheiros: 3, vagas: 2, area: 98, posicao: 'Frente mar',
    ambientes: [
      ['Sala', 28.4], ['Varanda gourmet', 9.6], ['Cozinha', 10.2], ['Área de serviço', 3.8],
      ['Suíte', 15.6], ['Banho suíte', 4.2], ['Quarto 2', 9.8], ['Quarto 3', 8.9], ['Banho social', 3.6], ['Circulação', 3.9],
    ],
  },
  B: {
    id: 'B', nome: 'Tipo B', quartos: 2, suites: 1, banheiros: 2, vagas: 1, area: 74, posicao: 'Vista lateral',
    ambientes: [
      ['Sala', 22.1], ['Varanda', 6.4], ['Cozinha', 8.6], ['Área de serviço', 3.1],
      ['Suíte', 13.2], ['Banho suíte', 3.9], ['Quarto 2', 9.1], ['Banho social', 3.4], ['Circulação', 4.2],
    ],
  },
};

const VENDIDOS = [101, 102, 103, 104, 201, 203, 204, 302, 401, 403, 404, 501, 503, 602, 701, 802, 804];
const RESERVADOS = [304];

// Moradores (unidades vendidas)
const MORADORES = {
  101: ['Beatriz Cunha', 3, 'gato', 'jan/2026'],
  102: ['Felipe Nogueira', 2, null, 'mar/2026'],
  103: ['Mariana Lacerda', 4, 'cachorro', 'mar/2026'],
  104: ['Gustavo Carvalho', 1, null, 'abr/2026'],
  201: ['Larissa Rocha', 2, null, 'mar/2026'],
  203: ['Henrique Matos', 3, 'cachorro', 'abr/2026'],
  204: ['Thiago Moura', 2, null, 'mai/2026'],
  302: ['Carolina Tavares', 3, null, 'mai/2026'],
  401: ['Eduardo Pires', 4, 'gato', 'jun/2026'],
  403: ['Juliana Almeida', 2, null, 'jun/2026'],
  404: ['Ricardo Fontes', 1, null, 'jun/2026'],
  501: ['Rafael Tavares', 4, 'cachorro', 'jul/2026'],
  503: ['Vanessa Pacheco', 3, null, 'jul/2026'],
  602: ['Bruno Siqueira', 2, null, 'ago/2026'],
  701: ['Camila Ferraz', 3, 'gato', 'set/2026'],
  802: ['Ana Terezinha Lopes', 2, null, 'set/2026'],
  804: ['Diego Barreto', 2, null, 'out/2026'],
};

const CORRETORES = ['Paulo Costa', 'Renata Alves', 'Caio Monteiro', 'Lívia Prado'];

function precoBase(andar, col) {
  const tipo = col <= 2 ? 'A' : 'B';
  const base = tipo === 'A' ? 1_440_000 : 1_252_000;
  const andarPrem = (andar - 1) * 0.012;
  const colPrem = col === 1 || col === 3 ? 0.012 : 0;
  return Math.round((base * (1 + andarPrem + colPrem)) / 1000) * 1000;
}

export const unidades = [];
for (let andar = 1; andar <= 8; andar++) {
  for (let col = 1; col <= 4; col++) {
    const num = andar * 100 + col;
    const tipo = col <= 2 ? 'A' : 'B';
    let status = 'disponivel';
    if (VENDIDOS.includes(num)) status = 'vendido';
    if (RESERVADOS.includes(num)) status = 'reservado';
    const preco = precoBase(andar, col);
    const u = { num, andar, col, tipo, status, preco, planta: PLANTAS[tipo] };
    if (MORADORES[num]) {
      const [nome, moradores, pet, desde] = MORADORES[num];
      const slug = nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(' ');
      u.morador = {
        nome, moradores, pet, desde,
        iniciais: nome.split(' ').map((p) => p[0]).filter((_, i, a) => i === 0 || i === a.length - 1).join(''),
        telefone: `(00) 9${String(8000 + num * 7).slice(0, 4)}-${String(1000 + num * 13).slice(-4)}`,
        email: `${slug[0]}.${slug[slug.length - 1]}@exemplo.com.br`,
        vaga: `G${andar > 4 ? 2 : 1}-${String(((andar - 1) % 4) * 4 + col).padStart(2, '0')}`,
        proprietario: true,
        corretor: CORRETORES[num % 4],
      };
    }
    unidades.push(u);
  }
}
unidades.find((u) => u.num === 501).morador.telefone = '(00) 99176-5694';
unidades.find((u) => u.num === 501).morador.email = 'rafael.tavares@exemplo.com.br';
unidades.find((u) => u.num === 501).morador.vaga = 'G1-14';
unidades.find((u) => u.num === 501).morador.pet = '1 pet';

export const unidade = (num) => unidades.find((u) => u.num === Number(num));

// Encomendas na portaria
export const encomendas = [
  { id: 'ENC-1843', unidade: 501, loja: 'Amazon', tipo: 'envelope', foto: 'envelope', local: 'Prateleira P2', recebido: '03/11/2026 14:48', ha: 'há 3 h', recebidoPor: 'Joaquim', codigo: '4821', status: 'aguardando', rastreio: 'BR4488120063' },
  { id: 'ENC-1839', unidade: 501, loja: 'Mercado Livre', tipo: 'caixa pequena', foto: 'smallbox', local: 'Armário A-07', recebido: '02/11/2026 11:50', ha: 'ontem', recebidoPor: 'Joaquim', codigo: '2338', status: 'aguardando', rastreio: '28883273577' },
  { id: 'ENC-1830', unidade: 403, loja: 'Jadlog', tipo: 'caixa média', foto: 'box', local: 'Armário A-11', recebido: '29/10/2026 07:48', ha: 'há 5 dias', recebidoPor: 'Joaquim', codigo: '0978', status: 'aguardando', rastreio: '8177858179393' },
  { id: 'ENC-1841', unidade: 302, loja: 'Flores', tipo: 'buquê', foto: 'flowers', local: 'Recepção', recebido: '03/11/2026 10:12', ha: 'há 7 h', recebidoPor: 'Ana', codigo: '5530', status: 'aguardando', rastreio: '—', fragil: true },
  { id: 'ENC-1836', unidade: 204, loja: 'Farmácia', tipo: 'sacola', foto: 'pharmacy', local: 'Prateleira P1', recebido: '01/11/2026 19:02', ha: 'há 2 dias', recebidoPor: 'Ana', codigo: '7714', status: 'aguardando', rastreio: '—' },
  { id: 'ENC-1842', unidade: 802, loja: 'Mercado Livre', tipo: 'pacote grande', foto: 'bluebag', local: 'Armário A-21', recebido: '03/11/2026 12:30', ha: 'há 5 h', recebidoPor: 'Joaquim', codigo: '6602', status: 'aguardando', rastreio: '28880019331' },
  { id: 'ENC-1828', unidade: 102, loja: 'Loggi', tipo: 'caixa pequena', foto: 'smallbox', local: 'Armário A-02', recebido: '30/10/2026 16:40', ha: 'há 4 dias', recebidoPor: 'Joaquim', codigo: '3126', status: 'aguardando', rastreio: 'LGI0093321' },
  { id: 'ENC-1840', unidade: 101, loja: 'Shopee', tipo: 'envelope', foto: 'envelope', local: 'Prateleira P2', recebido: '03/11/2026 09:15', ha: 'há 8 h', recebidoPor: 'Ana', codigo: '8840', status: 'aguardando', rastreio: 'BR2023555012' },
  { id: 'ENC-1837', unidade: 203, loja: 'Amazon', tipo: 'caixa média', foto: 'box', local: 'Armário A-04', recebido: '02/11/2026 15:20', ha: 'ontem', recebidoPor: 'Joaquim', codigo: '1459', status: 'aguardando', rastreio: 'BR4488002211' },
  { id: 'ENC-1838', unidade: 401, loja: 'Magalu', tipo: 'caixa grande', foto: 'box', local: 'Armário A-15', recebido: '02/11/2026 17:05', ha: 'ontem', recebidoPor: 'Ana', codigo: '9081', status: 'aguardando', rastreio: 'MGL77120034' },
  { id: 'ENC-1844', unidade: 503, loja: 'Correios', tipo: 'carta registrada', foto: 'envelope', local: 'Prateleira P1', recebido: '03/11/2026 15:30', ha: 'há 2 h', recebidoPor: 'Joaquim', codigo: '2207', status: 'aguardando', rastreio: 'JT335128880BR' },
  { id: 'ENC-1835', unidade: 701, loja: 'Amazon', tipo: 'pacote', foto: 'bluebag', local: 'Armário A-18', recebido: '01/11/2026 13:44', ha: 'há 2 dias', recebidoPor: 'Ana', codigo: '6315', status: 'aguardando', rastreio: 'BR4487700193' },
  { id: 'ENC-1845', unidade: 804, loja: 'iFood Mercado', tipo: 'sacola', foto: 'pharmacy', local: 'Recepção', recebido: '03/11/2026 16:58', ha: 'há 40 min', recebidoPor: 'Joaquim', codigo: '4410', status: 'aguardando', rastreio: '—' },
  { id: 'ENC-1844b', unidade: 802, loja: 'Amazon', tipo: 'envelope', foto: 'envelope', local: 'Prateleira P2', recebido: '03/11/2026 16:10', ha: 'há 1 h', recebidoPor: 'Ana', codigo: '1188', status: 'aguardando', rastreio: 'BR4489910021' },
  { id: 'ENC-1826', unidade: 404, loja: 'Amazon', tipo: 'caixa pequena', foto: 'smallbox', local: 'Armário A-09', recebido: '03/11/2026 08:02', ha: 'retirada 12:10', recebidoPor: 'Ana', codigo: '5021', status: 'retirada', rastreio: 'BR4480091232' },
  { id: 'ENC-1825', unidade: 602, loja: 'Mercado Livre', tipo: 'envelope', foto: 'envelope', local: 'Prateleira P1', recebido: '02/11/2026 18:40', ha: 'retirada 09:30', recebidoPor: 'Joaquim', codigo: '7302', status: 'retirada', rastreio: '28881100297' },
];

export const visitantes = [
  { nome: 'Paulo Costa', tipo: 'Corretor', destino: 'Apto 601 (visita)', hora: '16:20', status: 'No prédio' },
  { nome: 'Marcos Vinícius', tipo: 'Prestador · Hidráulica', destino: 'Apto 501', hora: '15:05', status: 'No prédio' },
  { nome: 'Sofia Lacerda', tipo: 'Visitante', destino: 'Apto 103', hora: '14:12', status: 'Saiu 15:40' },
  { nome: 'Entregador Loggi', tipo: 'Entrega', destino: 'Portaria', hora: '13:30', status: 'Saiu 13:34' },
];

export const chamados = [
  { id: 'CH-0213', unidade: 501, titulo: 'Vazamento no cano da cozinha', desc: 'O cano embaixo da pia da cozinha está pingando sem parar. Pusemos um balde.', categoria: 'Hidráulica', prioridade: 'alta', status: 'aberto', abertoEm: '02/11 07:57', prazo: 'fora do prazo há 2 h', atrasado: true, responsavel: 'Assistência técnica Prisma' },
  { id: 'CH-0211', unidade: 302, titulo: 'Interfone sem áudio', desc: 'Consigo ouvir a portaria, mas eles não me ouvem.', categoria: 'Elétrica', prioridade: 'media', status: 'andamento', abertoEm: '01/11 18:20', prazo: 'vence em 6 h', responsavel: 'Zelador · Sérgio' },
  { id: 'CH-0209', unidade: 701, titulo: 'Infiltração no teto do banheiro', desc: 'Mancha aumentando no teto do banho social.', categoria: 'Estrutural', prioridade: 'alta', status: 'andamento', abertoEm: '30/10 10:02', prazo: 'vence amanhã', responsavel: 'Construtora · garantia' },
  { id: 'CH-0214', unidade: 103, titulo: 'Lâmpada queimada no hall do 1º andar', desc: 'Hall dos elevadores escuro à noite.', categoria: 'Manutenção', prioridade: 'baixa', status: 'aberto', abertoEm: '03/11 09:41', prazo: 'vence em 2 dias', responsavel: 'Zelador · Sérgio' },
  { id: 'CH-0207', unidade: 204, titulo: 'Portão da garagem lento', desc: 'Demora cerca de 40 s para abrir.', categoria: 'Automação', prioridade: 'media', status: 'concluido', abertoEm: '27/10 08:10', prazo: 'concluído 29/10', responsavel: 'Fornecedor · PortSeg' },
  { id: 'CH-0205', unidade: 401, titulo: 'Barulho de obra após 18h', desc: 'Reforma no andar de cima depois do horário.', categoria: 'Convivência', prioridade: 'baixa', status: 'concluido', abertoEm: '25/10 19:22', prazo: 'concluído 26/10', responsavel: 'Síndica · Helena' },
];

// Contas de outubro / financeiro por unidade
export const ATRASOS = { 501: { valor: 1460.99, dias: 24, original: 1421.2 }, 204: { valor: 1438.4, dias: 8, original: 1421.2 }, 701: { valor: 1452.1, dias: 17, original: 1421.2 } };

export function contasOutubro(num) {
  const a = ATRASOS[num];
  const seed = num % 7;
  return [
    { id: 'cond', nome: 'Condomínio', icon: 'building-2', valor: 1421.2, venc: 'vence dia 10', status: a ? 'atrasado' : 'pago', extra: a ? `Atrasado ${a.dias} dias` : 'Pago 08/10' },
    { id: 'luz', nome: 'Luz', icon: 'zap', valor: 392 - seed * 11.4, venc: 'medidor individual', status: num === 501 ? 'emdia' : 'pago', extra: num === 501 ? 'Em dia' : 'Pago' },
    { id: 'agua', nome: 'Água', icon: 'droplet', valor: 141.36 - seed * 4.2, venc: `${(11.4 - seed * 0.3).toFixed(1).replace('.', ',')} m³ · média 9,8`, status: 'emdia', extra: 'Em dia' },
    { id: 'gas', nome: 'Gás', icon: 'flame', valor: 38.22 + seed * 1.6, venc: '3,9 m³ · média 3,1', status: 'emdia', extra: 'Em dia' },
  ];
}

export function cotas(num) {
  const a = ATRASOS[num];
  return [
    { mes: 'Novembro', venc: '10/11/2026', valor: 1418.58, status: 'avencer' },
    { mes: 'Outubro', venc: '10/10/2026', valor: 1421.2, status: a ? 'atrasado' : 'pago', dias: a?.dias },
    { mes: 'Setembro', venc: '10/09/2026', valor: 1423.66, status: 'pago', pagoEm: '09/09' },
    { mes: 'Agosto', venc: '10/08/2026', valor: 1347.04, status: 'pago', pagoEm: '05/08' },
    { mes: 'Julho', venc: '10/07/2026', valor: 1347.04, status: 'pago', pagoEm: '10/07' },
  ];
}

export function historico(u) {
  if (!u.morador) return [];
  const m = u.morador;
  return [
    ['handshake', `Comprou com ${m.corretor}`, 'Contrato assinado · ' + (u.num === 501 ? 'mai/2026' : 'abr/2026')],
    ['key', 'Recebeu as chaves', m.desde],
    ['package', 'Retirou 14 encomendas', 'últimos 90 dias'],
    ['calendar-days', 'Reservou a churrasqueira', '18/10/2026'],
  ];
}

export const reservas = [
  { area: 'Brinquedoteca', unidade: 501, quem: 'Rafael Tavares', quando: 'amanhã · 15h às 17h', data: '04/11', status: 'confirmada' },
  { area: 'Salão de festas', unidade: 103, quem: 'Mariana Lacerda', quando: 'sáb · 19h às 23h', data: '07/11', status: 'confirmada' },
  { area: 'Churrasqueira', unidade: 401, quem: 'Eduardo Pires', quando: 'dom · 12h às 17h', data: '08/11', status: 'pendente' },
  { area: 'Espaço gourmet', unidade: 802, quem: 'Ana Terezinha Lopes', quando: 'sex · 20h às 23h', data: '13/11', status: 'confirmada' },
  { area: 'Quadra', unidade: 204, quem: 'Thiago Moura', quando: 'qui · 18h às 19h', data: '05/11', status: 'confirmada' },
];
export const AREAS = ['Salão de festas', 'Churrasqueira', 'Espaço gourmet', 'Brinquedoteca', 'Quadra', 'Academia'];

export const comunicados = [
  { titulo: 'Assembleia geral ordinária', autor: 'Helena Duarte · síndica', quando: 'há 2 dias', texto: 'Convocamos todos os condôminos para a AGO no dia 18/11 às 19h30 no salão de festas. Pauta: aprovação de contas, previsão orçamentária 2027 e regras do pet place.', tag: 'Novo', tipo: 'assembleia' },
  { titulo: 'Limpeza da caixa d’água', autor: 'Administração', quando: 'há 4 dias', texto: 'Na quinta-feira (05/11), das 8h às 12h, o abastecimento poderá oscilar. Reserve água para uso essencial.', tag: 'Aviso', tipo: 'manutencao' },
  { titulo: 'Novo armário inteligente na portaria', autor: 'Portaria', quando: 'há 1 semana', texto: 'As encomendas agora ficam no armário inteligente. Você recebe a foto e o código de 4 números pelo app.', tag: 'Portaria', tipo: 'portaria' },
];

export const clientes = [
  ['Daniela Teixeira', 'novo', 'Instagram', 'Apto 702', 'Renata Alves'], ['Otávio Brandão', 'novo', 'Site', 'Apto 801', 'Caio Monteiro'],
  ['Larissa Peixoto', 'novo', 'Indicação', 'Apto 603', 'Paulo Costa'], ['Fernando Duarte', 'novo', 'Portal', 'Apto 504', 'Lívia Prado'],
  ['Marina Couto', 'novo', 'WhatsApp', 'Apto 301', 'Renata Alves'], ['Leandro Viana', 'visita', 'Instagram', 'Apto 601', 'Paulo Costa'],
  ['Patrícia Gomes', 'visita', 'Stand', 'Apto 502', 'Caio Monteiro'], ['Rodrigo Sales', 'visita', 'Site', 'Apto 703', 'Lívia Prado'],
  ['Aline Martins', 'visita', 'Indicação', 'Apto 202', 'Paulo Costa'], ['Vítor Hugo Rezende', 'proposta', 'Portal', 'Apto 601', 'Renata Alves'],
  ['Simone Carvalho', 'proposta', 'Stand', 'Apto 702', 'Paulo Costa'], ['Danilo Prates', 'proposta', 'Instagram', 'Apto 402', 'Caio Monteiro'],
  ['Juliana Freitas', 'proposta', 'WhatsApp', 'Apto 803', 'Lívia Prado'], ['Marcelo Ventura', 'reserva', 'Indicação', 'Apto 304', 'Paulo Costa'],
  ['Beatriz Cunha', 'contrato', 'Stand', 'Apto 101', 'Renata Alves'], ['Rafael Tavares', 'contrato', 'Instagram', 'Apto 501', 'Paulo Costa'],
  ['Camila Ferraz', 'contrato', 'Portal', 'Apto 701', 'Caio Monteiro'], ['Diego Barreto', 'contrato', 'Site', 'Apto 804', 'Lívia Prado'],
  ['Henrique Matos', 'contrato', 'Indicação', 'Apto 203', 'Paulo Costa'], ['Vanessa Pacheco', 'contrato', 'Stand', 'Apto 503', 'Renata Alves'],
  ['Bruno Siqueira', 'contrato', 'Instagram', 'Apto 602', 'Caio Monteiro'], ['Ana Terezinha Lopes', 'contrato', 'WhatsApp', 'Apto 802', 'Lívia Prado'],
].map(([nome, etapa, origem, interesse, corretor], i) => ({ id: i + 1, nome, etapa, origem, interesse, corretor, ultimo: ['hoje', 'ontem', 'há 2 dias', 'há 3 dias', 'há 1 semana'][i % 5] }));

export const ETAPAS = [
  ['novo', 'Novo contato'], ['visita', 'Visita agendada'], ['proposta', 'Proposta'], ['reserva', 'Reserva'], ['contrato', 'Contrato'],
];

export const propostas = [
  { id: 'PR-418', cliente: 'Daniela Teixeira', unidade: 702, valor: 1_412_000, desconto: 3, status: 'enviada', validade: '10/11' },
  { id: 'PR-417', cliente: 'Vítor Hugo Rezende', unidade: 601, valor: 1_446_000, desconto: 3, status: 'analise', validade: '08/11' },
  { id: 'PR-416', cliente: 'Simone Carvalho', unidade: 702, valor: 1_398_000, desconto: 4, status: 'enviada', validade: '07/11' },
  { id: 'PR-415', cliente: 'Danilo Prates', unidade: 402, valor: 1_366_000, desconto: 2, status: 'aceita', validade: '06/11' },
  { id: 'PR-414', cliente: 'Juliana Freitas', unidade: 803, valor: 1_291_000, desconto: 2, status: 'aceita', validade: '05/11' },
  { id: 'PR-413', cliente: 'Marcelo Ventura', unidade: 304, valor: 1_172_000, desconto: 1, status: 'aceita', validade: '04/11' },
  { id: 'PR-412', cliente: 'Leandro Viana', unidade: 601, valor: 1_401_000, desconto: 6, status: 'recusada', validade: '27/10' },
];

export const vendasMes = [
  ['MAR', 1], ['ABR', 3], ['MAI', 2], ['JUN', 0], ['JUL', 3], ['AGO', 2], ['SET', 2], ['OUT', 1], ['NOV', 3],
];

export const ranking = [
  ['Paulo Costa', 6, 8_420_000], ['Renata Alves', 4, 5_610_000], ['Caio Monteiro', 4, 5_480_000], ['Lívia Prado', 3, 4_570_000],
];

export const consumo = {
  meses: ['JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV'],
  agua: [8.9, 9.6, 10.2, 9.1, 11.4, 3.2],
  gas: [2.6, 3.1, 3.4, 2.9, 3.9, 1.1],
};

export const documentos = [
  ['Convenção do condomínio', 'PDF · 2,1 MB'], ['Regimento interno', 'PDF · 860 KB'], ['Ata AGO 2026', 'PDF · 410 KB'],
  ['Manual do proprietário', 'PDF · 6,4 MB'], ['Escritura apto 501', 'PDF · 1,2 MB'], ['Apólice de seguro predial', 'PDF · 980 KB'],
];
