# CLAUDE.md — Prisma Beira-Mar

Guia para o Claude Code trabalhar neste projeto. Responda e escreva textos de interface em português do Brasil.

## O que é
CRM para incorporadora/corretor + condomínio, com espelho de vendas 3D (Three.js r170).
Site estático: HTML + CSS + ES modules, **sem build e sem npm install**. Bibliotecas ficam em `vendor/`.

## Rodar
```bash
npx serve .            # ou: python -m http.server 8000
```
Abrir http://localhost:3000 (serve) ou http://localhost:8000. Precisa de servidor HTTP (módulos ES não abrem via file://).

## Estrutura
- `index.html` — import map (`three` → `./vendor/three.module.js`), carrega Chart.js e qrcode, monta `#side`, `#view-espelho`, `#view-page`, `#mnav`, `#modal-root`, `#toasts`.
- `styles.css` — tema escuro premium (accent `#8b5cff`); mobile ≤ 900px usa barra inferior.
- `js/data.js` — dados de demonstração (32 unidades, 8 andares × 4; moradores, encomendas, chamados, contas, propostas, clientes...). Data "hoje" = 03/11/2026.
- `js/store.js` — estado global, `actions` (registro de ações por `data-a`), `emit/onChange`, `toast`, `openModal`, `qrSVG`, helpers.
- `js/building.js` — cena 3D: torre, cidade, mar, iluminação (noite/pôr do sol/dia), clique/raycast, seleção, badges.
- `js/plan.js` — plantas Tipo A/B (SVG) e planta 3D mobiliada.
- `js/app.js` — navegação, espelho, painéis (vendas, condomínio, ficha do morador), modais.
- `js/pages.js` — demais páginas (Geral, Unidades, Clientes, Propostas, Portaria, Chamados, Financeiro, Reservas, Comunicados, Moradores, Ajustes).
- `js/resident.js` — App do morador (simulação de celular).
- `js/icons.js` — ícones Lucide inline: `icon(nome, tamanho)`.

## Convenções
- Botões disparam ações com `data-a="nome"` (+ `data-n` = número da unidade). Registre novas ações com `Object.assign(actions, {...})`.
- Depois de mudar estado chame `emit()` para re-renderizar.
- Dados ficam em memória (recarregar = reset). Para persistir, adicionar backend/banco.
- Não usar `localStorage` nem Fullscreen API se for publicar no Perplexity (bloqueado no preview).
