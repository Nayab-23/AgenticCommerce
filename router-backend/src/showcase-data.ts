import crypto from 'crypto';
import type {
  PolicyConstraints,
  ProviderQuote,
  QualityTier,
  RouteRequest,
  RouteResponse,
  TaskType,
  UsageStats,
  VerificationResult,
} from '@agentic-commerce/shared';
import { config } from './config';
import type { StoredRequest } from './request-store';
import type { RequestRecord } from './stats';

type ProviderId = 'gemini' | 'openai' | 'claude';

interface Scenario {
  id: string;
  minutesAgo: number;
  prompt: string;
  taskType: TaskType;
  quality: QualityTier;
  estimatedTokens: number;
  policy: PolicyConstraints;
  selectedProvider: ProviderId;
  latencyMs: number;
  completion: string;
  verification: VerificationResult;
  escalated?: boolean;
  escalationProvider?: ProviderId;
}

const providerTemplates: Record<ProviderId, Omit<ProviderQuote, 'expires_at'>> = {
  gemini: {
    provider_id: 'gemini',
    model_name: 'gemini-1.5-flash',
    price_per_1k_tokens: 0.0005,
    base_fee: 0.0042,
    est_latency_ms: 740,
    quality_tier: 'cheap',
    arc_address: config.providers.gemini.address,
  },
  openai: {
    provider_id: 'openai',
    model_name: 'gpt-3.5-turbo',
    price_per_1k_tokens: 0.0008,
    base_fee: 0.0064,
    est_latency_ms: 910,
    quality_tier: 'balanced',
    arc_address: config.providers.openai.address,
  },
  claude: {
    provider_id: 'claude',
    model_name: 'claude-3-haiku-20240307',
    price_per_1k_tokens: 0.0011,
    base_fee: 0.0089,
    est_latency_ms: 1280,
    quality_tier: 'premium',
    arc_address: config.providers.claude.address,
  },
};

