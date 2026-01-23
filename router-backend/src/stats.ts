/**
 * Simple in-memory stats tracker for demo purposes
 */

export interface RequestRecord {
  id: string;
  timestamp: Date;
  prompt: string;
  taskType: string;
  provider: string;
  costUsdc: number;
  latencyMs: number;
  txHash: string;
  verified: boolean;
}

class StatsTracker {
  private requests: RequestRecord[] = [];

  addRequest(record: RequestRecord) {
    this.requests.push(record);
    // Keep only last 100 requests in memory
    if (this.requests.length > 100) {
      this.requests.shift();
    }
  }

  getRecentRequests(limit = 10): RequestRecord[] {
    return this.requests.slice(-limit).reverse();
  }

  getTotalStats() {
    const totalRequests = this.requests.length;
    const totalSpend = this.requests.reduce((sum, r) => sum + r.costUsdc, 0);
    const avgLatency = totalRequests > 0
      ? this.requests.reduce((sum, r) => sum + r.latencyMs, 0) / totalRequests
      : 0;
    const successRate = totalRequests > 0
      ? (this.requests.filter(r => r.verified).length / totalRequests) * 100
      : 100;

    return {
      totalRequests,
      totalSpend,
      avgLatency: Math.round(avgLatency),
      successRate: Math.round(successRate * 10) / 10
    };
  }

  getCostOverTime(): Array<{ time: string; cost: number }> {
    // Group by hour
    const hourlyData: Record<string, number> = {};

    this.requests.forEach(r => {
      const hour = new Date(r.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      hourlyData[hour] = (hourlyData[hour] || 0) + r.costUsdc;
    });

    return Object.entries(hourlyData)
      .map(([time, cost]) => ({ time, cost: Math.round(cost * 1000000) / 1000000 }))
      .slice(-12);
  }

  getLatencyOverTime(): Array<{ time: string; latency: number }> {
    return this.requests.slice(-20).map(r => ({
      time: new Date(r.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }),
      latency: r.latencyMs
    }));
  }

  getProviderBreakdown(): Array<{ provider: string; requests: number; spend: number }> {
    const byProvider: Record<string, { requests: number; spend: number }> = {};

    this.requests.forEach(r => {
      if (!byProvider[r.provider]) {
        byProvider[r.provider] = { requests: 0, spend: 0 };
      }
      byProvider[r.provider].requests++;
      byProvider[r.provider].spend += r.costUsdc;
    });

    return Object.entries(byProvider).map(([provider, data]) => ({
      provider,
      requests: data.requests,
      spend: Math.round(data.spend * 1000000) / 1000000
    }));
  }

  getTaskTypeBreakdown(): Array<{ name: string; value: number }> {
    const byType: Record<string, number> = {};

    this.requests.forEach(r => {
      byType[r.taskType] = (byType[r.taskType] || 0) + 1;
    });

    return Object.entries(byType).map(([name, value]) => ({ name, value }));
  }
}

export const statsTracker = new StatsTracker();
