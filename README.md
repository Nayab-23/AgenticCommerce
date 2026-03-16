# Agentic Commerce

Agentic Commerce is a multi-service workspace for routing LLM requests under policy constraints, settling usage in USDC, and exposing the full request and receipt trail in a dashboard.

## What It Does

- Routes prompts to the lowest-cost provider that still meets quality, latency, and allowlist constraints.
- Verifies payment before provider execution and records immutable transaction references.
- Exposes request history, spend controls, provider health, and receipt data in a Next.js dashboard.
- Runs locally in sandbox mode and can be wired to real Circle and Arc infrastructure.

## Workspace Layout

| Path | Purpose |
| --- | --- |
| `router-backend/` | Express router API, policy engine, spending controls, request store |
| `provider-wrappers/` | Gemini, Claude, and OpenAI wrapper services with payment verification |
| `shared/` | Shared TypeScript types used across the workspace |
| `web/` | Next.js operations dashboard |
| `scripts/` | Local setup and helper scripts |

## Local Development

```bash
npm run bootstrap
cp router-backend/.env.example router-backend/.env
cp provider-wrappers/.env.example provider-wrappers/.env
npm run dev
```

Default local endpoints:

- Dashboard: `http://localhost:5173`
- Router API: `http://localhost:3000`
- Gemini wrapper: `http://localhost:4001`
- Claude wrapper: `http://localhost:4002`
- OpenAI wrapper: `http://localhost:4003`

See [QUICKSTART.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/QUICKSTART.md) for the full setup flow.

## Useful Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start backend, wrappers, and dashboard together |
| `npm run build` | Build all workspaces |
| `npm test` | Build shared types and run workspace tests |
| `npm run verify` | Full build and test pass |

## Configuration Notes

- Keep `DEMO_MODE=true` for local sandbox runs.
- Replace all placeholder values in the env files before using real Circle or provider credentials.
- Use `NEXT_PUBLIC_EXPLORER_BASE_URL` in `web/.env.local` if you want dashboard links to point at a different Arc explorer.

## Project Docs

- [QUICKSTART.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/QUICKSTART.md): local setup and common workflows
- [ARCHITECTURE.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/ARCHITECTURE.md): system boundaries and request lifecycle
- [PROJECT_STRUCTURE.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/PROJECT_STRUCTURE.md): repository map
- [PROJECT_COMPLETE.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/PROJECT_COMPLETE.md): current delivery status and backlog
- [DEMO_CHECKLIST.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/DEMO_CHECKLIST.md): launch review and manual validation checklist
- [CHANGELOG.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/CHANGELOG.md): recent repository refresh notes
- [CONTRIBUTING.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/CONTRIBUTING.md): contribution expectations
- [SECURITY.md](/Users/nayab/Downloads/PolarisFolder/AgenticCommerce/SECURITY.md): secret handling and disclosure guidance

## Current Status

The repository is set up as an integration-ready sandbox:

- Provider wrappers support local quote and completion flows.
- The router enforces budget, latency, and allowlist policies.
- The dashboard exposes provider, billing, audit, and request detail views.
- Environment examples are sanitized and ready for real credentials to be added outside source control.
