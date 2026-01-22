import { useState } from 'react';
import { RouteRequest } from './types';

interface InputPanelProps {
  onSubmit: (request: RouteRequest) => void;
  isLoading: boolean;
}

export default function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [maxCost, setMaxCost] = useState(0.02);
  const [maxLatency, setMaxLatency] = useState(5000);
  const [qualityPref, setQualityPref] = useState<'cheap' | 'balanced' | 'premium'>('balanced');
  const [useAllowlist, setUseAllowlist] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      alert('Please enter a prompt');
      return;
    }

    const request: RouteRequest = {
      prompt: prompt.trim(),
      policy: {
        max_cost_usdc: maxCost,
        max_latency_ms: maxLatency,
        quality_preference: qualityPref,
        use_allowlist: useAllowlist
      }
    };

    onSubmit(request);
  };

  return (
    <div className="input-panel">
      <h2>🚀 Submit Your Prompt</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="prompt">Prompt</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your question or task here..."
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxCost">Max Cost (USDC)</label>
          <input
            id="maxCost"
            type="number"
            step="0.001"
            min="0.0001"
            max="1"
            value={maxCost}
            onChange={(e) => setMaxCost(parseFloat(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="maxLatency">Max Latency (ms)</label>
          <input
            id="maxLatency"
            type="number"
            step="100"
            min="500"
            max="30000"
            value={maxLatency}
            onChange={(e) => setMaxLatency(parseInt(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="quality">Quality Preference</label>
          <select
            id="quality"
            value={qualityPref}
            onChange={(e) => setQualityPref(e.target.value as any)}
            disabled={isLoading}
          >
            <option value="cheap">Cheap (Fastest, Lowest Cost)</option>
            <option value="balanced">Balanced (Good Quality)</option>
            <option value="premium">Premium (Best Quality)</option>
          </select>
        </div>

        <div className="form-group">
          <div className="checkbox-group">
            <input
              id="allowlist"
              type="checkbox"
              checked={useAllowlist}
              onChange={(e) => setUseAllowlist(e.target.checked)}
              disabled={isLoading}
            />
            <label htmlFor="allowlist">Use Provider Allowlist</label>
          </div>
        </div>

        <button type="submit" className="btn" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Run Agent'}
        </button>
      </form>
    </div>
  );
}
