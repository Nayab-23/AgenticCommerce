// Shared types for Agentic LLM Router

export type TaskType = 
  | 'trivial_math'
  | 'short_qa'
  | 'summarization'
  | 'writing'
  | 'reasoning'
  | 'code'
  | 'other';

export type QualityTier = 'cheap' | 'balanced' | 'premium';

export interface ProviderQuote {
  provider_id: string;
  model_name: string;
  price_per_1k_tokens: number;
  base_fee: number;
  est_latency_ms: number;
  quality_tier: QualityTier;
  expires_at: number; // Unix timestamp
  arc_address: string;
}

export interface PolicyConstraints {
  max_cost_usdc?: number;
  max_latency_ms?: number;
  quality_preference?: QualityTier;
  use_allowlist?: boolean;
  allowed_providers?: string[];
}

export interface RouteRequest {
  prompt: string;
  policy?: PolicyConstraints;
  request_id?: string;
}

export interface ClassificationResult {
  task_type: TaskType;
  estimated_tokens: number;
  requires_quality: QualityTier;
}

export interface ProviderSelection {
  provider_id: string;
  quote: ProviderQuote;
  estimated_cost: number;
  rationale: string;
}

export interface PaymentDetails {
  amount_usdc: number;
  recipient_address: string;
  tx_hash: string;
  block_number?: number;
  payment_nonce: string;
}

export interface VerificationResult {
  passed: boolean;
  score?: number;
  reason: string;
}

export interface RouteResponse {
  request_id: string;
  classification: ClassificationResult;
  quotes_received: ProviderQuote[];
  selected_provider: ProviderSelection;
  payment: PaymentDetails;
  completion: string;
  verification: VerificationResult;
  escalated?: boolean;
  escalation_provider?: ProviderSelection;
  escalation_payment?: PaymentDetails;
  total_cost_usdc: number;
  latency_ms: number;
}

export interface CompletionRequest {
  prompt: string;
  payment_nonce: string;
  tx_hash: string;
  expected_amount: number;
  request_id: string;
}

export interface CompletionResponse {
  completion: string;
  tokens_used: number;
  model: string;
  provider_id: string;
}

export interface UsageStats {
  total_requests: number;
  total_spend_usdc: number;
  spend_by_provider: Record<string, number>;
  average_cost_usdc: number;
  escalation_count: number;
  requests_today: number;
  spend_today: number;
}

export interface AuditLogEntry {
  timestamp: string;
  request_id: string;
  prompt_preview: string;
  classification: TaskType;
  selected_provider: string;
  payment_tx: string;
  cost_usdc: number;
  escalated: boolean;
  verification_passed: boolean;
}
