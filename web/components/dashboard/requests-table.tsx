'use client'

import React from "react"

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink, ArrowUpDown } from 'lucide-react'
import { TaskBadge } from './task-badge'
import { RiskBadge } from './risk-badge'
import { ProviderPill } from './provider-pill'
import { VerificationBadge } from './verification-badge'

interface RequestRow {
  id: string
  timestamp: string
  taskType: 'math' | 'qa' | 'summarize' | 'writing' | 'reasoning' | 'code' | 'other'
  riskLevel: 'low' | 'medium' | 'high'
  provider: string
  quoteCost: string
  paidCost: string
  latency: number
  verification: boolean
  escalated: boolean
  txHash: string
}

interface RequestsTableProps {
  data: RequestRow[]
  onRowClick?: (row: RequestRow) => void
}

export function RequestsTable({ data, onRowClick }: RequestsTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ column }: { column: string }) => (
    <ArrowUpDown
      className={`h-4 w-4 ${
        sortColumn === column ? 'text-primary' : 'text-muted-foreground'
      }`}
    />
  )

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border">
            <TableHead className="cursor-pointer" onClick={() => handleSort('timestamp')}>
              <div className="flex items-center gap-2">
                Timestamp
                <SortIcon column="timestamp" />
              </div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('id')}>
              <div className="flex items-center gap-2">
                Request ID
                <SortIcon column="id" />
              </div>
            </TableHead>
            <TableHead>Task Type</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead className="text-right">Est. / Actual Cost</TableHead>
            <TableHead className="cursor-pointer" onClick={() => handleSort('latency')}>
              <div className="flex items-center justify-end gap-2">
                Latency (ms)
                <SortIcon column="latency" />
              </div>
            </TableHead>
            <TableHead>Verification</TableHead>
            <TableHead>Escalated</TableHead>
            <TableHead>Tx Hash</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={row.id}
              className="border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onRowClick?.(row)}
            >
              <TableCell className="text-sm text-muted-foreground">{row.timestamp}</TableCell>
              <TableCell className="text-sm font-mono">
                <div className="flex items-center gap-2">
                  {row.id.slice(0, 12)}...
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => copyToClipboard(row.id, e)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <TaskBadge taskType={row.taskType} />
              </TableCell>
              <TableCell>
                <RiskBadge level={row.riskLevel} />
              </TableCell>
              <TableCell>
                <ProviderPill name={row.provider} />
              </TableCell>
              <TableCell className="text-right text-sm">
                <div className="text-muted-foreground text-xs">Est: <span className="text-foreground font-medium">{row.quoteCost}</span></div>
                <div className="text-muted-foreground text-xs">Act: <span className="text-primary font-semibold">{row.paidCost}</span></div>
              </TableCell>
              <TableCell className="text-right text-sm">{row.latency}</TableCell>
              <TableCell>
                <VerificationBadge passed={row.verification} />
              </TableCell>
              <TableCell className="text-sm">
                {row.escalated ? (
                  <span className="text-orange-600 dark:text-orange-400 font-medium">Yes</span>
                ) : (
                  <span className="text-muted-foreground">No</span>
                )}
              </TableCell>
              <TableCell className="text-sm font-mono">
                <div className="flex items-center gap-2">
                  {row.txHash.slice(0, 8)}...
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => copyToClipboard(row.txHash, e)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <a
                    href={`https://etherscan.io/tx/${row.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 text-primary hover:text-primary/80" />
                  </a>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
