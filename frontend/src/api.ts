import axios from 'axios';
import { RouteRequest, RouteResponse, UsageStats } from './types';

const API_BASE = 'http://localhost:3000/api';

export interface DashboardStats {
  totals: {
    totalRequests: number;
    totalSpend: number;
    avgLatency: number;
    successRate: number;
  };
  costOverTime: Array<{ time: string; cost: number }>;
  latencyOverTime: Array<{ time: string; latency: number }>;
  providerBreakdown: Array<{ provider: string; requests: number; spend: number }>;
  taskTypeBreakdown: Array<{ name: string; value: number }>;
  recentRequests: Array<{
    id: string;
    timestamp: string;
    prompt: string;
    taskType: string;
    provider: string;
    costUsdc: number;
    latencyMs: number;
    txHash: string;
    verified: boolean;
  }>;
}

export const api = {
  async route(request: RouteRequest): Promise<RouteResponse> {
    const response = await axios.post<RouteResponse>(`${API_BASE}/route`, request);
    return response.data;
  },

  async getStats(): Promise<UsageStats> {
    const response = await axios.get<UsageStats>(`${API_BASE}/stats`);
    return response.data;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await axios.get<DashboardStats>(`${API_BASE}/dashboard/stats`);
    return response.data;
  },

  async getTreasury(): Promise<{
    address: string;
    balance_usdc: number;
    daily_cap: number;
    per_request_cap: number;
  }> {
    const response = await axios.get(`${API_BASE}/treasury`);
    return response.data;
  }
};
