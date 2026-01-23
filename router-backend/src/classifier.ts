import { TaskType, QualityTier, ClassificationResult } from '@agentic-router/shared';

/**
 * Classifies a prompt into task type and derives quality requirements.
 * Uses keyword matching and heuristics for MVP.
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
  const codeKeywords = ['function', 'class', 'code', 'program', 'implement', 'algorithm', 'debug', 'write a script'];
  return codeKeywords.some(kw => text.includes(kw));
}

function isReasoningPrompt(text: string): boolean {
  const reasoningKeywords = [
    'why', 'explain', 'reason', 'logic', 'analyze', 'compare', 'evaluate', 'deduce', 'implications', 'consequences'
  ];
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const hasComplexStructure = wordCount >= 10;
  return reasoningKeywords.some(kw => text.includes(kw)) && hasComplexStructure;
}

function isWritingPrompt(text: string): boolean {
  const writingKeywords = ['write', 'compose', 'draft', 'essay', 'article', 'story', 'blog', 'email'];
  return writingKeywords.some(kw => text.includes(kw));
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
