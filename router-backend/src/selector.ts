import {
  ProviderQuote,
  PolicyConstraints,
  ClassificationResult,
  ProviderSelection,
  QualityTier
} from '@agentic-commerce/shared';
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

    // Let explicit caller policy override the classifier's default tier.
    const qualityPreference = policy?.quality_preference || classification.requires_quality || 'balanced';
    const selected = this.selectByQuality(scoredCandidates, qualityPreference, classification);

    if (!selected) {
      return null;
    }

    return {
      provider_id: selected.quote.provider_id,
      quote: selected.quote,
      estimated_cost: selected.estimatedCost,
      rationale: this.generateRationale(selected.quote, selected.estimatedCost, classification, scoredCandidates)
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
    if (estimatedCost > maxCost && quote.base_fee > maxCost) {
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
    qualityPreference: QualityTier,
    classification: ClassificationResult
  ): { quote: ProviderQuote; estimatedCost: number } | null {
    // For code tasks, both GPT (balanced) and Claude (premium) are good
    // Prioritize cost optimization unless complexity is very high
    if (classification.task_type === 'code') {
      const isComplexCode = classification.estimated_tokens > 200; // Long/complex code request

      if (!isComplexCode) {
        // For simple/medium code tasks, pick cheapest among GPT and Claude
        const gptOrClaude = candidates.filter(c =>
          c.quote.provider_id === 'openai' || c.quote.provider_id === 'claude'
        );

        if (gptOrClaude.length > 0) {
          // Sort by cost and return cheapest
          gptOrClaude.sort((a, b) => a.estimatedCost - b.estimatedCost);
          return gptOrClaude[0];
        }
      } else {
        // For complex code tasks, prefer Claude if available
        const claude = candidates.find(c => c.quote.provider_id === 'claude');
        if (claude) {
          return claude;
        }
      }
    }

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
    classification: ClassificationResult,
    allCandidates: Array<{ quote: ProviderQuote; estimatedCost: number }>
  ): string {
    const providerNames: Record<string, string> = {
      'gemini': 'Gemini',
      'claude': 'Claude',
      'openai': 'GPT'
    };

    const taskReasons: Record<string, string> = {
      'trivial_math': 'Simple math calculation requires fast, cost-efficient processing',
      'short_qa': 'Straightforward question answering benefits from quick response times',
      'summarization': 'Summarization tasks need balanced quality and cost',
      'writing': 'Content generation requires creative language capabilities',
      'reasoning': 'Complex reasoning benefits from advanced inference abilities',
      'code': 'Code generation task',
      'other': 'General task routing based on quality requirements'
    };

    const name = providerNames[quote.provider_id] || quote.provider_id;
    let taskReason = taskReasons[classification.task_type] || 'Task requires appropriate quality tier';

    // Special reasoning for code tasks
    if (classification.task_type === 'code') {
      const isComplexCode = classification.estimated_tokens > 200;
      if (isComplexCode && quote.provider_id === 'claude') {
        taskReason = 'Complex code generation benefits from Claude\'s advanced technical capabilities';
      } else if (!isComplexCode) {
        // Check if we saved money by choosing cheaper option
        const gptOrClaude = allCandidates.filter(c =>
          c.quote.provider_id === 'openai' || c.quote.provider_id === 'claude'
        );
        if (gptOrClaude.length > 1) {
          taskReason = 'Code generation - selected cost-optimal provider (GPT and Claude both excel at code)';
        } else {
          taskReason = 'Code generation requires technical precision';
        }
      } else {
        taskReason = 'Code generation requires technical precision';
      }
    }

    // Calculate savings vs most expensive option
    const maxCost = Math.max(...allCandidates.map(c => c.estimatedCost));
    const savings = maxCost - estimatedCost;
    const savingsText = savings > 0.001 ? ` (saves $${savings.toFixed(4)} vs most expensive)` : '';

    return `${taskReason}. Selected ${name} (${quote.quality_tier} tier) for ${quote.model_name} at $${estimatedCost.toFixed(4)}${savingsText}`;
  }
}
