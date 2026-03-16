'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { BarChart3, ListChecks, FileText, Users, Shield, CreditCard, ListRestart as LogStream, Settings, ChevronLeft } from 'lucide-react'

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: BarChart3 },
  { name: 'Requests', href: '/dashboard/requests', icon: ListChecks },
  { name: 'Request Details', href: '/dashboard/request-details', icon: FileText },
  { name: 'Providers', href: '/dashboard/providers', icon: Users },
  { name: 'Policies & Guardrails', href: '/dashboard/policies', icon: Shield },
  { name: 'Billing & Receipts', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Audit Log', href: '/dashboard/audit', icon: LogStream },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col',
        open ? 'w-64' : 'w-20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {open && <h1 className="text-lg font-semibold text-sidebar-foreground">Agentic Commerce</h1>}
        <Button
          variant="ghost"
          size="icon"
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
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {open && <span className="truncate">{item.name}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
        {open && <p>© 2026 Agentic Commerce</p>}
      </div>
    </aside>
  )
}
