export type QualityTier = 'cheap' | 'balanced' | 'premium'
export type TaskType =
  | 'trivial_math'
  | 'short_qa'
  | 'summarization'
  | 'writing'
  | 'reasoning'
  | 'code'
  | 'other'

export interface ProviderQuote {
  provider_id: string
  model_name: string
  price_per_1k_tokens: number
  base_fee: number
  est_latency_ms: number
  quality_tier: QualityTier
  expires_at: number
  arc_address: string
}

export interface PolicyConstraints {
  max_cost_usdc?: number
  max_latency_ms?: number
  quality_preference?: QualityTier
  use_allowlist?: boolean
  allowed_providers?: string[]
}

export interface RouteRequest {
  prompt: string
  policy?: PolicyConstraints
  request_id?: string
}

export interface ClassificationResult {
  task_type: TaskType
  estimated_tokens: number
  requires_quality: QualityTier
}

export interface ProviderSelection {
  provider_id: string
  quote: ProviderQuote
  estimated_cost: number
  rationale: string
}

export interface PaymentDetails {
  amount_usdc: number
  recipient_address: string
  tx_hash: string
  block_number?: number
  payment_nonce: string
}

export interface VerificationResult {
  passed: boolean
  score?: number
  reason: string
}

export interface RouteResponse {
  request_id: string
  classification: ClassificationResult
  quotes_received: ProviderQuote[]
  selected_provider: ProviderSelection
  payment: PaymentDetails
  completion: string
  verification: VerificationResult
  escalated?: boolean
  escalation_provider?: ProviderSelection
  escalation_payment?: PaymentDetails
  total_cost_usdc: number
  latency_ms: number
}

export interface UsageStats {
  total_requests: number
  total_spend_usdc: number
  spend_by_provider: Record<string, number>
  average_cost_usdc: number
  escalation_count: number
  requests_today: number
  spend_today: number
}

export interface DashboardStatsResponse {
  totals: {
    totalRequests: number
    totalSpend: number
    avgLatency: number
    successRate: number
  }
  costOverTime: Array<{ time: string; cost: number }>
  latencyOverTime: Array<{ time: string; latency: number }>
  providerBreakdown: Array<{ provider: string; requests: number; spend: number }>
  taskTypeBreakdown: Array<{ name: string; value: number }>
  recentRequests: Array<{
    id: string
    timestamp: string
    prompt: string
    taskType: string
    provider: string
    costUsdc: number
    latencyMs: number
    txHash: string
    verified: boolean
  }>
}

export interface TreasuryInfo {
  address: string
  balance_usdc: number
  daily_cap: number
  per_request_cap: number
}

export interface RequestSummary {
  id: string
  created_at: string
  prompt_preview: string
  task_type: string
  requires_quality: string
  provider_id: string
  estimated_cost: number
  total_cost_usdc: number
  latency_ms: number
  tx_hash: string
  verification_passed: boolean
  escalated: boolean
}

export interface RequestListResponse {
  requests: RequestSummary[]
}

export interface RequestDetail {
  id: string
  created_at: string
  request: RouteRequest
  response: RouteResponse
}

export interface ProviderInfo {
  id: string
  name: string
  address: string
  url: string
  allowlisted: boolean
}

export interface ProvidersResponse {
  providers: ProviderInfo[]
}

export interface ProviderHealth {
  provider: string
  model: string
  status: string
  demo_mode: boolean
}

export interface AuditEvent {
  id: string
  type: string
  request_id: string
  provider_id: string
  timestamp: string
  payload: Record<string, unknown>
}

export interface AuditResponse {
  events: AuditEvent[]
}

export interface PolicyResponse {
  emergency_stop: boolean
  per_request_cap_usdc: number
  daily_cap_usdc: number
  provider_allowlist: string[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'
const GEMINI_URL = process.env.NEXT_PUBLIC_PROVIDER_GEMINI_URL || 'http://localhost:4001'
const CLAUDE_URL = process.env.NEXT_PUBLIC_PROVIDER_CLAUDE_URL || 'http://localhost:4002'

const buildUrl = (base: string, path: string) => new URL(path, base).toString()

const fetchJson = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const data = await response.json()
      message = data?.error || JSON.stringify(data)
    } catch {
      const text = await response.text()
      if (text) {
        message = text
      }
    }
    throw new Error(message || 'Request failed')
  }

  return response.json() as Promise<T>
}

export const apiConfig = {
  apiBaseUrl: API_BASE_URL,
  providerUrls: {
    gemini: GEMINI_URL,
    claude: CLAUDE_URL,
  },
}

export const fetchDashboardStats = () =>
  fetchJson<DashboardStatsResponse>(buildUrl(API_BASE_URL, '/api/dashboard/stats'))

export const fetchUsageStats = () =>
  fetchJson<UsageStats>(buildUrl(API_BASE_URL, '/api/stats'))

export const fetchTreasuryInfo = () =>
  fetchJson<TreasuryInfo>(buildUrl(API_BASE_URL, '/api/treasury'))

export const fetchHealth = () =>
  fetchJson<{ status: string; demo_mode: boolean; emergency_stop: boolean }>(
    buildUrl(API_BASE_URL, '/health'),
  )

export const fetchRequests = (limit = 50) =>
  fetchJson<RequestListResponse>(buildUrl(API_BASE_URL, `/api/requests?limit=${limit}`))

export const fetchRequest = (requestId: string) =>
  fetchJson<RequestDetail>(
    buildUrl(API_BASE_URL, `/api/requests/${encodeURIComponent(requestId)}`),
  )

export const fetchAuditEvents = (limit = 200) =>
  fetchJson<AuditResponse>(buildUrl(API_BASE_URL, `/api/audit?limit=${limit}`))

export const fetchProviders = () =>
  fetchJson<ProvidersResponse>(buildUrl(API_BASE_URL, '/api/providers'))

export const updateProviderAllowlist = (providerId: string, allowlisted: boolean) =>
  fetchJson<{ id: string; allowlisted: boolean }>(
    buildUrl(API_BASE_URL, `/api/providers/${encodeURIComponent(providerId)}/allowlist`),
    {
      method: 'PATCH',
      body: JSON.stringify({ allowlisted }),
    },
  )

export const fetchPolicy = () =>
  fetchJson<PolicyResponse>(buildUrl(API_BASE_URL, '/api/policy'))

export const updatePolicy = (payload: Partial<PolicyResponse>) =>
  fetchJson<PolicyResponse>(buildUrl(API_BASE_URL, '/api/policy'), {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const createRouteRequest = (payload: RouteRequest) =>
  fetchJson<RouteResponse>(buildUrl(API_BASE_URL, '/api/route'), {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const fetchProviderQuote = (providerUrl: string) =>
  fetchJson<ProviderQuote>(buildUrl(providerUrl, '/quote'))

export const fetchProviderHealth = (providerUrl: string) =>
  fetchJson<ProviderHealth>(buildUrl(providerUrl, '/health'))
