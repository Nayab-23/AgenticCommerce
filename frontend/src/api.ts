import axios from 'axios';
import { RouteRequest, RouteResponse, UsageStats } from './types';

const API_BASE = '/api';

export const api = {
  async route(request: RouteRequest): Promise<RouteResponse> {
    const response = await axios.post<RouteResponse>(`${API_BASE}/route`, request);
    return response.data;
  },

  async getStats(): Promise<UsageStats> {
    const response = await axios.get<UsageStats>(`${API_BASE}/stats`);
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
