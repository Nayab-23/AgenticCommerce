import { RouteResponse } from './types';

interface ResultsPanelProps {
  result: RouteResponse | null;
  error: string | null;
  isLoading: boolean;
}

export default function ResultsPanel({ result, error, isLoading }: ResultsPanelProps) {
  if (isLoading) {
    return (
      <div className="results-panel">
        <h2>⚡ Processing</h2>
        <div className="loading">
          <div className="spinner"></div>
          <p>Agent is working...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-panel">
        <h2>❌ Error</h2>
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="results-panel">
        <h2>📊 Results</h2>
        <div className="empty-state">
          <p>Submit a prompt to see results here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-panel">
      <h2>📊 Results</h2>

      {/* Classification */}
      <div className="section">
        <h3>1️⃣ Classification</h3>
        <div className="section-content">
          <p>
            <span className="badge badge-info">{result.classification.task_type}</span>
            <span className="badge badge-warning">~{result.classification.estimated_tokens} tokens</span>
            <span className="badge badge-success">{result.classification.requires_quality} quality</span>
          </p>
        </div>
      </div>

      {/* Quotes */}
      <div className="section">
        <h3>2️⃣ Provider Quotes</h3>
        <div className="quote-list">
          {result.quotes_received.map((quote) => (
            <div
              key={quote.provider_id}
              className={`quote-item ${
                quote.provider_id === result.selected_provider.provider_id ? 'selected' : ''
              }`}
            >
              <div className="quote-item-header">
                <strong>{quote.provider_id}</strong>
                <span className="badge badge-info">{quote.quality_tier}</span>
              </div>
              <div className="quote-item-details">
                {quote.model_name} • ${quote.price_per_1k_tokens}/1K tokens • ~{quote.est_latency_ms}ms
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selection */}
      <div className="section">
        <h3>3️⃣ Provider Selection</h3>
        <div className="section-content">
          <p><strong>Selected:</strong> {result.selected_provider.provider_id}</p>
          <p><strong>Estimated Cost:</strong> ${result.selected_provider.estimated_cost.toFixed(6)} USDC</p>
          <p><strong>Rationale:</strong> {result.selected_provider.rationale}</p>
        </div>
      </div>

      {/* Payment */}
      <div className="section">
        <h3>4️⃣ Payment on Arc</h3>
        <div className="payment-details">
          <div className="payment-row">
            <strong>Amount:</strong>
            <span>${result.payment.amount_usdc.toFixed(6)} USDC</span>
          </div>
          <div className="payment-row">
            <strong>Recipient:</strong>
            <span className="tx-hash">{result.payment.recipient_address.substring(0, 10)}...{result.payment.recipient_address.substring(38)}</span>
          </div>
          <div className="payment-row">
            <strong>TX Hash:</strong>
            <a
              href={`https://explorer.arc.xyz/tx/${result.payment.tx_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tx-hash"
            >
              {result.payment.tx_hash.substring(0, 10)}...{result.payment.tx_hash.substring(58)}
            </a>
          </div>
          {result.payment.block_number && (
            <div className="payment-row">
              <strong>Block:</strong>
              <span>#{result.payment.block_number}</span>
            </div>
          )}
        </div>
      </div>

      {/* Completion */}
      <div className="section">
        <h3>5️⃣ Completion</h3>
        <div className="completion-box">
          {result.completion}
        </div>
      </div>

      {/* Verification */}
      <div className="section">
        <h3>6️⃣ Verification</h3>
        <div className="section-content">
          <p>
            {result.verification.passed ? (
              <span className="badge badge-success">✓ PASSED</span>
            ) : (
              <span className="badge badge-danger">✗ FAILED</span>
            )}
            {result.verification.score !== undefined && (
              <span> Score: {(result.verification.score * 100).toFixed(0)}%</span>
            )}
          </p>
          <p><strong>Reason:</strong> {result.verification.reason}</p>
        </div>
      </div>

      {/* Escalation */}
      {result.escalated && (
        <div className="section">
          <h3>🔼 Escalation</h3>
          <div className="section-content">
            <p><span className="badge badge-warning">Escalated to Premium Provider</span></p>
            <p><strong>Provider:</strong> {result.escalation_provider?.provider_id}</p>
            <p><strong>Additional Cost:</strong> ${result.escalation_payment?.amount_usdc.toFixed(6)} USDC</p>
            <p><strong>TX Hash:</strong> 
              <a
                href={`https://explorer.arc.xyz/tx/${result.escalation_payment?.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tx-hash"
              >
                {' '}{result.escalation_payment?.tx_hash.substring(0, 16)}...
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="section">
        <h3>📈 Summary</h3>
        <div className="section-content">
          <p><strong>Total Cost:</strong> ${result.total_cost_usdc.toFixed(6)} USDC</p>
          <p><strong>Total Latency:</strong> {result.latency_ms}ms</p>
          <p><strong>Request ID:</strong> <code>{result.request_id}</code></p>
        </div>
      </div>
    </div>
  );
}
