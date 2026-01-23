import { useState, useEffect } from 'react';
import { DashboardLayout } from './components/layout/dashboard-layout';
import { KpiCard } from './components/dashboard/kpi-card';
import { TaskBadge } from './components/dashboard/task-badge';
import { StatusBadge } from './components/dashboard/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { RouteRequest, RouteResponse } from './types';
import { api, DashboardStats } from './api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Zap, Clock, Send, Copy, ExternalLink, ArrowUpDown, ToggleLeft, ToggleRight } from 'lucide-react';

// Mock data for charts
const costData = [
  { time: '00:00', cost: 2.4 },
  { time: '04:00', cost: 1.3 },
  { time: '08:00', cost: 2.8 },
  { time: '12:00', cost: 3.9 },
  { time: '16:00', cost: 2.1 },
  { time: '20:00', cost: 2.3 },
];

const latencyData = [
  { time: '00:00', p50: 120, p95: 250 },
  { time: '04:00', p50: 110, p95: 240 },
  { time: '08:00', p50: 130, p95: 270 },
  { time: '12:00', p50: 150, p95: 310 },
  { time: '16:00', p50: 125, p95: 260 },
  { time: '20:00', p50: 135, p95: 280 },
];

const providerData = [
  { provider: 'OpenAI', requests: 320, spend: 1240 },
  { provider: 'Anthropic', requests: 280, spend: 980 },
  { provider: 'Google', requests: 210, spend: 650 },
  { provider: 'Groq', requests: 190, spend: 420 },
];

const taskTypeData = [
  { name: 'Math', value: 280 },
  { name: 'Q&A', value: 220 },
  { name: 'Summarize', value: 180 },
  { name: 'Writing', value: 150 },
  { name: 'Reasoning', value: 120 },
  { name: 'Code', value: 80 },
];

const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const mockRequests = [
  {
    id: 'req_1234567890abcdef',
    timestamp: '2024-01-22 14:32:45',
    taskType: 'math' as const,
    riskLevel: 'low' as const,
    provider: 'OpenAI',
    quoteCost: '$0.024',
    paidCost: '$0.023',
    latency: 245,
    verification: true,
    escalated: false,
    txHash: '0x1234567890abcdef1234567890abcdef12345678',
  },
  {
    id: 'req_abcdef1234567890',
    timestamp: '2024-01-22 14:31:20',
    taskType: 'qa' as const,
    riskLevel: 'medium' as const,
    provider: 'Anthropic',
    quoteCost: '$0.018',
    paidCost: '$0.018',
    latency: 312,
    verification: true,
    escalated: false,
    txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
  },
  {
    id: 'req_fed1234567890abc',
    timestamp: '2024-01-22 14:30:05',
    taskType: 'code' as const,
    riskLevel: 'high' as const,
    provider: 'Google',
    quoteCost: '$0.031',
    paidCost: '$0.029',
    latency: 187,
    verification: false,
    escalated: true,
    txHash: '0xfed1234567890abcfed1234567890abcfed12345',
  },
];

