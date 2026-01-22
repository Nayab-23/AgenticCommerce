import { useEffect, useState } from 'react';
import { UsageStats } from './types';
import { api } from './api';

export default function StatsPanel() {
  const [stats, setStats] = useState<UsageStats | null>(null);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  if (!stats) {
    return (
      <div className="results-panel">
        <h2>📊 Usage Statistics</h2>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <h2>📊 Usage Statistics</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total_requests}</div>
          <div className="stat-label">Total Requests</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">${stats.total_spend_usdc.toFixed(4)}</div>
          <div className="stat-label">Total Spend</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">${stats.average_cost_usdc.toFixed(5)}</div>
          <div className="stat-label">Avg Cost/Request</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.escalation_count}</div>
          <div className="stat-label">Escalations</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{stats.requests_today}</div>
          <div className="stat-label">Requests Today</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">${stats.spend_today.toFixed(4)}</div>
          <div className="stat-label">Spend Today</div>
        </div>
      </div>

      {Object.keys(stats.spend_by_provider).length > 0 && (
        <div className="section" style={{ marginTop: '20px' }}>
          <h3>Spend by Provider</h3>
          <div className="section-content">
            {Object.entries(stats.spend_by_provider).map(([provider, amount]) => (
              <div key={provider} className="payment-row">
                <strong>{provider}:</strong>
                <span>${amount.toFixed(6)} USDC</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
