'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { AlertCircle } from 'lucide-react'
import { fetchPolicy, updatePolicy } from '@/lib/api'
import { formatUsdc } from '@/lib/formatters'

const taskTypes = ['math', 'qa', 'summarize', 'writing', 'reasoning', 'code']

export default function PoliciesPage() {
  const [emergencyStop, setEmergencyStop] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [perRequestCap, setPerRequestCap] = useState('0.02')
  const [dailyCap, setDailyCap] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isActive = true

    const loadPolicy = async () => {
      try {
        const policy = await fetchPolicy()
        if (isActive) {
          setEmergencyStop(policy.emergency_stop)
          setPerRequestCap(policy.per_request_cap_usdc.toString())
          setDailyCap(policy.daily_cap_usdc.toString())
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load policy settings')
        }
      }
    }

    loadPolicy()

    return () => {
      isActive = false
    }
  }, [])

  const handleEmergencyStop = () => {
    setShowWarning(true)
  }

  const saveCaps = async () => {
    setSaving(true)
    setError(null)
    try {
      const perRequestValue = Number(perRequestCap)
      const dailyValue = Number(dailyCap)
      await updatePolicy({
        per_request_cap_usdc: Number.isFinite(perRequestValue) ? perRequestValue : undefined,
        daily_cap_usdc: Number.isFinite(dailyValue) ? dailyValue : undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save caps')
    } finally {
      setSaving(false)
    }
  }

  const updateEmergencyStop = async (value: boolean) => {
    setSaving(true)
    setError(null)
    try {
      await updatePolicy({ emergency_stop: value })
      setEmergencyStop(value)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update emergency stop')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Policies & Guardrails</h1>
          <p className="text-muted-foreground">Configure spend controls and safety policies</p>
        </div>

        {/* Emergency Stop Card */}
        <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Emergency Stop</h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-200 mb-4">
            Activating emergency stop will immediately halt all spending. All requests will be
            rejected.
          </p>
          <div className="flex items-center gap-4">
            <Switch
              checked={emergencyStop}
              onCheckedChange={(checked) => {
                if (checked) {
                  handleEmergencyStop()
                } else {
                  updateEmergencyStop(false)
                }
              }}
              disabled={showWarning || saving}
            />
            <span className="text-sm font-medium">
              {emergencyStop ? 'Emergency Stop ACTIVE' : 'Emergency Stop Disabled'}
            </span>
          </div>

          {showWarning && (
            <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                Are you sure? This action cannot be undone immediately.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    updateEmergencyStop(true)
                    setShowWarning(false)
                  }}
                >
                  Confirm Stop
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowWarning(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Spend Controls */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Spend Controls</h3>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Per-Request Cap (USDC)</label>
                <input
                  type="number"
                  value={perRequestCap}
                  onChange={(event) => setPerRequestCap(event.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  step="0.01"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Daily Cap (USDC)</label>
                <input
                  type="number"
                  value={dailyCap}
                  onChange={(event) => setDailyCap(event.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  step="1"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button onClick={saveCaps} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Current caps: {formatUsdc(Number(perRequestCap))} per request ·{' '}
                {formatUsdc(Number(dailyCap), 2)} daily
              </span>
            </div>
          </div>
        </Card>

        {/* Task-Based Rules */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Task-Based Rules</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Task Type</th>
                  <th className="text-left py-3 px-4 font-medium">Max Cost</th>
                  <th className="text-left py-3 px-4 font-medium">Min Quality</th>
                  <th className="text-left py-3 px-4 font-medium">Allowed Providers</th>
                </tr>
              </thead>
              <tbody>
                {taskTypes.map((task) => (
                  <tr key={task} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium capitalize">{task}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        defaultValue="0.05"
                        className="w-20 px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        defaultValue="0.80"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-20 px-2 py-1 border border-border rounded text-sm bg-background text-foreground"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select className="px-2 py-1 border border-border rounded text-sm bg-background text-foreground">
                        <option>All</option>
                        <option>OpenAI, Anthropic</option>
                        <option>Premium Only</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button className="mt-4">Save Task Rules</Button>
        </Card>

        {/* Escalation Policy */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Escalation Policy</h3>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch defaultChecked />
                <span className="text-sm font-medium">Allow Escalations</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Max Retries</label>
                <input
                  type="number"
                  defaultValue="2"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Max Extra Spend (%)</label>
                <input
                  type="number"
                  defaultValue="50"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                />
              </div>
            </div>
            <Button>Save Escalation Policy</Button>
          </div>
        </Card>

        {/* Privacy Mode */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Privacy Mode</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <Switch />
              <span className="text-sm font-medium">
                Never send to non-allowlisted providers
              </span>
            </label>
            <p className="text-sm text-muted-foreground">
              When enabled, all requests will only be sent to providers on the allowlist,
              regardless of cost or latency optimization.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
