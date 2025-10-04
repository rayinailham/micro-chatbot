import { Elysia, t } from 'elysia';
import { db, conversations, messages } from '../db';
import { eq, desc, and } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { openRouterService } from '../services/openrouter';

export const conversationsRoutes = new Elysia({ prefix: '/v1/chatbot/conversations' })
  // Create new conversation
  .post(
    '/',
    async ({ body }) => {
      try {
        logger.info('Creating new conversation', { userId: body.user_id });

        // Create conversation
        const [conversation] = await db
          .insert(conversations)
          .values({
            userId: body.user_id,
            title: body.title || 'New Conversation',
            systemPrompt: body.system_prompt,
          })
          .returning();

        // If initial message is provided, add it and get AI response
        if (body.initial_message) {
          // Add user message
          const [userMessage] = await db
            .insert(messages)
            .values({
              conversationId: conversation.id,
              role: 'user',
              content: body.initial_message,
            })
            .returning();

          // Get AI response
          const aiResponse = await openRouterService.sendMessage(
            body.initial_message,
            [],
            { conversationId: conversation.id }
          );

          // Save AI response
          const [assistantMessage] = await db
            .insert(messages)
            .values({
              conversationId: conversation.id,
              role: 'assistant',
              content: aiResponse,
            })
            .returning();

          return {
            success: true,
            data: {
              conversation,
              messages: [userMessage, assistantMessage],
            },
          };
        }

        return {
          success: true,
          data: { conversation },
        };
      } catch (error) {
        logger.error('Error creating conversation', error);
        throw error;
      }
    },
    {
      body: t.Object({
        user_id: t.String(),
        title: t.Optional(t.String()),
        system_prompt: t.Optional(t.String()),
        initial_message: t.Optional(t.String()),
      }),
    }
  )

  // Get all conversations for a user
  .get(
    '/',
    async ({ query }) => {
      try {
        const userId = query.user_id;
        
        if (!userId) {
          return {
            success: false,
            error: 'user_id query parameter is required',
          };
        }

        logger.info('Fetching conversations', { userId });

        const userConversations = await db
          .select()
          .from(conversations)
          .where(
            and(
              eq(conversations.userId, userId),
              eq(conversations.archived, false)
            )
          )
          .orderBy(desc(conversations.updatedAt));

        return {
          success: true,
          data: userConversations,
        };
      } catch (error) {
        logger.error('Error fetching conversations', error);
        throw error;
      }
    },
    {
      query: t.Object({
        user_id: t.String(),
      }),
    }
  )

  // Get conversation by ID with messages
  .get(
    '/:id',
    async ({ params }) => {
      try {
        const conversationId = parseInt(params.id);
        
        logger.info('Fetching conversation', { conversationId });

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

        const conversationMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(messages.createdAt);

        return {
          success: true,
          data: {
            conversation,
            messages: conversationMessages,
          },
        };
      } catch (error) {
        logger.error('Error fetching conversation', error);
        throw error;
      }
    }
  )

  // Update conversation
  .patch(
    '/:id',
    async ({ params, body }) => {
      try {
        const conversationId = parseInt(params.id);
        
        logger.info('Updating conversation', { conversationId, updates: body });

        const [updatedConversation] = await db
          .update(conversations)
          .set({
            ...body,
            updatedAt: new Date(),
          })
          .where(eq(conversations.id, conversationId))
          .returning();

        if (!updatedConversation) {
          return {
            success: false,
            error: 'Conversation not found',
          };
        }

        return {
          success: true,
          data: updatedConversation,
        };
      } catch (error) {
        logger.error('Error updating conversation', error);
        throw error;
      }
    },
    {
      body: t.Object({
        title: t.Optional(t.String()),
        archived: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete conversation
  .delete('/:id', async ({ params }) => {
    try {
      const conversationId = parseInt(params.id);
      
      logger.info('Deleting conversation', { conversationId });

      await db
        .delete(conversations)
        .where(eq(conversations.id, conversationId));

      return {
        success: true,
        message: 'Conversation deleted successfully',
      };
    } catch (error) {
      logger.error('Error deleting conversation', error);
      throw error;
    }
  });

