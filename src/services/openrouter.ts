import { DEFAULT_SYSTEM_INSTRUCTION } from '../prompts/system-instructions';
import { logger } from '../utils/logger';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export class OpenRouterService {
  private config: OpenRouterConfig;

  constructor() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    const model = process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo';

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is not set');
    }

    this.config = {
      apiKey,
      baseUrl,
      model,
    };

    logger.info('OpenRouter service initialized', { model: this.config.model });
  }

  /**
   * Build system message with instructions and context
   */
  private buildSystemMessage(conversationContext?: any): string {
    const instruction = DEFAULT_SYSTEM_INSTRUCTION;
    
    return `${instruction.instruction}

PERSONALITY DETAILS:
${JSON.stringify(instruction.personality, null, 2)}

CONVERSATION RULES:
${instruction.rules.map(rule => `- ${rule}`).join('\n')}

CURRENT CONTEXT:
- Service: Customer Support System
- Timestamp: ${new Date().toISOString()}
${conversationContext ? `- Context: ${JSON.stringify(conversationContext)}` : ''}
`;
  }

  /**
   * Send message to OpenRouter API
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    context?: any
  ): Promise<string> {
    try {
      const systemMessage = this.buildSystemMessage(context);
      
      const messages: ChatMessage[] = [
        { role: 'system', content: systemMessage },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      logger.debug('Sending request to OpenRouter', {
        model: this.config.model,
        messageCount: messages.length,
      });

      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // Optional: for OpenRouter analytics
          'X-Title': 'Chatbot Microservice', // Optional: for OpenRouter analytics
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('OpenRouter API error', {
          status: response.status,
          error: errorText,
        });
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data: OpenRouterResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenRouter API');
      }

      const assistantMessage = data.choices[0].message.content;

      logger.info('Received response from OpenRouter', {
        model: data.model,
        tokens: data.usage?.total_tokens,
      });

      return assistantMessage;
    } catch (error) {
      logger.error('Error in OpenRouter service', error);
      throw error;
    }
  }

  /**
   * Get current model being used
   */
  getModel(): string {
    return this.config.model;
  }
}

// Export singleton instance
export const openRouterService = new OpenRouterService();

