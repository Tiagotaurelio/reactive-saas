# Deploy ReActive SaaS

## Checklist

- Node.js 20+
- `npm install`
- `npm run lint`
- `npm test`
- `npm run build`

## Variaveis de ambiente

- `DATABASE_URL`
  - opcional
  - quando presente, ativa Postgres
- `DATABASE_SSL`
  - opcional
  - use `require` quando o provedor exigir SSL
- `REACTIVE_DATA_DIR`
  - opcional
  - diretorio de dados quando rodando em SQLite

## Modos de persistencia

- Sem `DATABASE_URL`: SQLite em `data/reactive.db`
- Com `DATABASE_URL`: Postgres

## Hostinger + Supabase

Recomendacao para o seu caso:

- Hostinger VPS para executar o container
- Supabase Postgres para o banco do `reactive-saas`
- GitHub Actions para publicar por push

Use a string do Supabase no formato de pooler em `DATABASE_URL` e mantenha `DATABASE_SSL=require`.

Arquivo base:

- [.env.hostinger.example](/Users/tiagotavares/reactive-saas/.env.hostinger.example)

Workflow pronto:

- [deploy-hostinger.yml](/Users/tiagotavares/reactive-saas/.github/workflows/deploy-hostinger.yml)
- [deploy-production.yml](/Users/tiagotavares/reactive-saas/.github/workflows/deploy-production.yml)
- [public-healthcheck.yml](/Users/tiagotavares/reactive-saas/.github/workflows/public-healthcheck.yml)
- [public-smoke.yml](/Users/tiagotavares/reactive-saas/.github/workflows/public-smoke.yml)

Secrets esperados no GitHub:

- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `REACTIVE_DEPLOY_PATH`
- `REACTIVE_DATABASE_URL`
- `REACTIVE_DATABASE_SSL`
- `REACTIVE_PUBLIC_DOMAIN`
- `ALERT_WEBHOOK_URL`

## Healthcheck

- `GET /api/health`

## Validacao pos-deploy

1. Confirmar `200` em `/api/health`.
2. Abrir `/demo` e `/login`.
3. Entrar com `admin@reactive.local / demo123` no ambiente de homologacao.
4. Confirmar `/api/auth/session`, `/dashboard`, `/clientes`, `/inbox` e `/logs`.
5. Fazer uma importacao de smoke e validar clientes impactados.

## Smoke automatizado

```bash
APP_URL=https://seu-ambiente.example.com npm run smoke:deploy
```

Se o ambiente usar credenciais diferentes, sobrescreva:

```bash
REACTIVE_SMOKE_EMAIL=operacao@example.com REACTIVE_SMOKE_PASSWORD=segredo APP_URL=https://seu-ambiente.example.com npm run smoke:deploy
```

## Monitoramento

- healthcheck publico a cada 15 minutos via GitHub Actions
- smoke funcional diario contra `https://reactive.tavarestech.cloud`

## Inicio em producao

```bash
npm run build
npm run start
```
