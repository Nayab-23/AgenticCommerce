'use client';

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface ReceiptCardProps {
  chain: string
  amount: string
  recipient: string
  txHash: string
  status: 'confirmed' | 'pending' | 'failed'
}

export function ReceiptCard({ chain, amount, recipient, txHash, status }: ReceiptCardProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(txHash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusColor = {
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  }

  return (
    <Card className="p-6">
      <h3 className="text-sm font-semibold text-foreground mb-4">Receipt</h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Chain</p>
          <p className="text-sm font-medium">{chain}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Amount</p>
          <p className="text-sm font-medium">{amount} USDC</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Recipient</p>
          <p className="text-sm font-mono break-all">{recipient}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Tx Hash</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm font-mono truncate">{txHash.slice(0, 16)}...</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
            {copied && <span className="text-xs text-green-600">Copied!</span>}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <div className={`inline-block text-xs font-medium px-2 py-1 rounded mt-1 ${statusColor[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>
        <a
          href={`https://etherscan.io/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1 pt-2"
        >
          View on Etherscan <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </Card>
  )
}
