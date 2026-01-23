'use client'

import { useEffect, useState } from 'react'
import { Menu, Search, Clock, LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { fetchHealth } from '@/lib/api'

interface TopBarProps {
  onSidebarToggle: () => void
}

export function TopBar({ onSidebarToggle }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const [timeRange, setTimeRange] = useState('24h')
  const [isSpendingEnabled, setIsSpendingEnabled] = useState(true)
  const [workspace, setWorkspace] = useState('default')

  useEffect(() => {
    let isActive = true

    const loadHealth = async () => {
      try {
        const data = await fetchHealth()
        if (isActive) {
          setIsSpendingEnabled(!data.emergency_stop)
        }
      } catch {
        if (isActive) {
          setIsSpendingEnabled(true)
        }
      }
    }

    loadHealth()
    const interval = setInterval(loadHealth, 15000)

    return () => {
      isActive = false
      clearInterval(interval)
    }
  }, [])

  return (
    <header className="border-b border-border bg-card">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        {/* Left Section */}
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Workspace Selector */}
          <Select value={workspace} onValueChange={setWorkspace}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Select workspace" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Workspace</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
            </SelectContent>
          </Select>

          {/* Time Range Picker */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last 1h</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7d</SelectItem>
                <SelectItem value="30d">Last 30d</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search request_id, tx_hash..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Status Pill */}
          <Badge
            variant={isSpendingEnabled ? 'default' : 'destructive'}
            className="flex items-center gap-2 px-3"
          >
            <div className={`h-2 w-2 rounded-full ${isSpendingEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
            {isSpendingEnabled ? 'Spending Enabled' : 'Emergency Stop'}
          </Badge>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  JD
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>API Keys</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
