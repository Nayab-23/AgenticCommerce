# Repository Structure

```text
.
├── router-backend/        Express API, policy engine, spend tracking
├── provider-wrappers/     Provider quote and completion services
├── shared/                Shared TypeScript contracts
├── web/                   Next.js dashboard
├── scripts/               Local setup and helper scripts
├── README.md              Project overview
├── QUICKSTART.md          Local development guide
├── ARCHITECTURE.md        Architecture notes
└── PROJECT_COMPLETE.md    Delivery status and backlog
```

## Key Areas

- `router-backend/src/`: routing, selection, payment, verification, request storage, and stats endpoints
- `provider-wrappers/src/`: Gemini, Claude, and OpenAI wrapper implementations plus payment verification
- `shared/src/`: request, response, provider, billing, and dashboard types
- `web/app/`: dashboard routes and page-level data loading
- `web/components/`: reusable UI and dashboard presentation components

## Supporting Files

- `.env.example`: root placeholder reference only
- `router-backend/.env.example`: backend runtime template
- `provider-wrappers/.env.example`: wrapper runtime template
- `CHANGELOG.md`: notable repository refresh entries
- `CONTRIBUTING.md`: contribution workflow
- `SECURITY.md`: secret handling and reporting guidance
