import { SpendTracker } from '../src/spend-tracker';
import fs from 'fs';
import path from 'path';

describe('SpendTracker', () => {
  let tracker: SpendTracker;
  const testDataDir = path.join(__dirname, '../test-data');

  beforeEach(() => {
    // Create test data directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
    
    // Mock data directory
    jest.spyOn(path, 'join').mockImplementation((...args) => {
      if (args.includes('data')) {
        return testDataDir;
      }
      return path.join(...args);
    });

    tracker = new SpendTracker();
  });

  afterEach(() => {
    // Clean up test data
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
    jest.restoreAllMocks();
  });

  test('initializes with default stats', () => {
    const stats = tracker.getStats();
    expect(stats.total_requests).toBe(0);
    expect(stats.total_spend_usdc).toBe(0);
  });

  test('allows spending within limits', () => {
    const result = tracker.canSpend(0.01);
    expect(result.allowed).toBe(true);
  });

  test('blocks spending over per-request cap', () => {
    const result = tracker.canSpend(1.0); // Over 0.02 default cap
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('per-request cap');
  });

  test('records spending correctly', () => {
    tracker.recordSpending('gemini', 0.01, false);
    
    const stats = tracker.getStats();
    expect(stats.total_requests).toBe(1);
    expect(stats.total_spend_usdc).toBe(0.01);
    expect(stats.spend_by_provider['gemini']).toBe(0.01);
  });

  test('tracks escalations', () => {
    tracker.recordSpending('gemini', 0.01, false);
    tracker.recordSpending('claude', 0.02, true);
    
    const stats = tracker.getStats();
    expect(stats.escalation_count).toBe(1);
  });
});
