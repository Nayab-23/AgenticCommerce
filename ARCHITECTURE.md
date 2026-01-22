# System Architecture

## High-Level Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                        │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Input Panel │  │Results Panel│  │ Stats Panel │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└──────────────────────────┬────────────────────────────────────────┘
                           │ HTTP API (axios)
                           ▼
┌───────────────────────────────────────────────────────────────────┐
│                    ROUTER BACKEND (Express)                       │
│                                                                   │
│  Request Flow:                                                    │
│  1. Receive prompt + policy                                       │
│  2. Classify → task_type, tokens, quality_tier                   │
│  3. Fetch quotes from providers                                   │
│  4. Select optimal provider (cost + constraints)                  │
│  5. Check spending limits                                         │
│  6. Pay provider in USDC on Arc                                   │
│  7. Request completion from provider                              │
│  8. Verify result quality                                         │
│  9. Escalate if needed (within budget)                           │
│  10. Record audit log + update stats                             │
│  11. Return response                                              │
└──────────────┬────────────────────────────┬───────────────────────┘
               │                            │
               │ USDC Payment (Arc L1)     │ Completion Request
               ▼                            ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│    ARC BLOCKCHAIN        │   │   PROVIDER WRAPPERS       │
│                          │   │                           │
│  USDC ERC20 Contract     │   │  ┌──────────────────┐    │
│  - transfer()            │   │  │ Gemini Provider  │    │
│  - balanceOf()           │   │  │ - GET /quote     │    │
│  - Transfer events       │   │  │ - POST /complete │    │
│                          │   │  └──────────────────┘    │
│  Transaction Receipt:    │   │                           │
│  - tx_hash              │   │  ┌──────────────────┐    │
│  - block_number         │   │  │ Claude Provider  │    │
│  - from/to/value        │   │  │ - GET /quote     │    │
└──────────────────────────┘   │  │ - POST /complete │    │
                               │  └──────────────────┘    │
                               └──────────────────────────┘
                                           │
                                           ▼
                               ┌──────────────────────────┐
                               │   LLM APIs (External)    │
                               │  - Gemini API            │
                               │  - Anthropic API         │
                               └──────────────────────────┘
```

## Data Flow

### 1. Prompt Classification

```
User Prompt
    │
    ▼
[Keyword Analysis]
    │
    ├─ Contains math operators? → trivial_math
    ├─ Contains code keywords? → code
    ├─ Complex reasoning? → reasoning
    ├─ Writing keywords? → writing
    ├─ Summary keywords? → summarization
    ├─ Short question? → short_qa
    └─ Default → other
    │
    ▼
Classification Result:
- task_type: string
- estimated_tokens: number
- requires_quality: 'cheap' | 'balanced' | 'premium'
```

### 2. Provider Selection

```
Quotes from Providers
    │
    ▼
[Apply Filters]
├─ Within budget?
├─ Within latency limit?
├─ On allowlist?
├─ Quote not expired?
└─ Meets quality tier?
    │
    ▼
[Calculate Cost]
cost = base_fee + (tokens / 1000) * price_per_1k
    │
    ▼
[Sort by Cost]
    │
    ▼
[Select by Quality Preference]
cheap → cheapest first
balanced → balance cost/quality
premium → highest quality first
    │
    ▼
Selected Provider
```

### 3. Payment Flow

```
Selected Provider
    │
    ▼
[Generate Payment Nonce]
nonce = UUID v4
    │
    ▼
[Check Spending Limits]
├─ amount <= per_request_cap?
└─ today_spend + amount <= daily_cap?
    │
    ▼
[Execute USDC Transfer]
ethers.js → USDC.transfer(provider_address, amount)
    │
    ▼
[Wait for Confirmation]
    │
    ▼
Payment Receipt:
- tx_hash
- block_number
- amount_usdc
- recipient_address
- payment_nonce
```

### 4. Provider Verification

```
Completion Request
    │
    ▼
Provider Receives:
- prompt
- tx_hash
- expected_amount
- payment_nonce
    │
    ▼
[Verify Payment]
├─ Nonce not used before?
├─ TX exists on chain?
├─ Amount >= expected?
└─ Recipient matches?
    │
    ├─ ✅ Valid → Process request
    │
    └─ ❌ Invalid → Return 402 Payment Required
```

### 5. Verification & Escalation

```
Completion Response
    │
    ▼
[Verify Quality]
├─ Math: Contains number?
├─ Code: Has code structure?
├─ QA: Reasonable length?
└─ Generic: Meets min length?
    │
    ├─ ✅ PASS → Return result
    │
    └─ ❌ FAIL → Escalate?
                    │
                    ├─ Budget remaining?
                    ├─ Premium provider available?
                    └─ ✅ → Repeat payment + request
```

## Component Details

### Router Backend Modules

```
┌─────────────────────────────────────────┐
│           router-backend/                │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ index.ts (Express Server)      │     │
│  │ - POST /api/route              │     │
│  │ - GET /api/stats               │     │
│  │ - GET /api/treasury            │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ classifier.ts                  │     │
│  │ - classifyPrompt()             │     │
│  │ - estimateTokens()             │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ selector.ts                    │     │
│  │ - selectProvider()             │     │
│  │ - meetsConstraints()           │     │
│  │ - estimateCost()               │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ payment.ts (PaymentService)    │     │
│  │ - payProvider()                │     │
│  │ - getTreasuryBalance()         │     │
│  │ - (uses ethers.js)             │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ verifier.ts                    │     │
│  │ - verify()                     │     │
│  │ - verifyMath()                 │     │
│  │ - verifyCode()                 │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ spend-tracker.ts               │     │
│  │ - canSpend()                   │     │
│  │ - recordSpending()             │     │
│  │ - getStats()                   │     │
│  │ - logAudit()                   │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ provider-client.ts             │     │
│  │ - fetchQuotes()                │     │
│  │ - requestCompletion()          │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Provider Wrappers

