'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ChevronDown, FileJson } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fetchAuditEvents, type AuditEvent } from '@/lib/api'
import { providerDisplayName } from '@/lib/formatters'

const eventTypeLabels: Record<string, { label: string; color: string }> = {
  routing_decision: { label: 'Routing Decision', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200' },
  quote_received: { label: 'Quote Received', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' },
  payment_sent: { label: 'Payment Sent', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200' },
  provider_verified: { label: 'Provider Verified', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200' },
  completion_received: { label: 'Completion Received', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200' },
  verification_failed: { label: 'Verification Failed', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200' },
  verification_passed: { label: 'Verification Passed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' },
  escalated: { label: 'Escalated', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200' },
}

export default function AuditLogPage() {
  const [eventType, setEventType] = useState('all')
  const [requestId, setRequestId] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadEvents = async () => {
      try {
        const data = await fetchAuditEvents(200)
        if (isActive) {
          setEvents(data.events)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load audit events')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      isActive = false
    }
  }, [])

  const filteredEvents = events.filter((event) => {
    if (eventType !== 'all' && event.type !== eventType) return false
    if (requestId && !event.request_id.includes(requestId)) return false
    return true
  })

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Audit Log</h1>
          <p className="text-muted-foreground">
            Immutable event stream of all routing and payment decisions
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Event Types</SelectItem>
                <SelectItem value="routing_decision">Routing Decision</SelectItem>
                <SelectItem value="quote_received">Quote Received</SelectItem>
                <SelectItem value="payment_sent">Payment Sent</SelectItem>
                <SelectItem value="provider_verified">Provider Verified</SelectItem>
                <SelectItem value="completion_received">Completion Received</SelectItem>
                <SelectItem value="verification_failed">Verification Failed</SelectItem>
                <SelectItem value="verification_passed">Verification Passed</SelectItem>
                <SelectItem value="escalated">Escalated</SelectItem>
              </SelectContent>
            </Select>
          </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Request ID</label>
              <Input
                placeholder="Filter by request_id..."
                value={requestId}
                onChange={(e) => setRequestId(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Events */}
        <Card className="p-6">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
            </p>
          </div>
          {loading && <p className="text-sm text-muted-foreground">Loading events...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="space-y-3">
            {filteredEvents.map((event) => {
              const eventConfig = eventTypeLabels[event.type] || {
                label: event.type,
                color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
              }
              return (
                <div
                  key={event.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === event.id ? null : event.id)
                    }
                    className="w-full p-4 hover:bg-muted/50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1 text-left">
                      <ChevronDown
                        className={cn(
                          'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                          expandedId === event.id && 'rotate-180'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${eventConfig.color}`}
                          >
                            {eventConfig.label}
                          </span>
                          <span className="text-sm font-mono text-muted-foreground">
                            {event.request_id.slice(0, 16)}...
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{event.timestamp}</p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">
                      {providerDisplayName(event.provider_id)}
                    </span>
                  </button>

                  {expandedId === event.id && (
                    <div className="border-t border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileJson className="h-4 w-4 text-muted-foreground" />
                        <h4 className="font-medium text-sm">Event Payload</h4>
                      </div>
                      <pre className="bg-background p-3 rounded border border-border text-xs overflow-x-auto font-mono text-foreground">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
