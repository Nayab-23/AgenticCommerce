import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  RouteRequest,
  RouteResponse,
  CompletionRequest,
  PolicyConstraints
} from '@agentic-router/shared';
import { config } from './config';
import { classifyPrompt } from './classifier';
import { PaymentService } from './payment';
import { ProviderClient } from './provider-client';
import { ProviderSelector } from './selector';
import { VerificationService } from './verifier';
import { SpendTracker } from './spend-tracker';
import { statsTracker } from './stats';
import { requestStore } from './request-store';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize services
const paymentService = new PaymentService();
const providerClient = new ProviderClient();
const providerSelector = new ProviderSelector();
const verificationService = new VerificationService();
const spendTracker = new SpendTracker();
const providerRegistry = [
  {
    id: 'gemini',
    name: 'Gemini',
    address: config.providers.gemini.address,
    url: config.providers.gemini.url
  },
  {
    id: 'claude',
    name: 'Claude',
    address: config.providers.claude.address,
    url: config.providers.claude.url
  }
];

const providerAllowlist = new Set(config.providerAllowlist);

const getAllowlistStatus = (address: string) => {
  if (providerAllowlist.size === 0) {
    return true;
  }
  return providerAllowlist.has(address);
};

const applyAllowlistChange = (address: string, allowlisted: boolean) => {
  if (providerAllowlist.size === 0) {
    providerRegistry.forEach(provider => providerAllowlist.add(provider.address));
  }
  if (allowlisted) {
    providerAllowlist.add(address);
  } else {
    providerAllowlist.delete(address);
  }
  config.providerAllowlist = Array.from(providerAllowlist);
};

/**
 * Main routing endpoint
 */
