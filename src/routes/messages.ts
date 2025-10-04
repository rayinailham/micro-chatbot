import { Elysia, t } from 'elysia';
import { db, conversations, messages } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { openRouterService } from '../services/openrouter';

export const messagesRoutes = new Elysia({ prefix: '/v1/chatbot' })
  // Send message to conversation
  .post(
    '/conversations/:id/messages',
    async ({ params, body }) => {
      try {
        const conversationId = parseInt(params.id);
        
        logger.info('Sending message to conversation', {
          conversationId,
          role: body.role,
        });

        // Verify conversation exists
        const [conversation] = await db
          .select()
          .from(conversations)
          .where(eq(conversations.id, conversationId));

        if (!conversation) {
          return {
            success: false,
            error: 'Conversation not found',
          };
        }

        // Get conversation history
        const conversationHistory = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(messages.createdAt);

        // Add user message
        const [userMessage] = await db
          .insert(messages)
          .values({
            conversationId,
            role: 'user',
            content: body.content,
          })
          .returning();

        // Prepare history for AI
        const chatHistory = conversationHistory.map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }));

        // Get AI response
        const aiResponse = await openRouterService.sendMessage(
          body.content,
          chatHistory,
          {
            conversationId,
            userId: conversation.userId,
          }
        );

        // Save AI response
        const [assistantMessage] = await db
          .insert(messages)
          .values({
            conversationId,
            role: 'assistant',
            content: aiResponse,
          })
          .returning();

        // Update conversation timestamp
        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));

        return {
          success: true,
          data: {
            userMessage,
            assistantMessage,
          },
        };
      } catch (error) {
        logger.error('Error sending message', error);
        throw error;
      }
    },
    {
      body: t.Object({
        content: t.String(),
        role: t.Optional(t.Literal('user')),
      }),
    }
  )

  // Regenerate AI response for a message
  .post('/messages/:id/regenerate', async ({ params }) => {
    try {
      const messageId = parseInt(params.id);
      
      logger.info('Regenerating message', { messageId });

      // Get the message to regenerate
      const [originalMessage] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, messageId));

      if (!originalMessage) {
        return {
          success: false,
          error: 'Message not found',
        };
      }

      if (originalMessage.role !== 'assistant') {
        return {
          success: false,
          error: 'Can only regenerate assistant messages',
        };
      }

      // Get conversation
      const [conversation] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, originalMessage.conversationId));

      if (!conversation) {
        return {
          success: false,
          error: 'Conversation not found',
        };
      }

      // Get conversation history up to the message before this one
      const conversationHistory = await db
        .select()
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, originalMessage.conversationId),
            // Get messages created before the original message
          )
        )
        .orderBy(messages.createdAt);

      // Filter to get only messages before the original
      const historyBeforeMessage = conversationHistory.filter(
        (msg) => msg.createdAt < originalMessage.createdAt
      );

      // Find the last user message
      const lastUserMessage = [...historyBeforeMessage]
        .reverse()
        .find((msg) => msg.role === 'user');

      if (!lastUserMessage) {
        return {
          success: false,
          error: 'No user message found to regenerate from',
        };
      }

      // Prepare history for AI (exclude the original assistant message)
      const chatHistory = historyBeforeMessage
        .filter((msg) => msg.id !== originalMessage.id)
        .map((msg) => ({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content,
        }));

      // Get new AI response
      const aiResponse = await openRouterService.sendMessage(
        lastUserMessage.content,
        chatHistory,
        {
          conversationId: originalMessage.conversationId,
          userId: conversation.userId,
          regeneration: true,
        }
      );

      // Create new message with regeneration reference
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId: originalMessage.conversationId,
          role: 'assistant',
          content: aiResponse,
          regeneratedFrom: originalMessage.id,
        })
        .returning();

      return {
        success: true,
        data: {
          originalMessage,
          newMessage,
        },
      };
    } catch (error) {
      logger.error('Error regenerating message', error);
      throw error;
    }
  });

