import axios from 'axios';
import { ProviderQuote, CompletionRequest, CompletionResponse } from '@agentic-commerce/shared';
import { config } from './config';

/**
 * ProviderClient communicates with provider wrapper services
 */
export class ProviderClient {
  /**
   * Fetch quotes from all available providers
   */
  async fetchQuotes(): Promise<ProviderQuote[]> {
    const quotes: ProviderQuote[] = [];

    // Fetch from Gemini provider
    try {
      const geminiQuote = await this.fetchProviderQuote(
        config.providers.gemini.url,
        'gemini'
      );
      quotes.push(geminiQuote);
    } catch (error) {
      console.warn('Failed to fetch Gemini quote:', error);
    }

    // Fetch from Claude provider
    try {
      const claudeQuote = await this.fetchProviderQuote(
        config.providers.claude.url,
        'claude'
      );
      quotes.push(claudeQuote);
    } catch (error) {
      console.warn('Failed to fetch Claude quote:', error);
    }

    // Fetch from OpenAI provider
    try {
      const openaiQuote = await this.fetchProviderQuote(
        config.providers.openai.url,
        'openai'
      );
      quotes.push(openaiQuote);
    } catch (error) {
      console.warn('Failed to fetch OpenAI quote:', error);
    }

    return quotes;
  }
  
  /**
   * Fetch quote from a specific provider
   */
  private async fetchProviderQuote(
    providerUrl: string,
    providerId: string
  ): Promise<ProviderQuote> {
    const response = await axios.get<ProviderQuote>(
      `${providerUrl}/quote`,
      { timeout: 5000 }
    );
    return response.data;
  }
  
  /**
   * Request completion from provider
   */
  async requestCompletion(
    providerUrl: string,
    request: CompletionRequest
  ): Promise<CompletionResponse> {
    try {
      const response = await axios.post<CompletionResponse>(
        `${providerUrl}/complete`,
        request,
        { timeout: 30000 }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Provider request failed: ${error.response?.data?.error || error.message}`
        );
      }
      throw error;
    }
  }
}
