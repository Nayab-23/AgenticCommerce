import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  ProviderQuote,
  CompletionRequest,
  CompletionResponse
} from '@agentic-router/shared';
import { config } from './config';
import { PaymentVerifier } from './payment-verifier';
import { generateMockCompletion } from './mock-llm';

const app = express();
app.use(cors());
app.use(express.json());

const paymentVerifier = new PaymentVerifier();

// Provider metadata
const PROVIDER_ID = 'claude';
const MODEL_NAME = config.claude.model;
const PROVIDER_ADDRESS = process.env.PROVIDER_CLAUDE_ADDRESS || '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199';

/**
 * GET /quote - Return pricing information
 */
app.get('/quote', (req: Request, res: Response) => {
  const quote: ProviderQuote = {
    provider_id: PROVIDER_ID,
    model_name: MODEL_NAME,
    price_per_1k_tokens: 0.002, // Adjusted to meet Circle min transfer amounts
    base_fee: 0.03,
    est_latency_ms: 1200,
    quality_tier: 'premium',
    expires_at: Date.now() + 60000, // Valid for 60 seconds
    arc_address: PROVIDER_ADDRESS
  };
  
  res.json(quote);
});

/**
 * POST /complete - Process completion request after payment verification
 */
app.post('/complete', async (req: Request, res: Response) => {
  const request: CompletionRequest = req.body;
  
  try {
    console.log(`\n[${PROVIDER_ID}] Received completion request ${request.request_id}`);
    console.log(`Payment TX: ${request.tx_hash}`);
    
    // Verify payment
    const verification = await paymentVerifier.verifyPayment(
      request.tx_hash,
      request.expected_amount,
      PROVIDER_ADDRESS,
      request.payment_nonce
    );
    
    if (!verification.verified) {
      console.log(`[${PROVIDER_ID}] Payment verification failed: ${verification.reason}`);
      return res.status(402).json({
        error: 'Payment verification failed',
        reason: verification.reason
      });
    }
    
    console.log(`[${PROVIDER_ID}] Payment verified ✓`);
    
    // Generate completion (mock for demo, real API call if key provided)
    let completion: string;
    let tokensUsed: number;

    if (config.demoMode || !config.claude.apiKey) {
      console.log(`[${PROVIDER_ID}] Using mock LLM (demo mode)`);
      const mock = generateMockCompletion(request.prompt, MODEL_NAME, PROVIDER_ID);
      completion = mock.completion;
      tokensUsed = mock.tokens;
    } else {
      // Real Claude API call
      console.log(`[${PROVIDER_ID}] Making real Anthropic API call...`);
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.claude.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            max_tokens: 1024,
            messages: [
              {
                role: 'user',
                content: request.prompt
              }
            ]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as any;
        completion = data.content[0].text;
        tokensUsed = data.usage.input_tokens + data.usage.output_tokens;
        console.log(`[${PROVIDER_ID}] API call successful - ${tokensUsed} tokens used`);
      } catch (apiError) {
        console.error(`[${PROVIDER_ID}] API call failed:`, apiError);
        throw apiError;
      }
    }
    
    const response: CompletionResponse = {
      completion,
      tokens_used: tokensUsed,
      model: MODEL_NAME,
      provider_id: PROVIDER_ID
    };
    
    console.log(`[${PROVIDER_ID}] Completion delivered (${tokensUsed} tokens)\n`);
    res.json(response);
    
  } catch (error) {
    console.error(`[${PROVIDER_ID}] Error:`, error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    provider: PROVIDER_ID,
    model: MODEL_NAME,
    status: 'ok',
    demo_mode: config.demoMode
  });
});

// Start server
const PORT = config.claude.port;
app.listen(PORT, () => {
  console.log(`\n🔵 ${PROVIDER_ID.toUpperCase()} Provider running on http://localhost:${PORT}`);
  console.log(`Model: ${MODEL_NAME}`);
  console.log(`Address: ${PROVIDER_ADDRESS}`);
  console.log(`Demo mode: ${config.demoMode ? 'ENABLED' : 'DISABLED'}\n`);
});