```
┌─────────────────────────────────────────┐
│       provider-wrappers/                 │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ gemini-provider.ts             │     │
│  │ - GET /quote                   │     │
│  │ - POST /complete               │     │
│  │ - Quality: cheap               │     │
│  │ - Price: $0.00001/1K tokens    │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ claude-provider.ts             │     │
│  │ - GET /quote                   │     │
│  │ - POST /complete               │     │
│  │ - Quality: premium             │     │
│  │ - Price: $0.00025/1K tokens    │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ payment-verifier.ts            │     │
│  │ - verifyPayment()              │     │
│  │ - Track nonces                 │     │
│  │ - Check blockchain             │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ mock-llm.ts                    │     │
│  │ - generateMockCompletion()     │     │
│  │ - Template responses           │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Frontend Components

```
┌─────────────────────────────────────────┐
│           frontend/                      │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ App.tsx                        │     │
│  │ - Main coordinator             │     │
│  │ - State management             │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ InputPanel.tsx                 │     │
│  │ - Prompt input                 │     │
│  │ - Policy controls              │     │
│  │ - Submit button                │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ ResultsPanel.tsx               │     │
│  │ - Classification display       │     │
│  │ - Quotes comparison            │     │
│  │ - Payment details              │     │
│  │ - Completion result            │     │
│  │ - Verification status          │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ StatsPanel.tsx                 │     │
│  │ - Total requests               │     │
│  │ - Spend tracking               │     │
│  │ - Provider breakdown           │     │
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ api.ts                         │     │
│  │ - API client (axios)           │     │
│  │ - Type-safe requests           │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                      │
│                                                         │
│  Layer 1: Spending Guardrails                          │
│  ┌───────────────────────────────────────────┐         │
│  │ - Per-request cap: $0.02 USDC             │         │
│  │ - Daily cap: $1.00 USDC                   │         │
│  │ - Emergency stop flag                     │         │
│  └───────────────────────────────────────────┘         │
│                                                         │
│  Layer 2: Provider Allowlist                           │
│  ┌───────────────────────────────────────────┐         │
│  │ - Whitelist of trusted addresses          │         │
│  │ - Configurable via env                    │         │
│  └───────────────────────────────────────────┘         │
│                                                         │
│  Layer 3: Payment Verification                         │
│  ┌───────────────────────────────────────────┐         │
│  │ - Nonce-based replay protection           │         │
│  │ - Onchain tx verification                 │         │
│  │ - Amount + recipient validation           │         │
│  └───────────────────────────────────────────┘         │
│                                                         │
│  Layer 4: Audit Logging                               │
│  ┌───────────────────────────────────────────┐         │
│  │ - Append-only JSONL logs                  │         │
│  │ - Every request tracked                   │         │
│  │ - Immutable history                       │         │
│  └───────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
Production Setup:

┌──────────────────────────────────────────────────────┐
│                   Load Balancer                      │
│                   (Nginx/Cloudflare)                 │
└────────────┬─────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐       ┌─────────┐
│ Router  │       │ Router  │
│ Backend │       │ Backend │
│ (Node)  │       │ (Node)  │
└────┬────┘       └────┬────┘
     │                 │
     └────────┬────────┘
              │
              ▼
    ┌──────────────────┐
    │   PostgreSQL     │
    │   (Audit Logs)   │
    └──────────────────┘
              │
              ▼
    ┌──────────────────┐
    │   Redis          │
    │   (Quote Cache)  │
    └──────────────────┘

┌──────────────────────────────────────────────────────┐
│              Provider Wrappers (Separate)            │
│  ┌─────────────┐  ┌─────────────┐                   │
│  │   Gemini    │  │   Claude    │                   │
│  │   Service   │  │   Service   │                   │
│  └─────────────┘  └─────────────┘                   │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│              Arc Blockchain Network                   │
│         (Public EVM L1 - No Deployment)              │
└──────────────────────────────────────────────────────┘
```

## State Management

```
Router Backend State:
┌─────────────────────────────┐
│ In-Memory:                  │
│ - Active requests map       │
│ - Provider client instances │
│ - Payment service instance  │
│                             │
│ Persistent (File):          │
│ - usage-stats.json          │
│ - audit.jsonl               │
│                             │
│ Persistent (Blockchain):    │
│ - Payment transactions      │
│ - USDC balances             │
└─────────────────────────────┘

Provider Wrapper State:
┌─────────────────────────────┐
│ In-Memory:                  │
│ - Used nonces (Set)         │
│ - Request cache             │
└─────────────────────────────┘

Frontend State:
┌─────────────────────────────┐
│ React State:                │
│ - Current result            │
│ - Error state               │
│ - Loading state             │
│ - Stats (polled)            │
└─────────────────────────────┘
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable microservices design
- ✅ Auditable payment trail
- ✅ Pluggable provider system
- ✅ Enforceable spending limits
- ✅ Progressive quality escalation
