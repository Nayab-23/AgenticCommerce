import fs from 'fs';
import path from 'path';
import { AuditLogEntry, UsageStats } from '@agentic-router/shared';

/**
 * SpendTracker manages spending limits and usage statistics
 */
export class SpendTracker {
  private auditLogPath: string;
  private usageStatsPath: string;
  
  constructor() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.auditLogPath = path.join(dataDir, 'audit.jsonl');
    this.usageStatsPath = path.join(dataDir, 'usage-stats.json');
    
    // Initialize stats file if it doesn't exist
    if (!fs.existsSync(this.usageStatsPath)) {
      this.saveStats(this.getDefaultStats());
    }
  }
  
  /**
   * Log audit entry
   */
  logAudit(entry: AuditLogEntry): void {
    const line = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.auditLogPath, line, 'utf8');
  }
  
  /**
   * Check if request is within spending limits
   */
  canSpend(amountUsdc: number): { allowed: boolean; reason?: string } {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];
    const statsDate = new Date(stats.requests_today > 0 ? Date.now() : 0).toISOString().split('T')[0];
    
    // Reset daily stats if new day
    let spendToday = stats.spend_today;
    if (today !== statsDate) {
      spendToday = 0;
    }
    
    // Check per-request cap
    const perRequestCap = require('./config').config.perRequestCapUsdc;
    if (amountUsdc > perRequestCap) {
      return {
        allowed: false,
        reason: `Request amount $${amountUsdc} exceeds per-request cap of $${perRequestCap}`
      };
    }
    
    // Check daily cap
    const dailyCap = require('./config').config.dailySpendCapUsdc;
    if (spendToday + amountUsdc > dailyCap) {
      return {
        allowed: false,
        reason: `Request would exceed daily spend cap of $${dailyCap} (current: $${spendToday})`
      };
    }
    
    return { allowed: true };
  }
  
  /**
   * Record spending
   */
  recordSpending(
    providerId: string,
    amountUsdc: number,
    escalated: boolean
  ): void {
    const stats = this.getStats();
    const today = new Date().toISOString().split('T')[0];
    const statsDate = new Date(stats.requests_today > 0 ? Date.now() : 0).toISOString().split('T')[0];
    
    // Reset daily stats if new day
    if (today !== statsDate) {
      stats.requests_today = 0;
      stats.spend_today = 0;
    }
    
    // Update stats
    stats.total_requests += 1;
    stats.requests_today += 1;
    stats.total_spend_usdc += amountUsdc;
    stats.spend_today += amountUsdc;
    
    if (!stats.spend_by_provider[providerId]) {
      stats.spend_by_provider[providerId] = 0;
    }
    stats.spend_by_provider[providerId] += amountUsdc;
    
    if (escalated) {
      stats.escalation_count += 1;
    }
    
    stats.average_cost_usdc = stats.total_spend_usdc / stats.total_requests;
    
    this.saveStats(stats);
  }
  
  /**
   * Get current usage statistics
   */
  getStats(): UsageStats {
    try {
      const data = fs.readFileSync(this.usageStatsPath, 'utf8');
      return JSON.parse(data);
    } catch {
      return this.getDefaultStats();
    }
  }
  
  /**
   * Get default stats
   */
  private getDefaultStats(): UsageStats {
    return {
      total_requests: 0,
      total_spend_usdc: 0,
      spend_by_provider: {},
      average_cost_usdc: 0,
      escalation_count: 0,
      requests_today: 0,
      spend_today: 0
    };
  }
  
  /**
   * Save stats to file
   */
  private saveStats(stats: UsageStats): void {
    fs.writeFileSync(this.usageStatsPath, JSON.stringify(stats, null, 2), 'utf8');
  }
}
