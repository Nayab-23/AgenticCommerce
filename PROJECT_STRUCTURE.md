# 📁 Project Structure

Complete file tree for the Agentic LLM Router MVP.

```
AgenticCommerce/
│
├── README.md                          # Main documentation
├── QUICKSTART.md                      # 5-minute setup guide
├── ARCHITECTURE.md                    # System architecture details
├── LICENSE                            # MIT License
├── .gitignore                         # Git ignore rules
├── .env.example                       # Environment template
├── package.json                       # Root package (workspaces)
│
├── scripts/                           # Setup and utility scripts
│   ├── setup.sh                       # Initial setup script
│   ├── start.sh                       # Start all services
│   └── fund-treasury.sh               # Treasury funding guide
│
├── shared/                            # Shared TypeScript types
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                   # Exports
│       └── types.ts                   # Type definitions
│
├── router-backend/                    # Main routing service
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.json              # Jest test configuration
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Environment template
│   │
│   ├── src/
│   │   ├── index.ts                  # Express server + endpoints
│   │   ├── config.ts                 # Configuration loader
│   │   ├── classifier.ts             # Prompt classification
│   │   ├── selector.ts               # Provider selection
│   │   ├── payment.ts                # USDC payment service
│   │   ├── verifier.ts               # Completion verification
│   │   ├── spend-tracker.ts          # Budget & audit logging
│   │   └── provider-client.ts        # Provider communication
│   │
│   ├── __tests__/                    # Unit tests
│   │   ├── classifier.test.ts
│   │   ├── selector.test.ts
│   │   ├── verifier.test.ts
│   │   └── spend-tracker.test.ts
│   │
│   └── data/                          # Runtime data (created on first run)
│       ├── audit.jsonl               # Append-only audit log
│       └── usage-stats.json          # Usage statistics
│
├── provider-wrappers/                 # Provider wrapper services
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                          # Environment variables
│   ├── .env.example                  # Environment template
│   │
│   └── src/
│       ├── config.ts                 # Configuration loader
│       ├── gemini-provider.ts        # Gemini wrapper (cheap)
│       ├── claude-provider.ts        # Claude wrapper (premium)
│       ├── payment-verifier.ts       # Payment verification
│       └── mock-llm.ts               # Mock LLM responses
│
└── frontend/                          # React UI
    ├── package.json
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts                # Vite configuration
    ├── index.html                    # HTML template
    │
    └── src/
        ├── main.tsx                  # React entry point
        ├── App.tsx                   # Main app component
        ├── InputPanel.tsx            # Prompt input component
        ├── ResultsPanel.tsx          # Results display component
        ├── StatsPanel.tsx            # Statistics component
        ├── api.ts                    # API client
        ├── types.ts                  # Type definitions
        └── index.css                 # Global styles
```

## File Count Summary

- **Total TypeScript files**: 27
- **Test files**: 4
- **Configuration files**: 11
- **Documentation files**: 4
- **Scripts**: 3

## Key Files Explained

### Root Level

| File | Purpose |
|------|---------|
| `README.md` | Complete documentation, setup, API docs |
| `QUICKSTART.md` | Fast 5-minute setup guide |
| `ARCHITECTURE.md` | System architecture diagrams |
| `package.json` | npm workspace configuration |
| `.env.example` | Environment variable template |

### Shared Types (`shared/`)

| File | Purpose |
|------|---------|
| `src/types.ts` | All TypeScript interfaces and types |
| `src/index.ts` | Re-exports for consumption |

**Key Types:**
- `RouteRequest` / `RouteResponse`
- `ProviderQuote`
- `PaymentDetails`
- `VerificationResult`
- `UsageStats`

### Router Backend (`router-backend/`)

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `src/index.ts` | Express server, main endpoint | ~300 |
| `src/classifier.ts` | Prompt classification logic | ~120 |
| `src/selector.ts` | Provider selection algorithm | ~150 |
| `src/payment.ts` | USDC payment via ethers.js | ~120 |
| `src/verifier.ts` | Result quality verification | ~100 |
| `src/spend-tracker.ts` | Budget enforcement & logging | ~150 |
| `src/provider-client.ts` | Provider communication | ~80 |

