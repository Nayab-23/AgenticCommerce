import { VerificationResult, TaskType } from '@agentic-commerce/shared';

/**
 * Verifies completions to determine if escalation is needed
 */
export class VerificationService {
  /**
   * Verify completion quality
   */
  verify(
    prompt: string,
    completion: string,
    taskType: TaskType
  ): VerificationResult {
    switch (taskType) {
      case 'trivial_math':
        return this.verifyMath(prompt, completion);
      
      case 'code':
        return this.verifyCode(completion);
      
      case 'short_qa':
        return this.verifyShortQA(completion);
      
      default:
        return this.verifyGeneric(completion);
    }
  }
  
  /**
   * Verify math problems by checking for numerical answers
   */
  private verifyMath(prompt: string, completion: string): VerificationResult {
    // Extract expected answer if possible
    const hasNumber = /\d+/.test(completion);
    const hasError = /error|cannot|don't know|unsure/i.test(completion);
    
    if (hasError) {
      return {
        passed: false,
        score: 0,
        reason: 'Completion indicates inability to solve the problem'
      };
    }
    
    if (!hasNumber) {
      return {
        passed: false,
        score: 0.3,
        reason: 'No numerical answer found in completion'
      };
    }
    
    return {
      passed: true,
      score: 1.0,
      reason: 'Contains numerical answer'
    };
  }
  
  /**
   * Verify code by checking for code-like patterns
   */
  private verifyCode(completion: string): VerificationResult {
    const hasCodeBlock = /```|function|class|def |import |const |let |var /.test(completion);
    const minLength = completion.length > 30;
    
    if (!hasCodeBlock || !minLength) {
      return {
        passed: false,
        score: 0.4,
        reason: 'Completion does not appear to contain valid code'
      };
    }
    
    return {
      passed: true,
      score: 0.9,
      reason: 'Contains code-like structure'
    };
  }
  
  /**
   * Verify short QA by checking for reasonable response
   */
  private verifyShortQA(completion: string): VerificationResult {
    const tooShort = completion.length < 10;
    const hasError = /error|cannot|don't know|unsure/i.test(completion);
    
    if (tooShort || hasError) {
      return {
        passed: false,
        score: 0.2,
        reason: 'Response is too short or indicates inability to answer'
      };
    }
    
    return {
      passed: true,
      score: 0.8,
      reason: 'Response appears reasonable'
    };
  }
  
  /**
   * Generic verification tuned for baseline local routing experiments.
   */
  private verifyGeneric(completion: string): VerificationResult {
    const minLength = completion.length > 20;
    
    if (!minLength) {
      return {
        passed: false,
        score: 0.3,
        reason: 'Response is too short'
      };
    }
    
    return {
      passed: true,
      score: 0.7,
      reason: 'Response meets minimum length requirement'
    };
  }
}
