'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { EmptyState } from '@/components/dashboard/empty-state'
import { SkeletonLoader } from '@/components/dashboard/skeleton-loader'
import { ReceiptCard } from '@/components/dashboard/receipt-card'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  createRouteRequest,
  fetchDashboardStats,
  fetchProviderHealth,
  fetchProviders,
  fetchRequests,
  fetchTreasuryInfo,
  fetchUsageStats,
  type DashboardStatsResponse,
  type ProviderHealth,
  type QualityTier,
  type RequestSummary,
  type RouteResponse,
  type TreasuryInfo,
  type UsageStats,
} from '@/lib/api'
import {
  buildLatencySeries,
  formatTimestamp,
  formatUsdc,
  normalizeTaskType,
  providerDisplayName,
  riskFromQuality,
  taskTypeLabel,
} from '@/lib/formatters'

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function OverviewPage() {
  const router = useRouter()
  const [dashboardStats, setDashboardStats] = useState<DashboardStatsResponse | null>(null)
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [treasury, setTreasury] = useState<TreasuryInfo | null>(null)
  const [requests, setRequests] = useState<RequestSummary[]>([])
  const [providerHealth, setProviderHealth] = useState<Record<string, ProviderHealth | null>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [prompt, setPrompt] = useState('')
  const [maxCost, setMaxCost] = useState('0.02')
  const [maxLatency, setMaxLatency] = useState('5000')
  const [qualityPreference, setQualityPreference] = useState<QualityTier>('balanced')
  const [useAllowlist, setUseAllowlist] = useState(true)
  const [routeResponse, setRouteResponse] = useState<RouteResponse | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isRouting, setIsRouting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [dashboardResult, usageResult, treasuryResult, requestsResult, providersResult] =
      await Promise.allSettled([
        fetchDashboardStats(),
        fetchUsageStats(),
        fetchTreasuryInfo(),
        fetchRequests(50),
        fetchProviders(),
      ])

    if (dashboardResult.status === 'fulfilled') {
      setDashboardStats(dashboardResult.value)
    } else {
      setError('Failed to load dashboard stats')
    }

    if (usageResult.status === 'fulfilled') {
      setUsageStats(usageResult.value)
    }

    if (treasuryResult.status === 'fulfilled') {
      setTreasury(treasuryResult.value)
      setMaxCost((current) =>
        current ? current : treasuryResult.value.per_request_cap.toString(),
      )
    }

    if (requestsResult.status === 'fulfilled') {
      setRequests(requestsResult.value.requests)
    }

    if (providersResult.status === 'fulfilled') {
      const healthEntries = await Promise.all(
        providersResult.value.providers.map(async (provider) => {
          try {
            const health = await fetchProviderHealth(provider.url)
            return [provider.id, health] as const
          } catch {
            return [provider.id, null] as const
          }
        }),
      )
      setProviderHealth(Object.fromEntries(healthEntries))
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRoute = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prompt.trim()) {
      setRouteError('Prompt is required')
      return
    }

    setIsRouting(true)
    setRouteError(null)

    try {
      const maxCostValue = Number(maxCost)
      const maxLatencyValue = Number(maxLatency)
      const policy = {
        max_cost_usdc: Number.isFinite(maxCostValue) ? maxCostValue : undefined,
        max_latency_ms: Number.isFinite(maxLatencyValue) ? maxLatencyValue : undefined,
        quality_preference: qualityPreference,
        use_allowlist: useAllowlist,
      }
      const response = await createRouteRequest({ prompt, policy })
      setRouteResponse(response)
      await loadData()
    } catch (err) {
      setRouteError(err instanceof Error ? err.message : 'Failed to route prompt')
    } finally {
      setIsRouting(false)
    }
  }

  const latencySeries = useMemo(
    () => (dashboardStats ? buildLatencySeries(dashboardStats.latencyOverTime) : []),
    [dashboardStats],
  )

  const p95Latency = useMemo(() => {
    if (!dashboardStats?.latencyOverTime.length) {
      return 0
    }
    const sorted = [...dashboardStats.latencyOverTime]
      .map((item) => item.latency)
      .sort((a, b) => a - b)
    const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * 0.95) - 1))
    return sorted[index]
  }, [dashboardStats])

  const activeProviderCount = useMemo(
    () => Object.values(providerHealth).filter((health) => health?.status === 'ok').length,
    [providerHealth],
  )

  const recentRequestRows = useMemo(
    () =>
      requests.slice(0, 10).map((request) => ({
        id: request.id,
        timestamp: formatTimestamp(request.created_at),
        taskType: normalizeTaskType(request.task_type),
        riskLevel: riskFromQuality(request.requires_quality),
        provider: providerDisplayName(request.provider_id),
        quoteCost: formatUsdc(request.estimated_cost),
        paidCost: formatUsdc(request.total_cost_usdc),
        latency: Math.round(request.latency_ms),
        verification: request.verification_passed,
        escalated: request.escalated,
        txHash: request.tx_hash,
      })),
    [requests],
  )

  const providerSpendData = useMemo(
    () =>
      (dashboardStats?.providerBreakdown || []).map((entry) => ({
        ...entry,
        provider: providerDisplayName(entry.provider),
      })),
    [dashboardStats],
  )

  const taskTypeData = useMemo(
    () =>
      (dashboardStats?.taskTypeBreakdown || []).map((entry) => ({
        name: taskTypeLabel(entry.name),
        value: entry.value,
      })),
    [dashboardStats],
  )

  const escalationRate = useMemo(() => {
    if (!usageStats?.total_requests) return 0
    return Math.round((usageStats.escalation_count / usageStats.total_requests) * 1000) / 10
  }, [usageStats])

  const verificationFailures = useMemo(() => {
    if (!dashboardStats?.totals.totalRequests) return 0
    const failures = dashboardStats.totals.totalRequests * (1 - dashboardStats.totals.successRate / 100)
    return Math.max(0, Math.round(failures))
  }, [dashboardStats])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">Route a Prompt</h2>
              <p className="text-sm text-muted-foreground">
                Send a request to the router and review the on-chain receipt.
              </p>
            </div>
            {routeResponse && (
              <div className="flex items-center gap-2">
                <StatusBadge
                  status={routeResponse.verification.passed ? 'success' : 'failed'}
                  label={routeResponse.verification.passed ? 'Verified' : 'Needs Review'}
                />
                {routeResponse.escalated && <StatusBadge status="escalated" />}
              </div>
            )}
          </div>

          <form onSubmit={handleRoute} className="mt-6 space-y-4">
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Enter a prompt to route..."
              rows={4}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Max Cost (USDC)</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={maxCost}
                  onChange={(event) => setMaxCost(event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max Latency (ms)</label>
                <Input
                  type="number"
                  value={maxLatency}
                  onChange={(event) => setMaxLatency(event.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Quality Preference</label>
                <Select value={qualityPreference} onValueChange={(value) => setQualityPreference(value as QualityTier)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheap">Cheap</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={useAllowlist} onCheckedChange={setUseAllowlist} />
              <span className="text-sm">Use provider allowlist</span>
            </div>
            {routeError && <p className="text-sm text-red-600">{routeError}</p>}
            <Button type="submit" disabled={isRouting}>
              {isRouting ? 'Routing...' : 'Route Request'}
            </Button>
          </form>

          {routeResponse && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-4 lg:col-span-2">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Request ID</span>
                    <span className="font-mono">{routeResponse.request_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Task Type</span>
                    <span>{taskTypeLabel(routeResponse.classification.task_type)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Selected Provider</span>
                    <span>{providerDisplayName(routeResponse.selected_provider.provider_id)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Estimated Cost</span>
                    <span>{formatUsdc(routeResponse.selected_provider.estimated_cost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span>{formatUsdc(routeResponse.total_cost_usdc)}</span>
                  </div>
                  <div className="text-muted-foreground">Completion</div>
                  <div className="bg-muted rounded-md p-3 text-xs whitespace-pre-wrap">
                    {routeResponse.completion}
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/dashboard/request-details?requestId=${routeResponse.request_id}`)
                    }
                  >
                    View Request Details
                  </Button>
                </div>
              </Card>
              <ReceiptCard
                chain="Arc"
                amount={routeResponse.payment.amount_usdc.toFixed(4)}
                recipient={routeResponse.payment.recipient_address}
                txHash={routeResponse.payment.tx_hash}
                status={routeResponse.payment.block_number ? 'confirmed' : 'pending'}
              />
            </div>
          )}
        </Card>

        {loading ? (
          <SkeletonLoader rows={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Total Requests"
              value={dashboardStats?.totals.totalRequests || 0}
              tooltip="Total requests in selected time range"
            />
            <KpiCard
              title="Success Rate"
              value={`${dashboardStats?.totals.successRate || 0}%`}
              tooltip="Percentage of successful verifications"
            />
            <KpiCard
              title="Avg Cost/Request"
              value={formatUsdc(usageStats?.average_cost_usdc || 0)}
              unit="USDC"
              tooltip="Average cost across all providers"
            />
            <KpiCard
              title="P95 Latency"
              value={p95Latency || 0}
              unit="ms"
              tooltip="95th percentile response time"
            />
          </div>
        )}

        {loading ? (
          <SkeletonLoader rows={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Escalation Rate"
              value={`${escalationRate}%`}
              tooltip="Percentage of requests that escalated"
            />
            <KpiCard
              title="Spend Today"
              value={`${formatUsdc(usageStats?.spend_today || 0)} / ${formatUsdc(
                treasury?.daily_cap || 0,
                2,
              )}`}
              tooltip="Daily spending vs daily cap"
            />
            <KpiCard
              title="Active Providers"
              value={activeProviderCount}
              tooltip="Number of providers currently responding"
            />
            <KpiCard
              title="Verification Failures"
              value={verificationFailures}
              tooltip="Total verification failures in period"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Cost Per Request Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardStats?.costOverTime || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-primary)' }}
                  name="Avg Cost (USDC)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Latency P50/P95 Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={latencySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="time" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="p50"
                  stroke="var(--color-chart-1)"
                  strokeWidth={2}
                  name="P50"
                />
                <Line
                  type="monotone"
                  dataKey="p95"
                  stroke="var(--color-chart-2)"
                  strokeWidth={2}
                  name="P95"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Provider Share (Requests & Spend)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={providerSpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="provider" stroke="var(--color-muted-foreground)" />
                <YAxis stroke="var(--color-muted-foreground)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="var(--color-chart-1)" name="Requests" />
                <Bar dataKey="spend" fill="var(--color-chart-2)" name="Spend ($)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Task Types Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={taskTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {taskTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Requests</h3>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          ) : recentRequestRows.length === 0 ? (
            <EmptyState
              title="No requests yet"
              description="Route a prompt to see requests populate this table."
            />
          ) : (
            <RequestsTable
              data={recentRequestRows}
              onRowClick={(row) => {
                router.push(`/dashboard/request-details?requestId=${row.id}`)
              }}
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
