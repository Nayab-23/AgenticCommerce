import {
  ProviderQuote,
  QualityTier,
  RouteRequest,
  RouteResponse,
} from '@agentic-commerce/shared';
import fs from 'fs';
import path from 'path';

export interface StoredRequest {
  id: string;
  created_at: string;
  request: RouteRequest;
  response: RouteResponse;
}

export interface RequestSummary {
  id: string;
  created_at: string;
  prompt_preview: string;
  task_type: string;
  requires_quality: string;
  provider_id: string;
  estimated_cost: number;
  total_cost_usdc: number;
  latency_ms: number;
  tx_hash: string;
  verification_passed: boolean;
  escalated: boolean;
}

export interface AuditEvent {
  id: string;
  type: string;
  request_id: string;
  provider_id: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

class RequestStore {
  private requests: StoredRequest[] = [];
  private requestMap = new Map<string, StoredRequest>();
  private maxEntries = 100;
  private auditLogPath: string;

  constructor() {
    const dataDir = path.join(__dirname, '..', 'data');
    this.auditLogPath = path.resolve(dataDir, 'audit.jsonl');
    this.loadFromAuditLog();
  }

  /**
   * Load historical requests from audit log on startup
   */
  private loadFromAuditLog() {
    try {
      if (fs.existsSync(this.auditLogPath)) {
        const content = fs.readFileSync(this.auditLogPath, 'utf8');
        const lines = content.trim().split('\n').filter(Boolean);

        // Load last 100 entries to populate request store
        const recentLines = lines.slice(-this.maxEntries);

        // Process in reverse order to get newest first
        for (let i = recentLines.length - 1; i >= 0; i--) {
          const line = recentLines[i];
          const entry = JSON.parse(line);

          // Reconstruct a minimal StoredRequest from audit log
          const storedRequest: StoredRequest = {
            id: entry.request_id,
            created_at: entry.timestamp,
            request: {
              prompt: entry.prompt_preview,
              request_id: entry.request_id
            },
            response: {
              request_id: entry.request_id,
              classification: {
                task_type: entry.classification,
                estimated_tokens: 100, // Default estimate
                requires_quality: this.inferQualityTier(entry.classification)
              },
              quotes_received: [],
              selected_provider: {
                provider_id: entry.selected_provider,
                quote: {} as ProviderQuote,
                estimated_cost: entry.cost_usdc,
                rationale: ''
              },
              payment: {
                tx_hash: entry.payment_tx,
                amount_usdc: entry.cost_usdc,
                recipient_address: '',
                payment_nonce: '',
                block_number: 0
              },
              completion: '',
              verification: {
                passed: entry.verification_passed,
                score: 1.0,
                reason: 'Historical entry'
              },
              escalated: entry.escalated || false,
              total_cost_usdc: entry.cost_usdc,
              latency_ms: 1000
            }
          };

          this.requests.push(storedRequest);
          this.requestMap.set(storedRequest.id, storedRequest);
        }

        console.log(`Loaded ${this.requests.length} historical requests into request store (newest first)`);
      }
    } catch (error) {
      console.error('Failed to load audit log into request store:', error);
      this.requests = [];
    }
  }

  private inferQualityTier(taskType: string): QualityTier {
    const tierMap: Record<string, QualityTier> = {
      'trivial_math': 'cheap',
      'short_qa': 'cheap',
      'summarization': 'balanced',
      'writing': 'balanced',
      'code': 'balanced',
      'reasoning': 'premium'
    };
    return tierMap[taskType] || 'balanced';
  }

  add(request: RouteRequest, response: RouteResponse): void {
    const entry: StoredRequest = {
      id: response.request_id,
      created_at: new Date().toISOString(),
      request,
      response,
    };

    this.requests.unshift(entry);
    this.requestMap.set(entry.id, entry);

    if (this.requests.length > this.maxEntries) {
      const removed = this.requests.pop();
      if (removed) {
        this.requestMap.delete(removed.id);
      }
    }
  }

  list(limit = 50): RequestSummary[] {
    return this.requests.slice(0, limit).map((entry) => this.toSummary(entry));
  }

  get(id: string): StoredRequest | undefined {
    return this.requestMap.get(id);
  }

