'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Eye, EyeOff, Trash2 } from 'lucide-react'
import { useState } from 'react'

const apiKeys = [
  {
    id: 'key_abc123',
    name: 'Production API Key',
    key: 'sk_live_REPLACE_WITH_REAL_KEY',
    created: '2024-01-15',
    lastUsed: '2 hours ago',
  },
  {
    id: 'key_def456',
    name: 'Development API Key',
    key: 'sk_test_REPLACE_WITH_REAL_KEY',
    created: '2024-01-10',
    lastUsed: '30 min ago',
  },
]

const webhooks = [
  {
    id: 'webhook_1',
    url: 'https://api.example.com/webhooks/streamline',
    events: ['payment_sent', 'verification_failed', 'escalated'],
    active: true,
  },
  {
    id: 'webhook_2',
    url: 'https://api.example.com/webhooks/notifications',
    events: ['escalated'],
    active: false,
  },
]

const teamMembers = [
  {
    id: 'user_1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Owner',
    status: 'active',
  },
  {
    id: 'user_2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'Admin',
    status: 'active',
  },
  {
    id: 'user_3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'Viewer',
    status: 'inactive',
  },
]

export default function SettingsPage() {
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState<string | null>(null)

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys({
      ...visibleKeys,
      [keyId]: !visibleKeys[keyId],
    })
  }

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text)
    setCopied(keyId)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage API keys, webhooks, and team members</p>
        </div>

        {/* API Keys */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">API Keys</h3>
            <Button size="sm">Generate New Key</Button>
          </div>
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium mb-1">{apiKey.name}</h4>
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {visibleKeys[apiKey.id] ? apiKey.key : `${apiKey.key.slice(0, 8)}${'*'.repeat(20)}`}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                    >
                      {visibleKeys[apiKey.id] ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() =>
                        copyToClipboard(apiKey.key, apiKey.id)
                      }
                    >
                      {copied === apiKey.id ? (
                        <span className="text-xs text-green-600">✓</span>
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Webhooks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Webhooks</h3>
            <Button size="sm">Add Webhook</Button>
          </div>
          <div className="space-y-3">
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-mono text-sm mb-2">{webhook.url}</h4>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Badge
                    className={
                      webhook.active
                        ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }
                  >
                    {webhook.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Team Members */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button size="sm">Invite Member</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium">{member.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{member.email}</td>
                    <td className="py-3 px-4">
                      <select className="px-2 py-1 text-sm border border-border rounded bg-background">
                        <option>Owner</option>
                        <option selected={member.role === 'Admin'}>Admin</option>
                        <option selected={member.role === 'Viewer'}>Viewer</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={
                          member.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }
                      >
                        {member.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Account Preferences */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Account Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Default Workspace</label>
              <select className="w-full px-3 py-2 border border-border rounded-md bg-background">
                <option>Default Workspace</option>
                <option>Production</option>
                <option>Staging</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email Notifications</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Payment alerts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Escalation notifications</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Weekly digest</span>
                </label>
              </div>
            </div>
            <Button>Save Preferences</Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-4">Danger Zone</h3>
          <p className="text-sm text-red-800 dark:text-red-200 mb-4">
            These actions cannot be undone. Please proceed with caution.
          </p>
          <Button variant="destructive" size="sm">
            Delete Workspace
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  )
}
