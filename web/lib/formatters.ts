import type { ProviderQuote } from '@/lib/api'

export type UiTaskType =
  | 'math'
  | 'qa'
  | 'summarize'
  | 'writing'
  | 'reasoning'
  | 'code'
  | 'other'

export type RiskLevel = 'low' | 'medium' | 'high'

const taskTypeMap: Record<string, UiTaskType> = {
  trivial_math: 'math',
  short_qa: 'qa',
  summarization: 'summarize',
  writing: 'writing',
  reasoning: 'reasoning',
  code: 'code',
  other: 'other',
}

const taskTypeLabels: Record<string, string> = {
  trivial_math: 'Math',
  short_qa: 'Q&A',
  summarization: 'Summarize',
  writing: 'Writing',
  reasoning: 'Reasoning',
  code: 'Code',
  other: 'Other',
}

const providerNames: Record<string, string> = {
  gemini: 'Gemini',
  claude: 'Claude',
  openai: 'OpenAI',
}

const EXPLORER_BASE_URL =
  process.env.NEXT_PUBLIC_EXPLORER_BASE_URL || 'https://testnet.arcscan.app'

export const formatUsdc = (value: number, digits = 4) => {
  if (!Number.isFinite(value)) {
    return '$0.0000'
  }
  return `$${value.toFixed(digits)}`
}

export const formatTimestamp = (value: string | number | Date) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'America/Los_Angeles',
    timeZoneName: 'short'
  })
}

export const normalizeTaskType = (taskType: string): UiTaskType =>
  taskTypeMap[taskType] || 'other'

export const taskTypeLabel = (taskType: string): string =>
  taskTypeLabels[taskType] || taskType

export const providerDisplayName = (providerId: string) => {
  if (!providerId) {
    return 'Unknown'
  }
  return providerNames[providerId] || providerId.charAt(0).toUpperCase() + providerId.slice(1)
}

export const riskFromQuality = (quality?: string, taskType?: UiTaskType): RiskLevel => {
  if (quality === 'cheap') return 'low'
  if (quality === 'balanced') return 'medium'
  if (quality === 'premium') return 'high'

  switch (taskType) {
    case 'reasoning':
    case 'code':
      return 'high'
    case 'writing':
    case 'summarize':
      return 'medium'
    case 'math':
    case 'qa':
      return 'low'
    default:
      return 'medium'
  }
}

export const buildLatencySeries = (samples: Array<{ time: string; latency: number }>) => {
  const buckets = new Map<string, number[]>()

  samples.forEach((sample) => {
    if (!buckets.has(sample.time)) {
      buckets.set(sample.time, [])
    }
    buckets.get(sample.time)?.push(sample.latency)
  })

  const percentile = (values: number[], p: number) => {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1))
    return sorted[index]
  }

  return Array.from(buckets.entries()).map(([time, latencies]) => ({
    time,
    p50: percentile(latencies, 0.5),
    p95: percentile(latencies, 0.95),
  }))
}

export const estimateCost = (quote: ProviderQuote, estimatedTokens: number) =>
  quote.base_fee + (estimatedTokens / 1000) * quote.price_per_1k_tokens

export const explorerTxUrl = (txHash: string) =>
  new URL(`/tx/${txHash}`, EXPLORER_BASE_URL).toString()
