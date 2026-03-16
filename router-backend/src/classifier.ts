import { TaskType, QualityTier, ClassificationResult } from '@agentic-commerce/shared';

/**
 * Classifies a prompt into task type and derives quality requirements.
 * Uses keyword matching and heuristics as a lightweight baseline classifier.
 */
export function classifyPrompt(prompt: string): ClassificationResult {
  const lower = prompt.toLowerCase();
  const tokenEstimate = estimateTokens(prompt);
  
  // Math detection
  if (isMathPrompt(lower)) {
    return {
      task_type: 'trivial_math',
      estimated_tokens: tokenEstimate,
      requires_quality: 'cheap'
    };
  }
  
  // Code detection
  if (isCodePrompt(lower)) {
    return {
      task_type: 'code',
      estimated_tokens: tokenEstimate,
      requires_quality: 'balanced'
    };
  }
  
  // Reasoning detection
  if (isReasoningPrompt(lower)) {
    return {
      task_type: 'reasoning',
      estimated_tokens: tokenEstimate,
      requires_quality: 'premium'
    };
  }
  
  // Writing detection
  if (isWritingPrompt(lower)) {
    return {
      task_type: 'writing',
      estimated_tokens: tokenEstimate,
      requires_quality: 'balanced'
    };
  }
  
  // Summarization detection
  if (isSummarizationPrompt(lower)) {
    return {
      task_type: 'summarization',
      estimated_tokens: tokenEstimate,
      requires_quality: 'balanced'
    };
  }
  
  // Short QA detection
  if (isShortQA(lower, tokenEstimate)) {
    return {
      task_type: 'short_qa',
      estimated_tokens: tokenEstimate,
      requires_quality: 'cheap'
    };
  }
  
  // Default
  return {
    task_type: 'other',
    estimated_tokens: tokenEstimate,
    requires_quality: 'balanced'
  };
}

function isMathPrompt(text: string): boolean {
  const mathKeywords = ['calculate', 'compute', 'solve', 'what is', 'how much'];
  const hasMathKeyword = mathKeywords.some(kw => text.includes(kw));
  const hasMathSymbols = /[\+\-\*\/\=\d]/.test(text);
  return hasMathKeyword && hasMathSymbols;
}

function isCodePrompt(text: string): boolean {
  // Programming language and technology indicators
  const techKeywords = ['typescript', 'javascript', 'python', 'java', 'react', 'tsx', 'jsx', 'html', 'css', 'sql', 'api', 'node', 'express', 'flask', 'django', 'component', 'hook', 'redux', 'vue', 'angular', 'pine script', 'pinescript'];

  // Code-related terms
  const codeKeywords = ['function', 'class', 'write code', 'write a program', 'implement', 'algorithm', 'debug', 'script', 'code snippet', 'programming'];

  // Common code requests (these override generic "write")
  const codePatterns = ['auth flow', 'authentication', 'login page', 'login form', 'signup', 'database', 'backend', 'frontend', 'full-stack', 'endpoint', 'route', 'controller', 'model', 'view', 'middleware', 'handler', 'service'];

  return techKeywords.some(kw => text.includes(kw)) ||
         codeKeywords.some(kw => text.includes(kw)) ||
         codePatterns.some(kw => text.includes(kw));
}

function isReasoningPrompt(text: string): boolean {
  const reasoningKeywords = [
    'why', 'reason', 'logic', 'analyze', 'compare', 'evaluate', 'deduce', 'implications', 'consequences'
  ];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasComplexStructure = wordCount >= 10;

  // Exclude summarization prompts, but allow explanation-style reasoning requests.
  const isSummarization = text.includes('summarize') || text.includes('summary');

  return reasoningKeywords.some(kw => text.includes(kw)) && hasComplexStructure && !isSummarization;
}

function isWritingPrompt(text: string): boolean {
  // Content writing indicators
  const writingKeywords = ['essay', 'article', 'story', 'blog', 'email', 'letter', 'report', 'paragraph', 'poem', 'novel', 'chapter'];

  // Generic "write" but only if not code-related
  const hasGenericWrite = text.includes('write') || text.includes('compose') || text.includes('draft');

  // Check for code-related terms that would indicate it's NOT content writing
  const codeIndicators = ['typescript', 'javascript', 'python', 'tsx', 'jsx', 'code', 'function', 'script', 'program', 'auth', 'login', 'api', 'component', 'algorithm'];
  const isCodeRelated = codeIndicators.some(kw => text.includes(kw));

  return writingKeywords.some(kw => text.includes(kw)) ||
         (hasGenericWrite && !isCodeRelated);
}

function isSummarizationPrompt(text: string): boolean {
  const summaryKeywords = ['summarize', 'summary', 'tldr', 'key points', 'main ideas'];
  return summaryKeywords.some(kw => text.includes(kw));
}

function isShortQA(text: string, tokens: number): boolean {
  const hasQuestion = text.includes('?');
  const isShort = tokens < 50;
  return hasQuestion && isShort;
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4);
}