const scenarios: Scenario[] = [
  {
    id: '001',
    minutesAgo: 90,
    prompt: 'Explain why parallel tool execution reduces end-to-end latency in agent systems.',
    taskType: 'reasoning',
    quality: 'premium',
    policy: { max_cost_usdc: 0.02, max_latency_ms: 5000, quality_preference: 'premium', use_allowlist: true },
    estimatedTokens: 210,
    selectedProvider: 'claude',
    latencyMs: 1820,
    completion: 'Parallelizing independent tool calls removes avoidable wait time from the critical path. Instead of paying the sum of each fetch or verification step, the orchestration layer pays roughly the duration of the slowest branch plus merge overhead, which lowers wall-clock latency while preserving the same decision quality.',
    verification: { passed: true, score: 0.97, reason: 'Reasoning response addresses causality and tradeoffs clearly' },
  },
  {
    id: '002',
    minutesAgo: 135,
    prompt: 'Create a React component for a receipt card with explorer links and copy-to-clipboard actions.',
    taskType: 'code',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.018, max_latency_ms: 4000, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 165,
    selectedProvider: 'openai',
    latencyMs: 1240,
    completion: 'Implemented a compact receipt card component with hash truncation, clipboard copy, explorer deep-linking, and confirmed/pending state badges suitable for dashboards.',
    verification: { passed: true, score: 0.95, reason: 'Contains concrete implementation details for the requested UI component' },
  },
  {
    id: '003',
    minutesAgo: 180,
    prompt: 'Summarize this week’s routing metrics into five action items for the operations team.',
    taskType: 'summarization',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.015, max_latency_ms: 3500, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 132,
    selectedProvider: 'openai',
    latencyMs: 980,
    completion: 'Top actions: tighten latency alerts for Claude spikes, keep Gemini on low-risk math traffic, expand allowlist review cadence, monitor escalation volume on code tasks, and ship weekly receipt bundle exports for finance.',
    verification: { passed: true, score: 0.96, reason: 'Summary extracted concise, actionable next steps' },
  },
  {
    id: '004',
    minutesAgo: 235,
    prompt: 'What is 144 divided by 12?',
    taskType: 'trivial_math',
    quality: 'cheap',
    policy: { max_cost_usdc: 0.01, max_latency_ms: 2000, quality_preference: 'cheap', use_allowlist: true },
    estimatedTokens: 8,
    selectedProvider: 'gemini',
    latencyMs: 420,
    completion: 'The answer is 12.',
    verification: { passed: true, score: 1, reason: 'Contains correct numerical answer' },
  },
  {
    id: '005',
    minutesAgo: 290,
    prompt: 'Draft a launch email announcing policy-aware agent routing with payment receipts.',
    taskType: 'writing',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.02, max_latency_ms: 5000, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 186,
    selectedProvider: 'claude',
    latencyMs: 1490,
    completion: 'Drafted a launch email with headline, value proposition, rollout notes, and a CTA inviting ops leaders to review real-time billing and audit visibility.',
    verification: { passed: true, score: 0.94, reason: 'Writing output is structured and on-brief' },
  },
  {
    id: '006',
    minutesAgo: 360,
    prompt: 'What are the top three risks in allowing unrestricted provider selection?',
    taskType: 'short_qa',
    quality: 'cheap',
    policy: { max_cost_usdc: 0.012, max_latency_ms: 2500, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 92,
    selectedProvider: 'openai',
    latencyMs: 860,
    completion: 'The top risks are budget drift, inconsistent output quality, and compliance exposure when a request is sent to an unapproved vendor.',
    verification: { passed: true, score: 0.93, reason: 'Short answer covers cost, quality, and compliance concerns' },
  },
  {
    id: '007',
    minutesAgo: 430,
    prompt: 'Generate a TypeScript utility that retries provider calls with exponential backoff and typed error handling.',
    taskType: 'code',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.02, max_latency_ms: 4500, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 188,
    selectedProvider: 'openai',
    latencyMs: 2110,
    completion: 'Initial balanced-tier response was escalated to a premium provider and returned a typed retry utility with capped attempts, jitter, and explicit transient error guards.',
    verification: { passed: true, score: 0.9, reason: 'Escalated completion met code quality checks after a higher-quality retry' },
    escalated: true,
    escalationProvider: 'claude',
  },
  {
    id: '008',
    minutesAgo: 520,
    prompt: 'Compare the tradeoffs between direct provider calls and a brokered routing layer for enterprise procurement.',
    taskType: 'reasoning',
    quality: 'premium',
    policy: { max_cost_usdc: 0.02, max_latency_ms: 6000, quality_preference: 'premium', use_allowlist: true },
    estimatedTokens: 224,
    selectedProvider: 'claude',
    latencyMs: 1930,
    completion: 'A brokered routing layer centralizes policy enforcement, receipts, and pricing controls, but introduces platform dependency and additional operational complexity relative to direct provider calls.',
    verification: { passed: true, score: 0.98, reason: 'Reasoning output evaluates both sides with enterprise context' },
  },
  {
    id: '009',
    minutesAgo: 615,
    prompt: 'Summarize why this request should be escalated after failing verification.',
    taskType: 'summarization',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.018, max_latency_ms: 3500, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 118,
    selectedProvider: 'gemini',
    latencyMs: 1675,
    completion: 'The initial low-cost answer missed required detail and failed acceptance checks, so the router promoted the request to a higher-quality provider while staying within spend policy.',
    verification: { passed: true, score: 0.91, reason: 'Escalation summary explains trigger, action, and policy compliance' },
    escalated: true,
    escalationProvider: 'claude',
  },
  {
    id: '010',
    minutesAgo: 710,
    prompt: 'Write a product brief for an AI billing dashboard aimed at fintech operations teams.',
    taskType: 'writing',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.02, max_latency_ms: 4500, quality_preference: 'premium', use_allowlist: true },
    estimatedTokens: 172,
    selectedProvider: 'claude',
    latencyMs: 1515,
    completion: 'Produced a concise product brief covering user goals, trust requirements, compliance visibility, and the importance of receipt-backed spend governance.',
    verification: { passed: true, score: 0.95, reason: 'Product brief is structured and target-audience aware' },
  },
  {
    id: '011',
    minutesAgo: 820,
    prompt: 'Calculate the percentage decrease from 950ms to 620ms.',
    taskType: 'trivial_math',
    quality: 'cheap',
    policy: { max_cost_usdc: 0.01, max_latency_ms: 2000, quality_preference: 'cheap', use_allowlist: true },
    estimatedTokens: 24,
    selectedProvider: 'gemini',
    latencyMs: 430,
    completion: 'The latency dropped by approximately 34.74%.',
    verification: { passed: true, score: 1, reason: 'Math response contains a valid percentage decrease' },
  },
  {
    id: '012',
    minutesAgo: 940,
    prompt: 'Explain how replay protection works when providers verify payment nonces.',
    taskType: 'reasoning',
    quality: 'premium',
    policy: { max_cost_usdc: 0.02, max_latency_ms: 5500, quality_preference: 'premium', use_allowlist: true },
    estimatedTokens: 190,
    selectedProvider: 'claude',
    latencyMs: 1785,
    completion: 'Replay protection works by binding each payment to a unique nonce. Once a provider records that nonce as consumed, any later request reusing the same transaction metadata is rejected even if the underlying transfer hash exists.',
    verification: { passed: true, score: 0.97, reason: 'Response explains nonce uniqueness and replay rejection clearly' },
  },
  {
    id: '013',
    minutesAgo: 1120,
    prompt: 'Create onboarding copy for a sandbox mode that ships with curated showcase traffic.',
    taskType: 'writing',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.016, max_latency_ms: 4000, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 148,
    selectedProvider: 'openai',
    latencyMs: 905,
    completion: 'Welcome to sandbox mode. Your workspace starts with representative traffic, prebuilt receipts, and policy events so you can review routing behavior before connecting live credentials.',
    verification: { passed: true, score: 0.94, reason: 'Onboarding copy is concise and clearly explains the sandbox setup' },
  },
  {
    id: '014',
    minutesAgo: 1285,
    prompt: 'Write a SQL query to aggregate daily spend by provider and quality tier.',
    taskType: 'code',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.018, max_latency_ms: 4200, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 140,
    selectedProvider: 'openai',
    latencyMs: 1095,
    completion: 'Returned a grouped SQL query with SUM(amount_usdc), COUNT(request_id), and DATE_TRUNC(day, created_at), broken out by provider_id and quality_tier.',
    verification: { passed: true, score: 0.92, reason: 'Code response includes the requested aggregation structure' },
  },
  {
    id: '015',
    minutesAgo: 1500,
    prompt: 'Summarize an incident where a completion failed verification because it was too short.',
    taskType: 'summarization',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.014, max_latency_ms: 3000, quality_preference: 'balanced', use_allowlist: true },
    estimatedTokens: 108,
    selectedProvider: 'gemini',
    latencyMs: 780,
    completion: 'Too short.',
    verification: { passed: false, score: 0.42, reason: 'Completion did not provide enough detail to satisfy verification criteria' },
  },
  {
    id: '016',
    minutesAgo: 1710,
    prompt: 'Draft a procurement memo balancing latency, quality, and cost for premium reasoning workloads.',
    taskType: 'writing',
    quality: 'balanced',
    policy: { max_cost_usdc: 0.02, max_latency_ms: 5000, quality_preference: 'premium', use_allowlist: true },
    estimatedTokens: 176,
    selectedProvider: 'claude',
    latencyMs: 1460,
    completion: 'Prepared a procurement memo recommending premium routing for high-stakes reasoning, balanced routing for code assistance, and cheap routing for deterministic low-risk tasks.',
    verification: { passed: true, score: 0.95, reason: 'Memo captures the requested tradeoffs and routing recommendations' },
  },
];