function App() {
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [budget, setBudget] = useState('0.05');
  const [taskType, setTaskType] = useState('general');
  const [showDemoData, setShowDemoData] = useState(true);
  const [liveStats, setLiveStats] = useState<DashboardStats | null>(null);

  // Fetch live stats periodically
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.getDashboardStats();
        setLiveStats(stats);
      } catch (err) {
        console.log('Could not fetch live stats');
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5s
    return () => clearInterval(interval);
  }, []);

  // Use live or demo data based on toggle
  const displayCostData = showDemoData ? costData : (liveStats?.costOverTime || []);
  const displayLatencyData = showDemoData ? latencyData : (liveStats?.latencyOverTime?.map(d => ({ time: d.time, p50: d.latency, p95: d.latency * 1.5 })) || []);
  const displayRequests = showDemoData ? mockRequests : (liveStats?.recentRequests?.map(r => ({
    id: r.id,
    timestamp: new Date(r.timestamp).toLocaleString(),
    taskType: r.taskType as any,
    riskLevel: 'low' as const,
    provider: r.provider,
    quoteCost: `$${r.costUsdc.toFixed(6)}`,
    paidCost: `$${r.costUsdc.toFixed(6)}`,
    latency: r.latencyMs,
    verification: r.verified,
    escalated: false,
    txHash: r.txHash
  })) || []);
  const displayTotals = showDemoData
    ? { totalRequests: 1237, totalSpend: 42.36, avgLatency: 127, successRate: 98.2 }
    : (liveStats?.totals || { totalRequests: 0, totalSpend: 0, avgLatency: 0, successRate: 100 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const request: RouteRequest = {
      prompt: prompt.trim(),
      maxCostUSDC: parseFloat(budget),
      taskType: taskType as any,
      constraints: {},
    };

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.route(request);
      setResult(response);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Agentic LLM Router</h1>
            <p className="text-muted-foreground">Monitor and manage your LLM procurement and payments</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Demo Data</span>
            <button
              onClick={() => setShowDemoData(!showDemoData)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border hover:bg-muted transition-colors"
            >
              {showDemoData ? (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ToggleRight className="h-5 w-5 text-green-500" />
              )}
              <span className="text-sm font-medium">
                {showDemoData ? 'Demo' : 'Live'}
              </span>
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Requests"
            value={displayTotals.totalRequests.toLocaleString()}
            unit="requests"
            tooltip="Total number of LLM requests processed"
            trend={{ value: 12.5, isPositive: true }}
          />
          <KpiCard
            title="Total Spend"
            value={`$${displayTotals.totalSpend.toFixed(2)}`}
            unit="USDC"
            tooltip="Total amount spent on LLM requests in USDC"
            trend={{ value: 8.2, isPositive: false }}
          />
          <KpiCard
            title="Avg Latency"
            value={Math.round(displayTotals.avgLatency).toString()}
            unit="ms"
            tooltip="Average response time across all providers"
            trend={{ value: 3.1, isPositive: true }}
          />
          <KpiCard
            title="Success Rate"
            value={`${displayTotals.successRate.toFixed(1)}%`}
            tooltip="Percentage of successful verifications"
            trend={{ value: 2, isPositive: true }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Submit Request</CardTitle>
              <CardDescription>Route your prompt to the optimal LLM provider</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-medium">
                    Prompt
                  </label>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter your prompt here..."
                    className="w-full min-h-[100px] p-3 border border-input rounded-md resize-vertical text-black bg-white"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="budget" className="text-sm font-medium">
                      Max Budget (USDC)
                    </label>
                    <input
                      id="budget"
                      type="number"
                      step="0.001"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full p-2 border border-input rounded-md text-black bg-white"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="taskType" className="text-sm font-medium">
                      Task Type
                    </label>
                    <select
                      id="taskType"
                      value={taskType}
                      onChange={(e) => setTaskType(e.target.value)}
                      className="w-full p-2 border border-input rounded-md text-black bg-white"
                      disabled={isLoading}
                    >
                      <option value="general">General</option>
                      <option value="math">Math</option>
                      <option value="code">Code</option>
                      <option value="qa">Q&A</option>
                      <option value="summarize">Summarize</option>
                      <option value="reasoning">Reasoning</option>
                    </select>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading || !prompt.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Response */}
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
              <CardDescription>LLM response and transaction details</CardDescription>
            </CardHeader>
            <CardContent>
              {error ? (
                <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-md">
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              ) : result ? (
                <div className="space-y-4">
                  <div className="p-4 border bg-green-50 text-green-700 rounded-md">
                    <p className="font-medium">✓ Request Successful</p>
                    <p className="text-sm mt-1">Provider: {result.selected_provider?.provider_id}</p>
                    <p className="text-sm">Cost: ${result.total_cost_usdc?.toFixed(6)} USDC</p>
                    <p className="text-sm">Latency: {result.latency_ms}ms</p>
                    {result.payment?.tx_hash && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs font-mono break-all">Tx: {result.payment.tx_hash}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(result.payment.tx_hash)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <a
                          href={`https://testnet.arcscan.app/tx/${result.payment.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border rounded-md bg-white">
                    <p className="font-medium mb-2 text-black">Response:</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{result.completion}</p>
                  </div>

                  {result.verification && (
                    <div className={`p-3 border rounded-md ${result.verification.passed ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                      <p className="text-sm font-medium">
                        Verification: {result.verification.passed ? '✓ Passed' : '⚠ Issues'}
                      </p>
                      <p className="text-xs">{result.verification.reason}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  Submit a prompt to see the response here
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Cost Over Time</CardTitle>
              <CardDescription>USDC spent per request over the last 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayCostData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                  <Line type="monotone" dataKey="cost" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Latency</CardTitle>
              <CardDescription>P50 and P95 latencies in milliseconds</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={displayLatencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} name="P50" />
                  <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={2} name="P95" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Latest LLM routing requests and their outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Timestamp</th>
                    <th className="text-left p-2">Request ID</th>
                    <th className="text-left p-2">Task Type</th>
                    <th className="text-left p-2">Provider</th>
                    <th className="text-right p-2">Cost</th>
                    <th className="text-right p-2">Latency</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {displayRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-muted/50">
                      <td className="p-2 text-sm">{request.timestamp}</td>
                      <td className="p-2 text-sm font-mono">{request.id.slice(0, 12)}...</td>
                      <td className="p-2">
                        <TaskBadge taskType={request.taskType} />
                      </td>
                      <td className="p-2 text-sm">{request.provider}</td>
                      <td className="p-2 text-sm text-right">{request.paidCost}</td>
                      <td className="p-2 text-sm text-right">{request.latency}ms</td>
                      <td className="p-2">
                        <StatusBadge status={request.verification ? 'success' : 'failed'} />
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono">{request.txHash.slice(0, 10)}...</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(request.txHash)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default App;
