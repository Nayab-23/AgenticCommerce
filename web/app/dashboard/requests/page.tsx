'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Filter } from 'lucide-react'
import { fetchRequests, type RequestSummary } from '@/lib/api'
import {
  formatTimestamp,
  formatUsdc,
  normalizeTaskType,
  providerDisplayName,
  riskFromQuality,
} from '@/lib/formatters'

const taskTypeLabels: Record<string, string> = {
  math: 'Math',
  qa: 'Q&A',
  summarize: 'Summarize',
  writing: 'Writing',
  reasoning: 'Reasoning',
  code: 'Code',
  other: 'Other',
}

export default function RequestsPage() {
  const router = useRouter()
  const [provider, setProvider] = useState('all')
  const [taskType, setTaskType] = useState('all')
  const [verificationStatus, setVerificationStatus] = useState('all')
  const [escalatedOnly, setEscalatedOnly] = useState(false)
  const [requests, setRequests] = useState<RequestSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadRequests = async () => {
      try {
        const data = await fetchRequests(100)
        if (isActive) {
          setRequests(data.requests)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load requests')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadRequests()

    return () => {
      isActive = false
    }
  }, [])

  const requestRows = useMemo(
    () =>
      requests.map((request) => ({
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

  const providers = useMemo(
    () => Array.from(new Set(requestRows.map((row) => row.provider))).sort(),
    [requestRows],
  )

  const taskTypes = useMemo(
    () => Array.from(new Set(requestRows.map((row) => row.taskType))).sort(),
    [requestRows],
  )

  const filteredRequests = useMemo(
    () =>
      requestRows.filter((req) => {
        if (provider !== 'all' && req.provider !== provider) return false
        if (taskType !== 'all' && req.taskType !== taskType) return false
        if (verificationStatus === 'pass' && !req.verification) return false
        if (verificationStatus === 'fail' && req.verification) return false
        if (escalatedOnly && !req.escalated) return false
        return true
      }),
    [provider, taskType, verificationStatus, escalatedOnly, requestRows],
  )

  const savedViews = [
    { name: 'All Requests', filter: {} },
    { name: 'High Cost', filter: { minCost: 0.03 } },
    { name: 'Failures', filter: { verification: false } },
    { name: 'Escalations', filter: { escalated: true } },
    { name: 'Budget Near Cap', filter: { highSpend: true } },
  ]

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Requests</h1>
          <p className="text-muted-foreground">View and filter all requests across your workspace</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {savedViews.map((view) => (
            <Button
              key={view.name}
              variant="outline"
              size="sm"
              className="whitespace-nowrap bg-transparent"
            >
              {view.name}
            </Button>
          ))}
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Advanced Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Task Type</label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {taskTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {taskTypeLabels[type] || type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Verification</label>
              <Select value={verificationStatus} onValueChange={setVerificationStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pass">Passed</SelectItem>
                  <SelectItem value="fail">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant={escalatedOnly ? 'default' : 'outline'}
                onClick={() => setEscalatedOnly(!escalatedOnly)}
                className="w-full"
              >
                {escalatedOnly ? 'Only Escalated' : 'Show All'}
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Download Receipts
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredRequests.length} of {requestRows.length} requests
            </p>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : filteredRequests.length === 0 ? (
            <EmptyState
              title="No requests found"
              description="Route a prompt to populate this table."
            />
          ) : (
            <RequestsTable
              data={filteredRequests}
              onRowClick={(row) =>
                router.push(`/dashboard/request-details?requestId=${row.id}`)
              }
            />
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
