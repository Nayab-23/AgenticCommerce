'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Timeline } from '@/components/dashboard/timeline'
import { ReceiptCard } from '@/components/dashboard/receipt-card'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Download, FileJson, RotateCcw } from 'lucide-react'
import { fetchRequest, type RequestDetail } from '@/lib/api'
import {
  estimateCost,
  formatTimestamp,
  formatUsdc,
  providerDisplayName,
  riskFromQuality,
  taskTypeLabel,
} from '@/lib/formatters'

function RequestDetailsContent() {
  const searchParams = useSearchParams()
  const requestId = searchParams.get('requestId') || ''
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadRequest = async () => {
      if (!requestId) {
        setLoading(false)
        return
      }

      try {
        const data = await fetchRequest(requestId)
        if (isActive) {
          setRequest(data)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load request details')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadRequest()

    return () => {
      isActive = false
    }
  }, [requestId])

  const timelineSteps = useMemo(() => {
    if (!request) return []

    const baseTime = new Date(request.created_at).getTime()
    const timestamp = (offsetMs: number) =>
      new Date(baseTime + offsetMs).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

    const response = request.response
    const steps = [
      {
        id: 'classification',
        title: 'Classification',
        timestamp: timestamp(0),
        status: 'completed' as const,
        description: 'Task type and quality requirements inferred',
        details: {
          taskType: response.classification.task_type,
          estimatedTokens: response.classification.estimated_tokens,
          requiresQuality: response.classification.requires_quality,
        },
      },
      {
        id: 'quotes',
        title: 'Quotes Compared',
        timestamp: timestamp(40),
        status: 'completed' as const,
        description: `Received ${response.quotes_received.length} provider quotes`,
        details: Object.fromEntries(
          response.quotes_received.map((quote) => [
            quote.provider_id,
            `${formatUsdc(estimateCost(quote, response.classification.estimated_tokens))} (${quote.quality_tier})`,
          ]),
        ),
      },
      {
        id: 'selection',
        title: 'Selection Rationale',
        timestamp: timestamp(80),
        status: 'completed' as const,
        description: 'Provider selected based on policy constraints',
        details: {
          selectedProvider: providerDisplayName(response.selected_provider.provider_id),
          estimatedCost: formatUsdc(response.selected_provider.estimated_cost),
          rationale: response.selected_provider.rationale,
        },
      },
      {
        id: 'payment',
        title: 'Payment Sent',
        timestamp: timestamp(120),
        status: 'completed' as const,
        description: 'USDC payment transferred to provider',
        details: {
          amount: `${response.payment.amount_usdc} USDC`,
          recipient: response.payment.recipient_address,
          txHash: response.payment.tx_hash,
          nonce: response.payment.payment_nonce,
        },
      },
      {
        id: 'completion',
        title: 'Completion Returned',
        timestamp: timestamp(160),
        status: 'completed' as const,
        description: 'Provider returned response',
        details: {
          completionLength: `${response.completion.length} chars`,
          latencyMs: response.latency_ms,
        },
      },
      {
        id: 'output-verification',
        title: 'Output Verification',
        timestamp: timestamp(200),
        status: response.verification.passed ? 'completed' : 'failed',
        description: response.verification.passed
          ? 'Output verified'
          : 'Output failed verification',
        details: {
          passed: response.verification.passed,
          score: response.verification.score,
          reason: response.verification.reason,
        },
      },
    ]

    if (response.escalated && response.escalation_provider) {
      steps.push({
        id: 'escalation',
        title: 'Escalation',
        timestamp: timestamp(240),
        status: 'completed',
        description: 'Escalated to premium provider',
        details: {
          escalationProvider: providerDisplayName(response.escalation_provider.provider_id),
          escalationCost: formatUsdc(response.escalation_provider.estimated_cost),
          escalationTxHash: response.escalation_payment?.tx_hash,
        },
      })
    }

    return steps
  }, [request])

  const quoteRows = useMemo(() => {
    if (!request) return []
    const { response } = request
    return response.quotes_received.map((quote) => ({
      provider: providerDisplayName(quote.provider_id),
      cost: formatUsdc(estimateCost(quote, response.classification.estimated_tokens)),
      latency: `${quote.est_latency_ms}ms`,
      quality: quote.quality_tier,
      status: quote.provider_id === response.selected_provider.provider_id ? 'selected' : 'eligible',
    }))
  }, [request])

  if (!requestId && !loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <EmptyState title="Select a request" description="Pick a request from the requests list to see details." />
        </div>
      </DashboardLayout>
    )
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Loading request details...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !request) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <EmptyState title="Request not found" description={error || 'No data available.'} />
        </div>
      </DashboardLayout>
    )
  }

  const response = request.response
  const statusBadge = response.escalated
    ? 'escalated'
    : response.verification.passed
      ? 'success'
      : 'failed'
  const statusLabel = response.escalated
    ? 'Escalated'
    : response.verification.passed
      ? 'Completed'
      : 'Failed'

  const policy = request.request.policy || {}

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold">Request Details</h1>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {response.request_id}
              </p>
            </div>
            <StatusBadge status={statusBadge} label={statusLabel} />
          </div>
          <p className="text-muted-foreground">Created: {formatTimestamp(request.created_at)}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <FileJson className="h-4 w-4" />
            View Receipt
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Replay (Dry-run)
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Prompt & Preferences</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Prompt
                  </label>
                  <div className="bg-muted p-3 rounded text-xs text-foreground max-h-40 overflow-y-auto font-mono">
                    {request.request.prompt}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    User Constraints
                  </label>
                  <ul className="text-xs space-y-1 text-foreground">
                    <li>• Max Cost: {policy.max_cost_usdc ? formatUsdc(policy.max_cost_usdc) : 'Default'}</li>
                    <li>• Max Latency: {policy.max_latency_ms ? `${policy.max_latency_ms}ms` : 'Default'}</li>
                    <li>• Quality: {policy.quality_preference || response.classification.requires_quality}</li>
                    <li>• Allowlist: {policy.use_allowlist === false ? 'Off' : 'On'}</li>
                  </ul>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    Tokens
                  </label>
                  <div className="text-xs">
                    <p>Estimated: {response.classification.estimated_tokens}</p>
                    <p>Risk Level: {riskFromQuality(response.classification.requires_quality)}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Decision Timeline</h3>
              <Timeline steps={timelineSteps} />
            </Card>
          </div>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Provider Quotes Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Provider</th>
                  <th className="text-left py-3 px-4 font-medium">Cost</th>
                  <th className="text-left py-3 px-4 font-medium">Latency</th>
                  <th className="text-left py-3 px-4 font-medium">Quality</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {quoteRows.map((quote) => (
                  <tr key={quote.provider} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{quote.provider}</td>
                    <td className="py-3 px-4">{quote.cost}</td>
                    <td className="py-3 px-4">{quote.latency}</td>
                    <td className="py-3 px-4">{quote.quality}</td>
                    <td className="py-3 px-4">
                      <div className="text-xs">
                        {quote.status === 'selected' ? (
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓ Selected
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Eligible</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quality Verification</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Task Type</p>
                <p className="font-medium">{taskTypeLabel(response.classification.task_type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Result</p>
                <p
                  className={`font-medium ${
                    response.verification.passed
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {response.verification.passed ? 'PASS' : 'FAIL'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Score</p>
                <p className="text-xl font-bold">{response.verification.score ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-sm text-foreground">{response.verification.reason}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Budget Impact</p>
                <p className="font-medium">
                  Total cost {formatUsdc(response.total_cost_usdc)} USDC
                </p>
              </div>
            </div>
          </Card>

          <ReceiptCard
            chain="Arc"
            amount={response.payment.amount_usdc.toFixed(4)}
            recipient={response.payment.recipient_address}
            txHash={response.payment.tx_hash}
            status={response.payment.block_number ? 'confirmed' : 'pending'}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function RequestDetailsPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">Loading request details...</p>
          </div>
        </DashboardLayout>
      }
    >
      <RequestDetailsContent />
    </Suspense>
  )
}
