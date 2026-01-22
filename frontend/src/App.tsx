import { useState } from 'react';
import InputPanel from './InputPanel';
import ResultsPanel from './ResultsPanel';
import StatsPanel from './StatsPanel';
import { RouteRequest, RouteResponse } from './types';
import { api } from './api';

function App() {
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (request: RouteRequest) => {
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

  return (
    <>
      <div className="header">
        <h1>🤖 Autonomous LLM Procurement & Payment Router</h1>
        <p>
          AI agent that routes prompts to the optimal LLM provider and pays in USDC on Arc L1.
          Verifiable onchain receipts for every transaction.
        </p>
      </div>

      <div className="app">
        <div>
          <InputPanel onSubmit={handleSubmit} isLoading={isLoading} />
          <div style={{ marginTop: '20px' }}>
            <StatsPanel />
          </div>
        </div>

        <div>
          <ResultsPanel result={result} error={error} isLoading={isLoading} />
        </div>
      </div>
    </>
  );
}

export default App;
