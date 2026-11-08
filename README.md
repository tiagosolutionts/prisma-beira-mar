# Prisma Beira-Mar · CRM com Espelho de Vendas 3D

CRM para incorporadora/corretor e condomínio, com prédio 3D interativo (Three.js).

- **Vendas:** espelho 3D colorido por situação (disponível, reservado, vendido), planta humanizada, planta 3D mobiliada, propostas e reservas.
- **Condomínio:** encomendas da portaria com foto e QR, chamados, financeiro (contas, Pix, inadimplência), reservas, comunicados e moradores.
- **App do morador:** simulação do app no celular.

## Como rodar

Site estático, sem build. Sirva a pasta com qualquer servidor HTTP:

```bash
npx serve .
# ou
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Os dados são de demonstração e ficam em memória.
