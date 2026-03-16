# Architecture

## System Overview

```text
Dashboard (Next.js)
    |
    v
Router API (Express)
    |
    +--> Classification and policy evaluation
    +--> Quote collection and provider selection
    +--> Spend tracking and audit logging
    +--> Payment orchestration
    |
    +--> Gemini wrapper
    +--> Claude wrapper
    +--> OpenAI wrapper
            |
            v
      Upstream provider APIs

Payment path:
Router API -> Circle programmable wallet -> Arc USDC transfer -> provider receipt verification
```

## Request Lifecycle

1. The dashboard or client submits a route request with prompt and policy constraints.
2. The router classifies the prompt and estimates task complexity.
3. Wrapper services return provider quotes and capability metadata.
4. The selector chooses the best candidate within cost, latency, and allowlist constraints.
5. The payment service creates a transfer record or simulates one in sandbox mode.
6. The selected wrapper verifies the payment inputs before producing a completion.
7. The router verifies the result, records audit data, and escalates when policy allows.

## Data Boundaries

- `shared/` defines the request, quote, payment, verification, and dashboard types.
- `router-backend/data/` stores audit and usage data generated during local runs.
- `web/` reads aggregated data from the router API only; it does not query wrappers directly except for health and quote checks.

## Deployment Notes

- Local development is optimized for sandbox mode.
- Real transfers require valid Circle credentials and Arc configuration.
- Explorer links in the dashboard are configurable through `NEXT_PUBLIC_EXPLORER_BASE_URL`.
