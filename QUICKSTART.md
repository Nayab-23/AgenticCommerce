# Quickstart

## Prerequisites

- Node.js 20.11 or newer
- npm 11 or newer
- Optional: Circle credentials and Arc testnet access if you want real transfers

## Bootstrap The Workspace

```bash
npm run bootstrap
cp router-backend/.env.example router-backend/.env
cp provider-wrappers/.env.example provider-wrappers/.env
```

Keep `DEMO_MODE=true` in both env files for a local sandbox run.
Keep `SHOWCASE_DATA=true` in `router-backend/.env` if you want the dashboard preloaded with curated traffic for screenshots and walkthroughs.

## Start The Stack

```bash
npm run dev
```

Services started by the root dev command:

- `router-backend` on `http://localhost:3000`
- `provider-wrappers` on `http://localhost:4001`, `:4002`, and `:4003`
- `web` on `http://localhost:5173`

## Validate The Basics

1. Open `http://localhost:5173/dashboard`.
2. Submit a prompt from the overview page.
3. Confirm a provider is selected and a receipt card is rendered.
4. Open the Billing, Requests, and Providers screens to verify data is flowing.

## Individual Workspace Commands

```bash
npm run dev --workspace=router-backend
npm run dev --workspace=provider-wrappers
npm run dev --workspace=web
```

## Verification Commands

```bash
npm run build
npm test
```

## Common Configuration

Router backend:

- `ARC_RPC_URL`
- `ARC_EXPLORER_BASE`
- `CIRCLE_API_KEY`
- `CIRCLE_ENTITY_SECRET_RAW`
- `CIRCLE_WALLET_ID`
- `PROVIDER_ALLOWLIST`

Provider wrappers:

- `GEMINI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `ALLOW_UNVERIFIED_PAYMENTS`

Dashboard:

- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_EXPLORER_BASE_URL`

## Troubleshooting

- If the dashboard loads but has no provider data, confirm ports `4001` to `4003` are free and wrapper services started cleanly.
- If request submission fails, confirm the router backend is reachable on port `3000`.
- If you switch out of sandbox mode, make sure Circle and Arc credentials are valid before retrying.