const estimateCost = (quote: ProviderQuote, estimatedTokens: number) =>
  quote.base_fee + (estimatedTokens / 1000) * quote.price_per_1k_tokens;

const buildHash = (seed: string) => `0x${crypto.createHash('sha256').update(seed).digest('hex')}`;

const buildNonce = (seed: string) =>
  [
    seed.slice(0, 8),
    seed.slice(8, 12),
    seed.slice(12, 16),
    seed.slice(16, 20),
    seed.slice(20, 32),
  ].join('-');

const buildQuoteSet = (createdAt: Date): ProviderQuote[] =>
  (Object.values(providerTemplates) as Array<Omit<ProviderQuote, 'expires_at'>>).map((template) => ({
    ...template,
    expires_at: createdAt.getTime() + 45 * 60 * 1000,
  }));

const buildRationale = (
  providerId: ProviderId,
  taskType: TaskType,
  quality: QualityTier,
  estimatedCost: number,
  escalated: boolean,
) => {
  const providerLabels: Record<ProviderId, string> = {
    gemini: 'Gemini',
    openai: 'OpenAI',
    claude: 'Claude',
  };

  const taskLabels: Record<TaskType, string> = {
    trivial_math: 'Deterministic math task',
    short_qa: 'Short answer request',
    summarization: 'Summarization task',
    writing: 'Writing task',
    reasoning: 'Reasoning-heavy task',
    code: 'Code generation task',
    other: 'General request',
  };

  const escalationText = escalated ? ' after a controlled escalation path' : '';
  return `${taskLabels[taskType]} matched the ${quality} quality target. Selected ${providerLabels[providerId]} at $${estimatedCost.toFixed(4)}${escalationText}.`;
};

