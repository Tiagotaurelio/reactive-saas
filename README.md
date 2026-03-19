# ReActive SaaS

Plataforma de recuperacao de receita para distribuidores B2B, com importacao de pedidos, fila operacional e handoff comercial.

## Rodando localmente

```bash
npm install
npm run dev
```

Por padrao o app sobe em `http://localhost:3000`.

## Credenciais demo

- Email: `admin@reactive.local`
- Senha: `demo123`

## Comandos uteis

```bash
npm run lint
npm test
npm run build
APP_URL=http://127.0.0.1:3000 npm run smoke:deploy
```

## Rotas principais

- `/login`
- `/dashboard`
- `/importar-csv`
- `/clientes`
- `/inbox`
- `/logs`

## Healthcheck

Use `GET /api/health` para validar se a aplicacao subiu e qual storage esta ativo.

Exemplo de resposta:

```json
{
  "ok": true,
  "app": "reactive-saas",
  "storage": "sqlite",
  "timestamp": "2026-03-18T00:00:00.000Z"
}
```

## Persistencia

- Sem `DATABASE_URL`, o app usa SQLite em `data/reactive.db`
- Com `DATABASE_URL`, o app usa Postgres
- Em testes, `REACTIVE_DATA_DIR` pode isolar banco e arquivos

## Smoke test rapido

1. Abrir `/login` e entrar com o usuario demo.
2. Confirmar `200` em `/api/auth/session`.
3. Validar `/dashboard`, `/clientes`, `/inbox` e `/logs`.
4. Importar um CSV em `/importar-csv` e confirmar impacto operacional no retorno.

## Smoke automatizado

Use:

```bash
APP_URL=https://seu-ambiente.example.com npm run smoke:deploy
```

Variaveis opcionais:

- `REACTIVE_SMOKE_EMAIL`
- `REACTIVE_SMOKE_PASSWORD`

## Monitoramento

- Healthcheck publico: `https://reactive.tavarestech.cloud/api/health`
- Workflow agendado de healthcheck: [public-healthcheck.yml](/Users/tiagotavares/reactive-saas/.github/workflows/public-healthcheck.yml)
- Workflow agendado de smoke funcional: [public-smoke.yml](/Users/tiagotavares/reactive-saas/.github/workflows/public-smoke.yml)
- Webhook opcional de alerta: secret `ALERT_WEBHOOK_URL`

## Producao separada

- Workflow de deploy dedicado: [deploy-production.yml](/Users/tiagotavares/reactive-saas/.github/workflows/deploy-production.yml)
- Dominio de producao via secret `REACTIVE_PUBLIC_DOMAIN`
- Recomendado usar GitHub Environment `production`

## Observacoes

- O app esta em `Next 16`
- `lint`, `test` e `build` ja foram validados localmente
- Existe cobertura automatizada de API e UI operacional
