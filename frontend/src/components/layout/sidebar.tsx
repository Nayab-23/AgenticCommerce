'use client'

import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { BarChart3, ListChecks, FileText, Users, Shield, CreditCard, Settings, ChevronLeft, Zap } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3 },
  { name: 'Requests', href: '/requests', icon: ListChecks },
  { name: 'Request Details', href: '/request-details', icon: FileText },
  { name: 'Providers', href: '/providers', icon: Users },
  { name: 'Policies & Guardrails', href: '/policies', icon: Shield },
  { name: 'Billing & Receipts', href: '/billing', icon: CreditCard },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const [pathname, setPathname] = useState<string>(typeof window !== 'undefined' ? window.location.pathname : '/')

  useEffect(() => {
    const onPop = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  return (
    <aside
      className={cn(
        'bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        open ? 'w-64' : 'w-20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-600" />
          {open && <h1 className="text-lg font-semibold text-sidebar-foreground">AgenticRouter</h1>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', !open && 'rotate-180')} />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <button
              key={item.href}
              onClick={() => {
                // For demo purposes - in a real app you'd use router navigation
                console.log(`Navigate to ${item.href}`)
              }}
              className={cn(
                'w-full flex items-center justify-start gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {open && <span className="truncate">{item.name}</span>}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
        {open && <p>© 2024 AgenticRouter</p>}
      </div>
    </aside>
  )
}