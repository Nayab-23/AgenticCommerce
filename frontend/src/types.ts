export interface RouteRequest {
  prompt: string;
  policy?: {
    max_cost_usdc?: number;
    max_latency_ms?: number;
    quality_preference?: 'cheap' | 'balanced' | 'premium';
    use_allowlist?: boolean;
  };
}

export interface RouteResponse {
  request_id: string;
  classification: {
    task_type: string;
    estimated_tokens: number;
    requires_quality: string;
  };
  quotes_received: Array<{
    provider_id: string;
    model_name: string;
    price_per_1k_tokens: number;
    base_fee: number;
    est_latency_ms: number;
    quality_tier: string;
    arc_address: string;
  }>;
  selected_provider: {
    provider_id: string;
    quote: any;
    estimated_cost: number;
    rationale: string;
  };
  payment: {
    amount_usdc: number;
    recipient_address: string;
    tx_hash: string;
    block_number?: number;
    payment_nonce: string;
  };
  completion: string;
  verification: {
    passed: boolean;
    score?: number;
    reason: string;
  };
  escalated?: boolean;
  escalation_provider?: any;
  escalation_payment?: any;
  total_cost_usdc: number;
  latency_ms: number;
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