  getAuditEvents(limit = 200): AuditEvent[] {
    const events: AuditEvent[] = [];

    for (const entry of this.requests) {
      events.push(...this.buildEvents(entry));
      if (events.length >= limit) {
        break;
      }
    }

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  private toSummary(entry: StoredRequest): RequestSummary {
    const { response, request, created_at } = entry;
    return {
      id: response.request_id,
      created_at,
      prompt_preview: request.prompt.substring(0, 120),
      task_type: response.classification.task_type,
      requires_quality: response.classification.requires_quality,
      provider_id: response.selected_provider.provider_id,
      estimated_cost: response.selected_provider.estimated_cost,
      total_cost_usdc: response.total_cost_usdc,
      latency_ms: response.latency_ms,
      tx_hash: response.payment.tx_hash,
      verification_passed: response.verification.passed,
      escalated: Boolean(response.escalated),
    };
  }

  private buildEvents(entry: StoredRequest): AuditEvent[] {
    const { response, request, created_at } = entry;
    const baseTime = new Date(created_at).getTime();
    const timestamp = (offsetMs: number) => new Date(baseTime + offsetMs).toISOString();

    const events: AuditEvent[] = [];
    const selectedProvider = response.selected_provider.provider_id;

    events.push({
      id: `${response.request_id}-routing`,
      type: 'routing_decision',
      request_id: response.request_id,
      provider_id: selectedProvider,
      timestamp: timestamp(0),
      payload: {
        taskType: response.classification.task_type,
        estimatedTokens: response.classification.estimated_tokens,
        requiresQuality: response.classification.requires_quality,
        selectedProvider,
        rationale: response.selected_provider.rationale,
      },
    });

    response.quotes_received.forEach((quote, index) => {
      events.push({
        id: `${response.request_id}-quote-${quote.provider_id}`,
        type: 'quote_received',
        request_id: response.request_id,
        provider_id: quote.provider_id,
        timestamp: timestamp(20 + index * 5),
        payload: {
          model: quote.model_name,
          pricePer1kTokens: quote.price_per_1k_tokens,
          baseFee: quote.base_fee,
          estLatencyMs: quote.est_latency_ms,
          qualityTier: quote.quality_tier,
          estimatedCost: this.estimateCost(quote, response.classification.estimated_tokens),
        },
      });
    });

    events.push({
      id: `${response.request_id}-payment`,
      type: 'payment_sent',
      request_id: response.request_id,
      provider_id: selectedProvider,
      timestamp: timestamp(60),
      payload: {
        amountUsdc: response.payment.amount_usdc,
        recipient: response.payment.recipient_address,
        txHash: response.payment.tx_hash,
        paymentNonce: response.payment.payment_nonce,
      },
    });

    events.push({
      id: `${response.request_id}-provider-verified`,
      type: 'provider_verified',
      request_id: response.request_id,
      provider_id: selectedProvider,
      timestamp: timestamp(80),
      payload: {
        txHash: response.payment.tx_hash,
        blockNumber: response.payment.block_number,
        status: response.payment.block_number ? 'confirmed' : 'submitted',
      },
    });

    events.push({
      id: `${response.request_id}-completion`,
      type: 'completion_received',
      request_id: response.request_id,
      provider_id: selectedProvider,
      timestamp: timestamp(120),
      payload: {
        completionPreview: response.completion.substring(0, 140),
        completionLength: response.completion.length,
        promptPreview: request.prompt.substring(0, 100),
      },
    });

    events.push({
      id: `${response.request_id}-verification`,
      type: response.verification.passed ? 'verification_passed' : 'verification_failed',
      request_id: response.request_id,
      provider_id: selectedProvider,
      timestamp: timestamp(150),
      payload: {
        passed: response.verification.passed,
        score: response.verification.score,
        reason: response.verification.reason,
      },
    });

    if (response.escalated && response.escalation_provider) {
      events.push({
        id: `${response.request_id}-escalated`,
        type: 'escalated',
        request_id: response.request_id,
        provider_id: response.escalation_provider.provider_id,
        timestamp: timestamp(180),
        payload: {
          initialProvider: selectedProvider,
          escalationProvider: response.escalation_provider.provider_id,
          escalationCost: response.escalation_provider.estimated_cost,
          escalationTxHash: response.escalation_payment?.tx_hash,
        },
      });
    }

    return events;
  }

  private estimateCost(quote: ProviderQuote, estimatedTokens: number): number {
    const tokenCost = (estimatedTokens / 1000) * quote.price_per_1k_tokens;
    return quote.base_fee + tokenCost;
  }
}

export const requestStore = new RequestStore();