app.post('/api/route', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const routeRequest: RouteRequest = req.body;
  const requestId = routeRequest.request_id || uuidv4();
  
  try {
    console.log(`\n=== Processing request ${requestId} ===`);
    console.log('Prompt:', routeRequest.prompt);
    
    // Step 1: Classify prompt
    const classification = classifyPrompt(routeRequest.prompt);
    console.log('Classification:', classification);
    
    // Step 2: Fetch provider quotes
    const quotes = await providerClient.fetchQuotes();
    console.log(`Received ${quotes.length} quotes`);
    
    if (quotes.length === 0) {
      return res.status(503).json({
        error: 'No providers available'
      });
    }
    
    // Step 3: Select provider
    const selection = providerSelector.selectProvider(
      quotes,
      classification,
      routeRequest.policy
    );
    
    if (!selection) {
      return res.status(400).json({
        error: 'No provider meets the specified constraints'
      });
    }
    
    console.log('Selected provider:', selection.provider_id);
    console.log('Rationale:', selection.rationale);
    
    // Step 4: Check spending limits
    const spendCheck = spendTracker.canSpend(selection.estimated_cost);
    if (!spendCheck.allowed) {
      return res.status(429).json({
        error: spendCheck.reason
      });
    }
    
    // Step 5: Pay provider
    const payment = await paymentService.payProvider(
      selection.quote.arc_address,
      selection.estimated_cost
    );
    console.log('Payment sent:', payment.tx_hash);
    
    // Step 6: Request completion
    const providerUrl = selection.provider_id === 'gemini'
      ? config.providers.gemini.url
      : selection.provider_id === 'openai'
      ? config.providers.openai.url
      : config.providers.claude.url;
    
    const completionRequest: CompletionRequest = {
      prompt: routeRequest.prompt,
      payment_nonce: payment.payment_nonce,
      tx_hash: payment.tx_hash,
      expected_amount: selection.estimated_cost,
      request_id: requestId
    };
    
    const completion = await providerClient.requestCompletion(
      providerUrl,
      completionRequest
    );
    console.log('Completion received from', completion.provider_id);
    
    // Step 7: Verify completion
    const verification = verificationService.verify(
      routeRequest.prompt,
      completion.completion,
      classification.task_type
    );
    console.log('Verification:', verification);
    
    // Step 8: Handle escalation if needed
    let escalated = false;
    let escalationProvider;
    let escalationPayment;
    let totalCost = selection.estimated_cost;
    let finalCompletion = completion.completion;
    
    if (!verification.passed && quotes.length > 1) {
      console.log('Verification failed, attempting escalation...');
      
      // Try to select a premium provider
      const escalationPolicy: PolicyConstraints = {
        ...routeRequest.policy,
        quality_preference: 'premium',
        allowed_providers: quotes
          .filter(q => q.provider_id !== selection.provider_id)
          .map(q => q.provider_id)
      };
      
      const escalationSelection = providerSelector.selectProvider(
        quotes,
        classification,
        escalationPolicy
      );
      
      if (escalationSelection) {
        const escalationSpendCheck = spendTracker.canSpend(
          totalCost + escalationSelection.estimated_cost
        );
        
        if (escalationSpendCheck.allowed) {
          console.log('Escalating to', escalationSelection.provider_id);
          
          escalationPayment = await paymentService.payProvider(
            escalationSelection.quote.arc_address,
            escalationSelection.estimated_cost
          );
          
          const escalationUrl = escalationSelection.provider_id === 'gemini'
            ? config.providers.gemini.url
            : escalationSelection.provider_id === 'openai'
            ? config.providers.openai.url
            : config.providers.claude.url;
          
          const escalationRequest: CompletionRequest = {
            prompt: routeRequest.prompt,
            payment_nonce: escalationPayment.payment_nonce,
            tx_hash: escalationPayment.tx_hash,
            expected_amount: escalationSelection.estimated_cost,
            request_id: requestId + '-escalation'
          };
          
          const escalationCompletion = await providerClient.requestCompletion(
            escalationUrl,
            escalationRequest
          );
          
          escalated = true;
          escalationProvider = escalationSelection;
          totalCost += escalationSelection.estimated_cost;
          finalCompletion = escalationCompletion.completion;
          
          console.log('Escalation successful');
        }
      }
    }
    
    // Step 9: Record spending
    spendTracker.recordSpending(selection.provider_id, totalCost, escalated);
    
    // Step 10: Log audit entry
    spendTracker.logAudit({
      timestamp: new Date().toISOString(),
      request_id: requestId,
      prompt_preview: routeRequest.prompt.substring(0, 100),
      classification: classification.task_type,
      selected_provider: selection.provider_id,
      payment_tx: payment.tx_hash,
      cost_usdc: totalCost,
      escalated,
      verification_passed: verification.passed
    });

    // Step 11: Record stats for dashboard
    statsTracker.addRequest({
      id: requestId,
      timestamp: new Date(),
      prompt: routeRequest.prompt.substring(0, 100),
      taskType: classification.task_type,
      provider: selection.provider_id,
      costUsdc: totalCost,
      latencyMs: Date.now() - startTime,
      txHash: payment.tx_hash,
      verified: verification.passed
    });

    // Build response
    const response: RouteResponse = {
      request_id: requestId,
      classification,
      quotes_received: quotes,
      selected_provider: selection,
      payment,
      completion: finalCompletion,
      verification,
      escalated,
      escalation_provider: escalationProvider,
      escalation_payment: escalationPayment,
      total_cost_usdc: totalCost,
      latency_ms: Date.now() - startTime
    };

    // Step 12: Store request details for UI
    requestStore.add(routeRequest, response);
    
    console.log(`Request completed in ${response.latency_ms}ms`);
    console.log('===================================\n');
    
    res.json(response);
    
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      request_id: requestId
    });
  }
});

/**
 * Get recent requests for UI
 */
app.get('/api/requests', (req: Request, res: Response) => {
  const limit = Number.parseInt(req.query.limit as string, 10);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 50;
  res.json({ requests: requestStore.list(safeLimit) });
});

/**
 * Get request details by ID
 */
app.get('/api/requests/:id', (req: Request, res: Response) => {
  const record = requestStore.get(req.params.id);
  if (!record) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json(record);
});

/**
 * Get audit events for UI
 */
app.get('/api/audit', (req: Request, res: Response) => {
  const limit = Number.parseInt(req.query.limit as string, 10);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 300) : 200;
  res.json({ events: requestStore.getAuditEvents(safeLimit) });
});

