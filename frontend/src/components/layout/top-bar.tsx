 'use client'

import { useEffect, useState } from 'react'
import { Menu, Search, Clock, AlertCircle, LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '../ui/button'

interface TopBarProps {
  onSidebarToggle: () => void
}

export function TopBar({ onSidebarToggle }: TopBarProps) {
  const [timeRange, setTimeRange] = useState('24h')
  const [isSpendingEnabled, setIsSpendingEnabled] = useState(true)
  const [workspace, setWorkspace] = useState('default')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch (e) {}
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (theme === 'dark') document.documentElement.classList.add('dark')
      else document.documentElement.classList.remove('dark')
    }
    try { localStorage.setItem('theme', theme) } catch (e) {}
  }, [theme])

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Workspace Selector */}
          <select 
            value={workspace} 
            onChange={(e) => setWorkspace(e.target.value)}
            className="w-40 px-3 py-1 border border-input rounded-md text-sm"
          >
            <option value="default">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Search requests, providers..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md text-sm"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Time Range */}
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-1 border border-input rounded-md text-sm"
          >
            <option value="1h">1h</option>
            <option value="24h">24h</option>
            <option value="7d">7d</option>
            <option value="30d">30d</option>
          </select>

          {/* Emergency Stop */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Live</span>
          </div>

          {/* Spending Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSpendingEnabled(!isSpendingEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                isSpendingEnabled ? 'bg-green-600' : 'bg-red-600'
              )}
            >
              <span
                className={cn(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  isSpendingEnabled ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {isSpendingEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {/* Theme Toggle */}
          <Button variant="ghost" size="sm" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Alert */}
          <Button variant="ghost" size="sm" className="relative">
            <AlertCircle className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
          </Button>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}