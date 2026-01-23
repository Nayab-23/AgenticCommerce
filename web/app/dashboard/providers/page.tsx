'use client'

import { useEffect, useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  fetchProviderHealth,
  fetchProviderQuote,
  fetchProviders,
  updateProviderAllowlist,
  type ProviderHealth,
  type ProviderInfo,
  type ProviderQuote,
} from '@/lib/api'
import { formatUsdc } from '@/lib/formatters'

interface ProviderState {
  info: ProviderInfo
  quote: ProviderQuote | null
  health: ProviderHealth | null
}

export default function ProvidersPage() {
  const [providers, setProviders] = useState<ProviderState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let isActive = true

    const loadProviders = async () => {
      try {
        const data = await fetchProviders()
        const providerStates = await Promise.all(
          data.providers.map(async (provider) => {
            const [quote, health] = await Promise.all([
              fetchProviderQuote(provider.url).catch(() => null),
              fetchProviderHealth(provider.url).catch(() => null),
            ])
            return { info: provider, quote, health }
          }),
        )
        if (isActive) {
          setProviders(providerStates)
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load providers')
        }
      } finally {
        if (isActive) {
          setLoading(false)
        }
      }
    }

    loadProviders()

    return () => {
      isActive = false
    }
  }, [])

  const toggleAllowlist = async (providerId: string, allowlisted: boolean) => {
    setUpdating((prev) => ({ ...prev, [providerId]: true }))
    try {
      await updateProviderAllowlist(providerId, allowlisted)
      setProviders((prev) =>
        prev.map((provider) =>
          provider.info.id === providerId
            ? { ...provider, info: { ...provider.info, allowlisted } }
            : provider,
        ),
      )
    } catch {
      setError('Failed to update allowlist')
    } finally {
      setUpdating((prev) => ({ ...prev, [providerId]: false }))
    }
  }

  const providerRows = useMemo(
    () =>
      providers.map((provider) => {
        const quote = provider.quote
        const health = provider.health
        return {
          id: provider.info.id,
          name: provider.info.name,
          priceRange: quote
            ? `${formatUsdc(quote.base_fee, 6)} + ${formatUsdc(quote.price_per_1k_tokens, 6)}/1K`
            : 'Unavailable',
          latencyRange: quote ? `~${quote.est_latency_ms}ms` : 'Unavailable',
          qualityTier: quote ? quote.quality_tier : 'unknown',
          uptime: health?.status === 'ok' ? 'Healthy' : 'Unreachable',
          lastQuote: quote
            ? new Date(quote.expires_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'N/A',
          allowlisted: provider.info.allowlisted,
          healthStatus: health?.status === 'ok',
        }
      }),
    [providers],
  )

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Providers</h1>
          <p className="text-muted-foreground">
            Manage provider integrations, pricing, and allowlists
          </p>
        </div>

        {loading && <p className="text-sm text-muted-foreground">Loading provider data...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providerRows.map((provider) => (
            <Card key={provider.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">{provider.name}</h3>
                <Badge
                  variant="outline"
                  className={
                    provider.healthStatus
                      ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                  }
                >
                  {provider.uptime}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Price Range</p>
                  <p className="font-medium">{provider.priceRange}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="font-medium">{provider.latencyRange}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quality Tier</p>
                  <Badge
                    variant="secondary"
                    className={
                      provider.qualityTier === 'premium'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
                        : provider.qualityTier === 'balanced'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }
                  >
                    {provider.qualityTier}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quote Expires</p>
                  <p className="font-medium text-sm">{provider.lastQuote}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-sm font-medium">Allowlisted</span>
                <Switch
                  checked={provider.allowlisted}
                  disabled={updating[provider.id]}
                  onCheckedChange={(checked) => toggleAllowlist(provider.id, checked)}
                />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Provider Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Provider</th>
                  <th className="text-left py-3 px-4 font-medium">Price Range</th>
                  <th className="text-left py-3 px-4 font-medium">Latency</th>
                  <th className="text-left py-3 px-4 font-medium">Quality</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Allowlist</th>
                </tr>
              </thead>
              <tbody>
                {providerRows.map((provider) => (
                  <tr
                    key={provider.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{provider.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{provider.priceRange}</td>
                    <td className="py-3 px-4 text-muted-foreground">{provider.latencyRange}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="secondary"
                        className={
                          provider.qualityTier === 'premium'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200'
                            : provider.qualityTier === 'balanced'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }
                      >
                        {provider.qualityTier}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          provider.healthStatus
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                        }
                      >
                        {provider.healthStatus ? 'Healthy' : 'Down'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          provider.allowlisted
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }
                      >
                        {provider.allowlisted ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quote Endpoint Health</h3>
          <div className="space-y-2">
            {providerRows.map((provider) => (
              <div key={provider.id} className="flex items-center justify-between py-2">
                <span className="font-medium">{provider.name}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      provider.healthStatus ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {provider.healthStatus ? 'Healthy' : 'Unreachable'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
