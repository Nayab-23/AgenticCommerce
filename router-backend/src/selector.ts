import {
  ProviderQuote,
  PolicyConstraints,
  ClassificationResult,
  ProviderSelection,
  QualityTier
} from '@agentic-router/shared';
import { config } from './config';

/**
 * Selects the best provider based on policy constraints and optimization objective
 */
export class ProviderSelector {
  /**
   * Select provider that minimizes cost while meeting constraints
   */
  selectProvider(
    quotes: ProviderQuote[],
    classification: ClassificationResult,
    policy?: PolicyConstraints
  ): ProviderSelection | null {
    // Apply filters
    let candidates = quotes.filter(q => this.meetsConstraints(q, classification, policy));
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Calculate estimated cost for each candidate
    const scoredCandidates = candidates.map(quote => {
      const estimatedCost = this.estimateCost(quote, classification.estimated_tokens);
      return { quote, estimatedCost };
    });
    
    // Sort by cost (ascending)
    scoredCandidates.sort((a, b) => a.estimatedCost - b.estimatedCost);
    
    // Select cheapest that meets quality requirements
    const qualityPreference = policy?.quality_preference || classification.requires_quality;
    const selected = this.selectByQuality(scoredCandidates, qualityPreference);
    
    if (!selected) {
      return null;
    }
    
    return {
      provider_id: selected.quote.provider_id,
      quote: selected.quote,
      estimated_cost: selected.estimatedCost,
      rationale: this.generateRationale(selected.quote, selected.estimatedCost, qualityPreference)
    };
  }
  
  /**
   * Check if quote meets all constraints
   */
  private meetsConstraints(
    quote: ProviderQuote,
    classification: ClassificationResult,
    policy?: PolicyConstraints
  ): boolean {
    // Check allowlist
    if (policy?.use_allowlist !== false && config.providerAllowlist.length > 0) {
      if (!config.providerAllowlist.includes(quote.arc_address)) {
        return false;
      }
    }
    
    // Check specific allowed providers
    if (policy?.allowed_providers && policy.allowed_providers.length > 0) {
      if (!policy.allowed_providers.includes(quote.provider_id)) {
        return false;
      }
    }
    
    // Check expiry
    if (quote.expires_at < Date.now()) {
      return false;
    }
    
    // Check latency constraint
    if (policy?.max_latency_ms && quote.est_latency_ms > policy.max_latency_ms) {
      return false;
    }
    
    // Check cost constraint
    const estimatedCost = this.estimateCost(quote, classification.estimated_tokens);
    const maxCost = policy?.max_cost_usdc || config.perRequestCapUsdc;
    if (estimatedCost > maxCost) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Estimate total cost for a request
   */
  private estimateCost(quote: ProviderQuote, estimatedTokens: number): number {
    const tokenCost = (estimatedTokens / 1000) * quote.price_per_1k_tokens;
    return quote.base_fee + tokenCost;
  }
  
  /**
   * Select by quality tier preference
   */
  private selectByQuality(
    candidates: Array<{ quote: ProviderQuote; estimatedCost: number }>,
    qualityPreference: QualityTier
  ): { quote: ProviderQuote; estimatedCost: number } | null {
    // Map quality tiers to priority order
    const qualityPriority: Record<QualityTier, QualityTier[]> = {
      'cheap': ['cheap', 'balanced', 'premium'],
      'balanced': ['balanced', 'premium', 'cheap'],
      'premium': ['premium', 'balanced', 'cheap']
    };
    
    const priorities = qualityPriority[qualityPreference];
    
    // Try to find provider matching preferred quality tier
    for (const tier of priorities) {
      const match = candidates.find(c => c.quote.quality_tier === tier);
      if (match) {
        return match;
      }
    }
    
    // Fallback to cheapest
    return candidates[0] || null;
  }
  
  /**
   * Generate human-readable rationale
   */
  private generateRationale(
    quote: ProviderQuote,
    estimatedCost: number,
    qualityPreference: QualityTier
  ): string {
    return `Selected ${quote.provider_id} (${quote.model_name}): ` +
           `Quality tier ${quote.quality_tier} matches ${qualityPreference} preference. ` +
           `Estimated cost $${estimatedCost.toFixed(4)} USDC, ` +
           `latency ~${quote.est_latency_ms}ms.`;
  }
}