/**
 * Get provider metadata and allowlist state
 */
app.get('/api/providers', (req: Request, res: Response) => {
  res.json({
    providers: providerRegistry.map(provider => ({
      id: provider.id,
      name: provider.name,
      address: provider.address,
      url: provider.url,
      allowlisted: getAllowlistStatus(provider.address)
    }))
  });
});

/**
 * Update provider allowlist status
 */
app.patch('/api/providers/:id/allowlist', (req: Request, res: Response) => {
  const provider = providerRegistry.find(p => p.id === req.params.id);
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' });
  }

  const { allowlisted } = req.body as { allowlisted?: boolean };
  if (typeof allowlisted !== 'boolean') {
    return res.status(400).json({ error: 'allowlisted must be a boolean' });
  }

  applyAllowlistChange(provider.address, allowlisted);
  res.json({ id: provider.id, allowlisted });
});

/**
 * Get system policy settings
 */
app.get('/api/policy', (req: Request, res: Response) => {
  res.json({
    emergency_stop: config.emergencyStop,
    per_request_cap_usdc: config.perRequestCapUsdc,
    daily_cap_usdc: config.dailySpendCapUsdc,
    provider_allowlist: config.providerAllowlist
  });
});

/**
 * Update system policy settings
 */
app.post('/api/policy', (req: Request, res: Response) => {
  const { emergency_stop, per_request_cap_usdc, daily_cap_usdc } = req.body as {
    emergency_stop?: boolean;
    per_request_cap_usdc?: number;
    daily_cap_usdc?: number;
  };

  if (typeof emergency_stop === 'boolean') {
    config.emergencyStop = emergency_stop;
  }

  if (typeof per_request_cap_usdc === 'number') {
    if (per_request_cap_usdc <= 0) {
      return res.status(400).json({ error: 'per_request_cap_usdc must be greater than 0' });
    }
    config.perRequestCapUsdc = per_request_cap_usdc;
  }

  if (typeof daily_cap_usdc === 'number') {
    if (daily_cap_usdc <= 0) {
      return res.status(400).json({ error: 'daily_cap_usdc must be greater than 0' });
    }
    config.dailySpendCapUsdc = daily_cap_usdc;
  }

  res.json({
    emergency_stop: config.emergencyStop,
    per_request_cap_usdc: config.perRequestCapUsdc,
    daily_cap_usdc: config.dailySpendCapUsdc,
    provider_allowlist: config.providerAllowlist
  });
});

/**
 * Get usage statistics (legacy)
 */
app.get('/api/stats', (req: Request, res: Response) => {
  const stats = spendTracker.getStats();
  res.json(stats);
});

/**
 * Get dashboard stats (for charts)
 */
app.get('/api/dashboard/stats', (req: Request, res: Response) => {
  res.json({
    totals: statsTracker.getTotalStats(),
    costOverTime: statsTracker.getCostOverTime(),
    latencyOverTime: statsTracker.getLatencyOverTime(),
    providerBreakdown: statsTracker.getProviderBreakdown(),
    taskTypeBreakdown: statsTracker.getTaskTypeBreakdown(),
    recentRequests: statsTracker.getRecentRequests(10)
  });
});

/**
 * Get treasury info
 */
app.get('/api/treasury', async (req: Request, res: Response) => {
  try {
    const balance = await paymentService.getTreasuryBalance();
    res.json({
      address: paymentService.getTreasuryAddress(),
      balance_usdc: balance,
      daily_cap: config.dailySpendCapUsdc,
      per_request_cap: config.perRequestCapUsdc
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch treasury info'
    });
  }
});

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    demo_mode: config.demoMode,
    emergency_stop: config.emergencyStop
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`\n🚀 Router Backend running on http://localhost:${PORT}`);
  console.log(`Demo mode: ${config.demoMode ? 'ENABLED' : 'DISABLED'}`);
  console.log(`Emergency stop: ${config.emergencyStop ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`Treasury address: ${paymentService.getTreasuryAddress()}\n`);
});
