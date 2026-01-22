import { VerificationService } from '../src/verifier';

describe('VerificationService', () => {
  let verifier: VerificationService;

  beforeEach(() => {
    verifier = new VerificationService();
  });

  describe('Math verification', () => {
    test('passes for numerical answers', () => {
      const result = verifier.verify(
        'Calculate 2 + 2',
        'The answer is 4.',
        'trivial_math'
      );
      expect(result.passed).toBe(true);
    });

    test('fails for non-numerical responses', () => {
      const result = verifier.verify(
        'Calculate 2 + 2',
        'I cannot solve this problem.',
        'trivial_math'
      );
      expect(result.passed).toBe(false);
    });
  });

  describe('Code verification', () => {
    test('passes for code-like content', () => {
      const result = verifier.verify(
        'Write a function',
        'function test() { return true; }',
        'code'
      );
      expect(result.passed).toBe(true);
    });

    test('fails for short or non-code responses', () => {
      const result = verifier.verify(
        'Write a function',
        'I cannot help.',
        'code'
      );
      expect(result.passed).toBe(false);
    });
  });

  describe('Generic verification', () => {
    test('passes for reasonable length responses', () => {
      const result = verifier.verify(
        'Tell me about AI',
        'AI is artificial intelligence, which includes machine learning.',
        'other'
      );
      expect(result.passed).toBe(true);
    });

    test('fails for very short responses', () => {
      const result = verifier.verify(
        'Tell me about AI',
        'No.',
        'other'
      );
      expect(result.passed).toBe(false);
    });
  });
});
