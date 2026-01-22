import { classifyPrompt } from '../src/classifier';

describe('Classifier', () => {
  test('identifies math prompts', () => {
    const result = classifyPrompt('Calculate 2 + 2');
    expect(result.task_type).toBe('trivial_math');
    expect(result.requires_quality).toBe('cheap');
  });

  test('identifies code prompts', () => {
    const result = classifyPrompt('Write a function to sort an array');
    expect(result.task_type).toBe('code');
    expect(result.requires_quality).toBe('balanced');
  });

  test('identifies reasoning prompts', () => {
    const result = classifyPrompt('Explain why the sky is blue and how light scattering works in the atmosphere');
    expect(result.task_type).toBe('reasoning');
    expect(result.requires_quality).toBe('premium');
  });

  test('estimates tokens', () => {
    const result = classifyPrompt('test');
    expect(result.estimated_tokens).toBeGreaterThan(0);
  });
});