export const buildShowcaseStoredRequests = (now = new Date()): StoredRequest[] =>
  scenarios
    .map((scenario) => {
      const createdAt = new Date(now.getTime() - scenario.minutesAgo * 60 * 1000);
      const quotes = buildQuoteSet(createdAt);
      const selectedQuote = quotes.find((quote) => quote.provider_id === scenario.selectedProvider);

      if (!selectedQuote) {
        throw new Error(`Missing selected quote for showcase provider ${scenario.selectedProvider}`);
      }

      const selectedCost = estimateCost(selectedQuote, scenario.estimatedTokens);
      const escalationQuote = scenario.escalationProvider
        ? quotes.find((quote) => quote.provider_id === scenario.escalationProvider)
        : undefined;
      const escalationCost = escalationQuote
        ? estimateCost(escalationQuote, Math.max(scenario.estimatedTokens + 18, scenario.estimatedTokens))
        : 0;
      const totalCost = selectedCost + escalationCost;
      const txSeed = buildHash(`showcase-${scenario.id}`);
      const requestId = `showcase-${scenario.id}-${buildHash(scenario.prompt).slice(2, 10)}`;

      const request: RouteRequest = {
        request_id: requestId,
        prompt: scenario.prompt,
        policy: scenario.policy,
      };

      const response: RouteResponse = {
        request_id: requestId,
        classification: {
          task_type: scenario.taskType,
          estimated_tokens: scenario.estimatedTokens,
          requires_quality: scenario.quality,
        },
        quotes_received: quotes,
        selected_provider: {
          provider_id: scenario.selectedProvider,
          quote: selectedQuote,
          estimated_cost: selectedCost,
          rationale: buildRationale(
            scenario.selectedProvider,
            scenario.taskType,
            scenario.quality,
            selectedCost,
            Boolean(scenario.escalated),
          ),
        },
        payment: {
          amount_usdc: selectedCost,
          recipient_address: selectedQuote.arc_address,
          tx_hash: txSeed,
          block_number: 940000 + Number.parseInt(scenario.id, 10),
          payment_nonce: buildNonce(buildHash(`nonce-${scenario.id}`).slice(2, 34)),
        },
        completion: scenario.completion,
        verification: scenario.verification,
        escalated: scenario.escalated,
        escalation_provider: escalationQuote
          ? {
              provider_id: scenario.escalationProvider as ProviderId,
              quote: escalationQuote,
              estimated_cost: escalationCost,
              rationale: `Escalated to ${scenario.escalationProvider} for a higher-confidence follow-up while staying within sandbox policy.`,
            }
          : undefined,
        escalation_payment: escalationQuote
          ? {
              amount_usdc: escalationCost,
              recipient_address: escalationQuote.arc_address,
              tx_hash: buildHash(`showcase-escalation-${scenario.id}`),
              block_number: 941000 + Number.parseInt(scenario.id, 10),
              payment_nonce: buildNonce(buildHash(`escalation-nonce-${scenario.id}`).slice(2, 34)),
            }
          : undefined,
        total_cost_usdc: totalCost,
        latency_ms: scenario.latencyMs,
      };

      return {
        id: requestId,
        created_at: createdAt.toISOString(),
        request,
        response,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

export const buildShowcaseRequestRecords = (requests: StoredRequest[]): RequestRecord[] =>
  requests
    .map((entry) => ({
      id: entry.id,
      timestamp: new Date(entry.created_at),
      prompt: entry.request.prompt.substring(0, 100),
      taskType: entry.response.classification.task_type,
      provider: entry.response.selected_provider.provider_id,
      costUsdc: entry.response.total_cost_usdc,
      latencyMs: entry.response.latency_ms,
      txHash: entry.response.payment.tx_hash,
      verified: entry.response.verification.passed,
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

export const buildShowcaseUsageStats = (requests: StoredRequest[], now = new Date()): UsageStats => {
  const today = now.toISOString().split('T')[0];
  const stats: UsageStats = {
    total_requests: requests.length,
    total_spend_usdc: 0,
    spend_by_provider: {},
    average_cost_usdc: 0,
    escalation_count: 0,
    requests_today: 0,
    spend_today: 0,
    last_reset_date: today,
  };

  requests.forEach((entry) => {
    const amount = entry.response.total_cost_usdc;
    const providerId = entry.response.selected_provider.provider_id;
    stats.total_spend_usdc += amount;
    stats.spend_by_provider[providerId] = (stats.spend_by_provider[providerId] || 0) + amount;
    if (entry.response.escalated) {
      stats.escalation_count += 1;
    }
    if (entry.created_at.startsWith(today)) {
      stats.requests_today += 1;
      stats.spend_today += amount;
    }
  });

  stats.average_cost_usdc =
    stats.total_requests > 0 ? stats.total_spend_usdc / stats.total_requests : 0;

  for (const providerId of Object.keys(stats.spend_by_provider)) {
    stats.spend_by_provider[providerId] =
      Math.round(stats.spend_by_provider[providerId] * 1_000_000) / 1_000_000;
  }

  stats.total_spend_usdc = Math.round(stats.total_spend_usdc * 1_000_000) / 1_000_000;
  stats.average_cost_usdc = Math.round(stats.average_cost_usdc * 1_000_000) / 1_000_000;
  stats.spend_today = Math.round(stats.spend_today * 1_000_000) / 1_000_000;

  return stats;
};
