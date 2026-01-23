'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Download, ExternalLink } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  fetchRequests,
  fetchTreasuryInfo,
  fetchUsageStats,
  type RequestSummary,
  type TreasuryInfo,
  type UsageStats,
} from '@/lib/api'
import { formatTimestamp, formatUsdc, providerDisplayName } from '@/lib/formatters'

export default function BillingPage() {
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null)
  const [treasury, setTreasury] = useState<TreasuryInfo | null>(null)
  const [requests, setRequests] = useState<RequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadBilling = async () => {
      try {
        const [stats, treasuryInfo, requestData] = await Promise.all([
          fetchUsageStats(),
          fetchTreasuryInfo(),
          fetchRequests(100),
        ])
        if (isActive) {
          setUsageStats(stats)
          setTreasury(treasuryInfo)
          setRequests(requestData.requests)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load billing data')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadBilling()

    return () => {
      isActive = false
    }
  }, [])

  const spendData = useMemo(() => {
    if (!usageStats) return []
    return Object.entries(usageStats.spend_by_provider).map(([provider, amount]) => ({
      provider: providerDisplayName(provider),
      amount: Math.round(amount * 1000000) / 1000000,
    }))
  }, [usageStats])

  const receipts = useMemo(
    () =>
      requests.map((request) => ({
        requestId: request.id,
        provider: providerDisplayName(request.provider_id),
        amount: request.total_cost_usdc,
        txHash: request.tx_hash,
        timestamp: formatTimestamp(request.created_at),
        status: request.verification_passed ? 'confirmed' : 'pending',
      })),
    [requests],
  )

  const topProvider = useMemo(() => {
    if (!usageStats) return 'N/A'
    const entries = Object.entries(usageStats.spend_by_provider)
    if (entries.length === 0) return 'N/A'
    const [provider] = entries.sort((a, b) => b[1] - a[1])[0]
    return providerDisplayName(provider)
  }, [usageStats])

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Billing & Receipts</h1>
          <p className="text-muted-foreground">View spending, receipts, and download proof bundles</p>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading billing data...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Spend Today"
            value={`${formatUsdc(usageStats?.spend_today || 0)} / ${formatUsdc(
              treasury?.daily_cap || 0,
              2,
            )}`}
            tooltip="Total spend since 00:00 UTC vs daily cap"
          />
          <KpiCard
            title="Total Spend"
            value={formatUsdc(usageStats?.total_spend_usdc || 0)}
            tooltip="Cumulative spend across all providers"
          />
          <KpiCard
            title="Avg Cost/Request"
            value={formatUsdc(usageStats?.average_cost_usdc || 0)}
            tooltip="Average cost across all providers"
          />
          <KpiCard
            title="Top Provider"
            value={topProvider}
            tooltip="Provider with highest spend in this dataset"
          />
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spend by Provider</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={spendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="provider" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip />
              <Bar dataKey="amount" fill="var(--color-primary)" name="Spend ($)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Receipts</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export Receipts
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Proof Bundle
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Amount (USDC)</TableHead>
                  <TableHead>Tx Hash</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((receipt) => (
                  <TableRow key={receipt.requestId} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{receipt.requestId.slice(0, 16)}...</TableCell>
                    <TableCell>{receipt.provider}</TableCell>
                    <TableCell className="font-medium">{formatUsdc(receipt.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{receipt.txHash.slice(0, 12)}...</span>
                        <a
                          href={`https://etherscan.io/tx/${receipt.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {receipt.timestamp}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          receipt.status === 'confirmed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200'
                        }`}
                      >
                        {receipt.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-6 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Audit-Ready Receipts
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200 mb-4">
            Top provider by spend: <span className="font-medium">{topProvider}</span>
          </p>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4">
            <li>• Request ID (unique identifier)</li>
            <li>• Provider (recipient of payment)</li>
            <li>• Amount (in USDC)</li>
            <li>• Transaction Hash (on-chain proof)</li>
            <li>• Block Number (immutable record)</li>
            <li>• Timestamp (precise execution time)</li>
          </ul>
        </Card>
      </div>
    </DashboardLayout>
  )
}