**Endpoints:**
- `POST /api/route` - Main routing
- `GET /api/stats` - Usage statistics
- `GET /api/treasury` - Treasury info
- `GET /health` - Health check

### Provider Wrappers (`provider-wrappers/`)

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `src/gemini-provider.ts` | Gemini wrapper service | ~120 |
| `src/claude-provider.ts` | Claude wrapper service | ~120 |
| `src/payment-verifier.ts` | Onchain payment verification | ~130 |
| `src/mock-llm.ts` | Mock LLM responses | ~90 |

**Each Provider Exposes:**
- `GET /quote` - Pricing info
- `POST /complete` - Completion request
- `GET /health` - Health check

### Frontend (`frontend/`)

| File | Purpose | Lines of Code |
|------|---------|---------------|
| `src/App.tsx` | Main coordinator | ~50 |
| `src/InputPanel.tsx` | Prompt input form | ~120 |
| `src/ResultsPanel.tsx` | Results display | ~200 |
| `src/StatsPanel.tsx` | Statistics display | ~80 |
| `src/api.ts` | API client | ~30 |
| `src/index.css` | Styles | ~400 |

## Dependency Graph

```
shared (types)
   ↑
   ├── router-backend
   │   ├── express
   │   ├── ethers
   │   ├── axios
   │   └── uuid
   │
   ├── provider-wrappers
   │   ├── express
   │   ├── ethers
   │   └── axios
   │
   └── frontend
       ├── react
       ├── vite
       └── axios
```

## Build Order

1. **shared** - Build first (types)
2. **router-backend** - Depends on shared
3. **provider-wrappers** - Depends on shared
4. **frontend** - Depends on shared (indirectly)

## Data Flow

```
User Input (Frontend)
    ↓
POST /api/route (Router Backend)
    ↓
Classify → Select → Pay → Request → Verify
    ↓
GET /quote (Provider Wrapper)
POST /complete (Provider Wrapper)
    ↓
USDC Transfer (Arc Blockchain)
    ↓
Result + Receipt (Frontend)
```

## Port Allocation

| Service | Port | URL |
|---------|------|-----|
| Frontend | 5173 | http://localhost:5173 |
| Router Backend | 3000 | http://localhost:3000 |
| Gemini Provider | 4001 | http://localhost:4001 |
| Claude Provider | 4002 | http://localhost:4002 |

## Environment Variables

### Router Backend

```bash
ARC_RPC_URL                # Arc network RPC endpoint
ARC_USDC_ADDRESS           # USDC token contract
TREASURY_PRIVATE_KEY       # Wallet private key
PROVIDER_GEMINI_ADDRESS    # Gemini payment address
PROVIDER_CLAUDE_ADDRESS    # Claude payment address
DAILY_SPEND_CAP_USDC       # Daily spending limit
PER_REQUEST_CAP_USDC       # Per-request limit
DEMO_MODE                  # Enable mock payments
EMERGENCY_STOP             # Block all payments
```

### Provider Wrappers

```bash
GEMINI_PORT                # Gemini service port
CLAUDE_PORT                # Claude service port
GEMINI_API_KEY             # Gemini API key (optional)
ANTHROPIC_API_KEY          # Anthropic API key (optional)
DEMO_MODE                  # Enable mock LLM responses
```

## Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| Setup | `./scripts/setup.sh` | Install all dependencies |
| Start All | `./scripts/start.sh` | Run all services |
| Fund Treasury | `./scripts/fund-treasury.sh` | Treasury funding guide |

## Testing

```bash
# Run all tests
cd router-backend
npm test

# Run specific test
npm test classifier.test.ts

# Watch mode
npm test -- --watch
```

## Code Statistics

- **Total Lines of Code**: ~2,500
- **TypeScript**: 100%
- **Test Coverage**: Core logic (classifier, selector, verifier)
- **Comments**: Inline documentation throughout

## Future Expansion Points

- Add more providers (OpenAI, Mistral, etc.)
- Database backend (PostgreSQL)
- Real LLM API integrations
- Advanced verification strategies
- Rate limiting & authentication
- Monitoring & alerting
- Docker containerization

---

**This structure provides a clean, modular, hackathon-ready MVP that can scale to production.** 🚀
