# 🤖 Autonomous LLM Procurement & Payment Router

**A hackathon-ready MVP that routes prompts to optimal LLM providers with USDC payments on Arc L1**

An AI agent that:
- 🧠 **Classifies prompts** and determines quality requirements
- 💰 **Selects the cheapest provider** meeting policy constraints
- ⛓️ **Pays per request in USDC** on Arc (EVM L1) with onchain receipts
- ✅ **Verifies results** and escalates to premium providers when needed
- 📊 **Tracks spending** with enforced guardrails

---

## 📋 Table of Contents

- [Architecture](#architecture)
- [Features](#features)
- [Quick Start](#quick-start)
- [System Components](#system-components)
- [API Documentation](#api-documentation)
- [Demo Flow](#demo-flow)
- [Configuration](#configuration)
- [Security & Guardrails](#security--guardrails)
- [Threat Model](#threat-model)
- [Testing](#testing)
- [Production Deployment](#production-deployment)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER / FRONTEND                         │
│                     (React + Vite UI)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTP POST /api/route
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTER SERVICE (Agent)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Classifier   │→ │  Selector    │→ │ Payment Svc  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│           │                │                  │                 │
│           ▼                ▼                  ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Task Type    │  │ Cost Optimize│  │ USDC Transfer│         │
│  │ Token Est    │  │ Policy Check │  │ on Arc L1    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │ USDC Payment (onchain)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ARC NETWORK (EVM L1)                       │
│         USDC ERC20 Transfer → Provider Address                  │
│         TX Hash recorded as verifiable receipt                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
┌──────────────────────┐    ┌──────────────────────┐
│  Gemini Provider     │    │  Claude Provider     │
│  (Wrapper Service)   │    │  (Wrapper Service)   │
│                      │    │                      │
│  1. Verify Payment   │    │  1. Verify Payment   │
│  2. Check TX Hash    │    │  2. Check TX Hash    │
│  3. Call Upstream    │    │  3. Call Upstream    │
│  4. Return Result    │    │  4. Return Result    │
└──────────────────────┘    └──────────────────────┘
          │                             │
          ▼                             ▼
┌──────────────────────┐    ┌──────────────────────┐
│  Gemini API          │    │  Anthropic API       │
│  (gemini-1.5-flash)  │    │  (claude-3-haiku)    │
└──────────────────────┘    └──────────────────────┘
```

---

## ✨ Features

### Core Capabilities

✅ **Prompt Classification**
- Categorizes into: trivial_math, code, reasoning, writing, summarization, short_qa, other
- Estimates token requirements
- Derives quality tier needs (cheap/balanced/premium)

✅ **Provider Selection**
- Fetches real-time quotes from multiple providers
- Optimizes for cost while meeting constraints:
  - Budget limits (per-request and daily)
  - Latency requirements
  - Quality tier preferences
  - Provider allowlist

✅ **USDC Payments on Arc**
- Direct ERC20 transfers to provider addresses
- Generates unique payment nonces (replay protection)
- Returns verifiable transaction hashes
- Waits for onchain confirmation

✅ **Payment Verification**
- Providers verify payment before responding
- Checks: recipient, amount, tx hash, nonce
- Prevents replay attacks

✅ **Progressive Escalation**
- Verifies completion quality
- Automatically escalates to premium provider if initial attempt fails
- Only if within budget constraints

✅ **Spending Guardrails**
- Per-request spending cap (default: $0.02 USDC)
- Daily spending cap (default: $1.00 USDC)
- Provider allowlist enforcement
- Emergency stop mechanism

✅ **Audit Logging**
- Append-only JSONL logs
- Records: request_id, provider, payment tx, cost, verification results
- Full request traceability

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- (Optional) Arc testnet access for real blockchain transactions

### Installation

```bash
# Clone or navigate to the project directory
cd AgenticCommerce

# Run setup script
chmod +x scripts/setup.sh
./scripts/setup.sh

# This will:
# - Install all dependencies
# - Build shared types
# - Create .env files from examples
```

### Start All Services

```bash
# Start everything at once
npm run dev

# Or use the convenience script
chmod +x scripts/start.sh
./scripts/start.sh
```

This starts:
- **Router Backend** → `http://localhost:3000`
- **Gemini Provider** → `http://localhost:4001`
- **Claude Provider** → `http://localhost:4002`
- **Frontend UI** → `http://localhost:5173`

### Access the Demo

Open your browser to: **http://localhost:5173**

---

## 🧩 System Components

### 1. **Router Backend** (`router-backend/`)

The main orchestration service.

**Key Modules:**
- `classifier.ts` - Prompt analysis and task type detection
- `selector.ts` - Provider selection algorithm
- `payment.ts` - USDC payment handling via ethers.js
- `verifier.ts` - Completion quality verification
- `spend-tracker.ts` - Budget enforcement and statistics
- `provider-client.ts` - Communication with provider wrappers

**Endpoints:**
- `POST /api/route` - Main routing endpoint
- `GET /api/stats` - Usage statistics
- `GET /api/treasury` - Treasury wallet info
- `GET /health` - Health check

### 2. **Provider Wrappers** (`provider-wrappers/`)

Simulate LLM provider services with payment verification.

**Services:**
- `gemini-provider.ts` - Gemini Flash wrapper (cheap tier)
- `claude-provider.ts` - Claude Haiku wrapper (premium tier)

**Endpoints (each provider):**
- `GET /quote` - Return pricing and capabilities
- `POST /complete` - Process completion after payment verification
- `GET /health` - Health check

**Features:**
- Payment verification via Arc blockchain
- Nonce-based replay protection
- Mock LLM responses for demo mode
- Real API integration ready (just add keys)

### 3. **Frontend** (`frontend/`)

React + Vite UI for interacting with the system.

**Panels:**
- **Input Panel** - Submit prompts with policy constraints
- **Results Panel** - Shows agent decision flow step-by-step:
  - Classification
  - Quotes received
  - Provider selection + rationale
  - Payment details with tx hash
  - Completion result
  - Verification outcome
  - Escalation (if occurred)
- **Stats Panel** - Real-time usage metrics

### 4. **Shared Types** (`shared/`)

TypeScript type definitions shared across all services.

---

## 📡 API Documentation

### POST /api/route

Route a prompt to the optimal provider.

**Request:**
```json
{
  "prompt": "Calculate the square root of 144",
  "policy": {
    "max_cost_usdc": 0.02,
    "max_latency_ms": 5000,
    "quality_preference": "balanced",
    "use_allowlist": true
  }
}
```

**Response:**
```json
{
  "request_id": "abc-123",
  "classification": {
    "task_type": "trivial_math",
    "estimated_tokens": 25,
    "requires_quality": "cheap"
  },
  "quotes_received": [
    {
      "provider_id": "gemini",
      "model_name": "gemini-1.5-flash",
      "price_per_1k_tokens": 0.00001,
      "base_fee": 0.0001,
      "est_latency_ms": 800,
      "quality_tier": "cheap",
      "arc_address": "0x742d..."
    }
  ],
  "selected_provider": {
    "provider_id": "gemini",
    "estimated_cost": 0.000125,
    "rationale": "Selected gemini: Quality tier cheap matches..."
  },
  "payment": {
    "amount_usdc": 0.000125,
    "recipient_address": "0x742d...",
    "tx_hash": "0xabc123...",
    "block_number": 12345,
    "payment_nonce": "uuid-v4"
  },
  "completion": "The square root of 144 is 12.",
  "verification": {
    "passed": true,
    "score": 1.0,
    "reason": "Contains numerical answer"
  },
  "total_cost_usdc": 0.000125,
  "latency_ms": 1234
}
```

### GET /api/stats

Get usage statistics.

**Response:**
```json
{
  "total_requests": 42,
  "total_spend_usdc": 0.0523,
  "spend_by_provider": {
    "gemini": 0.0321,
    "claude": 0.0202
  },
  "average_cost_usdc": 0.001245,
  "escalation_count": 3,
  "requests_today": 15,
  "spend_today": 0.0187
}
```

### GET /api/treasury

Get treasury wallet information.

**Response:**
```json
{
  "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "balance_usdc": 5.23,
  "daily_cap": 1.0,
  "per_request_cap": 0.02
}
```

---

## 🎬 Demo Flow

### Example: Math Question

1. **User Input:**
   ```
   Prompt: "What is 2 + 2?"
   Max Cost: $0.02 USDC
   Quality: Balanced
   ```

2. **Classification:**
   - Task Type: `trivial_math`
   - Estimated Tokens: 15
   - Required Quality: `cheap`

3. **Provider Quotes:**
   - Gemini: $0.00001/1K tokens, ~800ms, cheap tier
   - Claude: $0.00025/1K tokens, ~1200ms, premium tier

4. **Selection Decision:**
   - **Chosen: Gemini**
   - Rationale: "Cheapest provider meeting quality requirements"
   - Estimated Cost: $0.00015 USDC

5. **Payment:**
   - Transfer $0.00015 USDC to Gemini's Arc address
   - TX Hash: `0xabc123...` (viewable on Arc explorer)

6. **Completion:**
   - Gemini receives payment verification
   - Returns: "The answer is 4."

7. **Verification:**
   - ✅ PASSED - Contains numerical answer
   - No escalation needed

8. **Result:**
   - Total Cost: $0.00015 USDC
   - Latency: 1.2 seconds
   - Receipt: onchain tx hash

---

## ⚙️ Configuration

### Environment Variables

#### Router Backend (`.env`)

```bash
# Arc Network
ARC_RPC_URL=https://rpc.arc.xyz
ARC_USDC_ADDRESS=0x1234...  # USDC token contract
ARC_CHAIN_ID=1234

# Treasury (NEVER use test keys with real funds!)
TREASURY_PRIVATE_KEY=0xac09...

# Provider Addresses
PROVIDER_GEMINI_ADDRESS=0x742d...
PROVIDER_CLAUDE_ADDRESS=0x8626...

# Provider URLs
PROVIDER_GEMINI_URL=http://localhost:4001
PROVIDER_CLAUDE_URL=http://localhost:4002

# Spending Limits
DAILY_SPEND_CAP_USDC=1.0
PER_REQUEST_CAP_USDC=0.02

# System
PORT=3000
DEMO_MODE=true          # Uses mock payments
EMERGENCY_STOP=false    # Blocks all payments

# Allowlist
PROVIDER_ALLOWLIST=0x742d...,0x8626...
```

#### Provider Wrappers (`.env`)

```bash
# Ports
GEMINI_PORT=4001
CLAUDE_PORT=4002

# API Keys (optional - uses mocks if not provided)
GEMINI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here

# Models
GEMINI_MODEL=gemini-1.5-flash
CLAUDE_MODEL=claude-3-haiku-20240307

# Demo Mode
DEMO_MODE=true
```

### Demo Mode

When `DEMO_MODE=true`:
- ✅ Payments are simulated (mock tx hashes generated)
- ✅ LLM responses are templated (no API keys needed)
- ✅ Full routing logic still executes
- ✅ Perfect for demos and testing

Set `DEMO_MODE=false` for real blockchain transactions.

---

## 🔒 Security & Guardrails

### Spending Controls

1. **Per-Request Cap**
   - Default: $0.02 USDC
   - Prevents single expensive requests

2. **Daily Spending Cap**
   - Default: $1.00 USDC
   - Resets at midnight
   - Blocks requests if exceeded

3. **Provider Allowlist**
   - Only pre-approved addresses can receive funds
   - Prevents malicious provider injection

4. **Emergency Stop**
   - Set `EMERGENCY_STOP=true` to block all payments immediately
   - Does not require service restart

### Payment Security

1. **Nonce-Based Replay Protection**
   - Each payment has unique UUID nonce
   - Providers track used nonces
   - Prevents double-spending attacks

2. **Onchain Verification**
   - Providers verify tx hash on Arc blockchain
   - Checks: amount, recipient, block confirmation
   - Rejects invalid/insufficient payments

3. **Treasury Isolation**
   - Private key only held by router service
   - Never exposed to frontend or logs
   - Use hardware wallet for production

### Audit Trail

- **Append-only logs** in `router-backend/data/audit.jsonl`
- Contains: timestamp, request_id, provider, payment tx, cost, verification
- Immutable record for accounting

---

## 🛡️ Threat Model

### Threats Mitigated

| Threat | Mitigation |
|--------|------------|
| **Excessive Spending** | Per-request and daily caps enforced |
| **Replay Attacks** | Unique nonces, providers track usage |
| **Malicious Providers** | Allowlist enforcement |
| **Payment Fraud** | Onchain verification of tx hash |
| **Provider Collusion** | Multiple provider options, cost optimization |
| **Treasury Compromise** | Demo keys only, production uses HSM/MPC |
| **Data Tampering** | Append-only audit logs |

### Known Limitations (MVP)

⚠️ **Not Production Ready:**
- Private keys in `.env` (use vault/HSM for prod)
- No rate limiting on API endpoints
- No user authentication/authorization
- Limited error handling for network failures
- No retry logic for failed transactions

⚠️ **Blockchain:**
- Demo mode uses mock transactions
- Real mode needs Arc testnet USDC
- No MEV protection
- No gas price optimization

---

## 🧪 Testing

### Run Unit Tests

```bash
cd router-backend
npm test
```

### Test Coverage

- ✅ Classifier: prompt categorization
- ✅ Selector: provider selection logic
- ✅ Verifier: completion quality checks
- 🚧 Integration tests: end-to-end flow (stub provided)

### Manual Testing

**Test Scenario 1: Simple Math**
```
Prompt: "Calculate 2 + 2"
Expected: Selects Gemini (cheap), verifies successfully
```

**Test Scenario 2: Complex Reasoning**
```
Prompt: "Explain the theory of relativity and its implications"
Expected: Selects Claude (premium) or escalates to it
```

**Test Scenario 3: Budget Constraint**
```
Prompt: Long coding task
Max Cost: $0.001 USDC (very low)
Expected: Rejects or selects cheapest provider
```

**Test Scenario 4: Escalation**
```
Prompt: "What is foobar?" (nonsense)
Expected: First provider may fail verification, escalates to premium
```

---

## 🚢 Production Deployment

### Checklist

- [ ] Replace test private keys with secure key management (HSM/MPC/Vault)
- [ ] Set `DEMO_MODE=false` and configure real Arc RPC endpoint
- [ ] Fund treasury wallet with real USDC on Arc mainnet
- [ ] Add real LLM API keys (Gemini, Anthropic)
- [ ] Implement rate limiting (e.g., express-rate-limit)
- [ ] Add authentication (JWT/OAuth) for API access
- [ ] Set up monitoring (Datadog, New Relic, etc.)
- [ ] Configure alerting for:
  - Low treasury balance
  - Failed payments
  - Unusual spending patterns
- [ ] Deploy behind load balancer with HTTPS
- [ ] Enable CORS only for trusted domains
- [ ] Set up database for audit logs (PostgreSQL recommended)
- [ ] Implement retry logic with exponential backoff
- [ ] Add circuit breakers for provider failures

### Recommended Stack

**Infrastructure:**
- Docker + Kubernetes for orchestration
- PostgreSQL for persistent storage
- Redis for caching quotes
- Nginx as reverse proxy

**Monitoring:**
- Prometheus + Grafana for metrics
- ELK stack for log aggregation
- Sentry for error tracking

**Security:**
- AWS KMS / GCP Secret Manager for keys
- Cloudflare for DDoS protection
- Regular security audits

---

## 📊 Cost Analysis

### Example Costs (Demo Values)

| Task Type | Provider | Cost per Request | Typical Savings |
|-----------|----------|-----------------|----------------|
| Simple Math | Gemini | $0.0001 | 95% vs Claude |
| Short QA | Gemini | $0.0003 | 90% vs Claude |
| Code Generation | Claude | $0.0025 | N/A (quality needed) |
| Long Writing | Claude | $0.0045 | N/A (quality needed) |

**Monthly Projection (1000 requests):**
- All Gemini: ~$0.30
- All Claude: ~$3.50
- Smart Routing: ~$0.80 (77% savings)

---

## 🤝 Contributing

This is a hackathon MVP. Contributions welcome!

**Priority Improvements:**
1. Real LLM API integrations (Gemini, Claude)
2. Additional providers (OpenAI, Mistral, etc.)
3. Advanced verification (semantic similarity, fact-checking)
4. UI improvements (charts, history, export)
5. Database backend (replace file-based storage)

---

## 📄 License

MIT License - See LICENSE file

---

## 👥 Credits

Built for hackathon demo by Claude Code.

**Technologies Used:**
- Node.js + TypeScript
- Express.js
- React + Vite
- ethers.js
- Arc Network (EVM L1)

---

## 🔗 Resources

- **Arc Network Explorer:** https://explorer.arc.xyz
- **Arc RPC Docs:** https://docs.arc.xyz
- **USDC on Arc:** Check Arc docs for token contract address
- **Gemini API:** https://ai.google.dev/
- **Anthropic API:** https://www.anthropic.com/api

---

## 📞 Support

For issues or questions:
1. Check the [Issues](issues) tab
2. Review environment variable configuration
3. Ensure all services are running (`npm run dev`)
4. Check logs in each service's terminal

**Common Issues:**

**"No providers available"**
→ Ensure provider-wrappers are running on ports 4001, 4002

**"Payment verification failed"**
→ Check DEMO_MODE is true, or treasury has USDC balance

**"Daily spend cap exceeded"**
→ Reset: delete `router-backend/data/usage-stats.json`

---

**Ready to route some prompts? 🚀**

```bash
npm run dev
# Open http://localhost:5173
```
