import { ProviderSelector } from '../src/selector';
import { ProviderQuote, ClassificationResult } from '@agentic-commerce/shared';

describe('ProviderSelector', () => {
  let selector: ProviderSelector;
  let mockQuotes: ProviderQuote[];
  let mockClassification: ClassificationResult;

  beforeEach(() => {
    selector = new ProviderSelector();
    
    mockQuotes = [
      {
        provider_id: 'gemini',
        model_name: 'gemini-1.5-flash',
        price_per_1k_tokens: 0.00001,
        base_fee: 0.0001,
        est_latency_ms: 800,
        quality_tier: 'cheap',
        expires_at: Date.now() + 60000,
        arc_address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb5'
      },
      {
        provider_id: 'claude',
        model_name: 'claude-3-haiku',
        price_per_1k_tokens: 0.00025,
        base_fee: 0.0003,
        est_latency_ms: 1200,
        quality_tier: 'premium',
        expires_at: Date.now() + 60000,
        arc_address: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199'
      }
    ];

    mockClassification = {
      task_type: 'trivial_math',
      estimated_tokens: 50,
      requires_quality: 'cheap'
    };
  });

  test('selects cheapest provider for cheap quality preference', () => {
    const result = selector.selectProvider(mockQuotes, mockClassification);
    
    expect(result).not.toBeNull();
    expect(result?.provider_id).toBe('gemini');
  });

  test('respects quality preference for premium', () => {
    const result = selector.selectProvider(
      mockQuotes,
      mockClassification,
      { quality_preference: 'premium' }
    );
    
    expect(result).not.toBeNull();
    expect(result?.provider_id).toBe('claude');
  });

  test('respects cost constraints', () => {
    const result = selector.selectProvider(
      mockQuotes,
      mockClassification,
      { max_cost_usdc: 0.0001 } // Very low - only base fee allowed
    );
    
    expect(result?.provider_id).toBe('gemini'); // Cheapest
  });

  test('respects latency constraints', () => {
    const result = selector.selectProvider(
      mockQuotes,
      mockClassification,
      { max_latency_ms: 1000 }
    );
    
    expect(result?.provider_id).toBe('gemini'); // Faster
  });

  test('returns null when no providers meet constraints', () => {
    const result = selector.selectProvider(
      mockQuotes,
      mockClassification,
      { max_cost_usdc: 0.00001 } // Impossibly low
    );
    
    expect(result).toBeNull();
  });

  test('filters by allowed providers', () => {
    const result = selector.selectProvider(
      mockQuotes,
      mockClassification,
      { allowed_providers: ['claude'] }
    );
    
    expect(result?.provider_id).toBe('claude');
  });
});
