# Database Schema Documentation

## Overview

The Micro Chatbot Service uses PostgreSQL as its primary database. The schema is managed using Drizzle ORM.

## Database Configuration

**Database Engine:** PostgreSQL 16+
**ORM:** Drizzle ORM
**Migration Tool:** Drizzle Kit

---

## Tables

### 1. `conversations`

Stores conversation sessions between users and the chatbot.

**Table Name:** `conversations`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique conversation identifier |
| `user_id` | VARCHAR(255) | NOT NULL, INDEX | User identifier from external system |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When conversation was created |
| `updated_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| `metadata` | JSONB | DEFAULT '{}' | Additional conversation metadata |

**Indexes:**
- Primary Key: `id`
- Index: `user_id` (for fast user lookup)
- Index: `created_at` (for sorting/filtering)

**SQL Definition:**
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
```

**Example Data:**
```sql
INSERT INTO conversations (id, user_id, metadata) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'user123', '{"source": "web-app", "department": "support"}'),
  ('660e8400-e29b-41d4-a716-446655440001', 'user456', '{"source": "mobile-app", "version": "2.0"}');
```

---

### 2. `messages`

Stores individual messages within conversations.

**Table Name:** `messages`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique message identifier |
| `conversation_id` | UUID | NOT NULL, FOREIGN KEY, INDEX | Reference to conversation |
| `role` | VARCHAR(50) | NOT NULL, CHECK IN ('user', 'assistant', 'system') | Message sender role |
| `content` | TEXT | NOT NULL | Message content |
| `created_at` | TIMESTAMP | NOT NULL, DEFAULT NOW() | When message was created |
| `metadata` | JSONB | DEFAULT '{}' | Additional message metadata |

**Indexes:**
- Primary Key: `id`
- Foreign Key: `conversation_id` → `conversations(id)` ON DELETE CASCADE
- Index: `conversation_id, created_at` (composite for efficient message retrieval)
- Index: `role` (for filtering by role)

**SQL Definition:**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_role ON messages(role);
```

**Example Data:**
```sql
INSERT INTO messages (conversation_id, role, content) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'user', 'Hello, I need help with my order'),
  ('550e8400-e29b-41d4-a716-446655440000', 'assistant', 'Hello! I''d be happy to help you with your order. Could you please provide your order number?'),
  ('550e8400-e29b-41d4-a716-446655440000', 'user', 'My order number is #12345'),
  ('550e8400-e29b-41d4-a716-446655440000', 'assistant', 'Thank you! Let me look up order #12345 for you.');
```

---

## Entity Relationships

```
┌─────────────────┐
│  conversations  │
│─────────────────│
│ id (PK)         │◄──┐
│ user_id         │   │
│ created_at      │   │
│ updated_at      │   │
│ metadata        │   │
└─────────────────┘   │
                      │
                      │ 1:N
                      │
                      │
┌─────────────────┐   │
│    messages     │   │
│─────────────────│   │
│ id (PK)         │   │
│ conversation_id │───┘
│ role            │
│ content         │
│ created_at      │
│ metadata        │
└─────────────────┘
```

**Relationship:**
- One `conversation` can have many `messages` (1:N)
- Cascading delete: When a conversation is deleted, all its messages are automatically deleted

---

## Drizzle Schema Definition

**File:** `src/db/schema.ts`

```typescript
import { pgTable, uuid, varchar, timestamp, text, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  metadata: jsonb('metadata').default(sql`'{}'::jsonb`),
});
```

---

## Metadata Field Usage

The `metadata` JSONB field allows storing flexible additional data without schema changes.

### Conversation Metadata Examples

```json
{
  "source": "web-app",
  "department": "support",
  "priority": "high",
  "language": "en",
  "tags": ["billing", "refund"],
  "sessionId": "sess_abc123"
}
```

### Message Metadata Examples

```json
{
  "tokens": 150,
  "model": "openai/gpt-4",
  "latency": 1250,
  "sentiment": "positive",
  "detected_intent": "order_inquiry"
}
```

---

## Common Queries

### Create a New Conversation

```sql
INSERT INTO conversations (user_id, metadata)
VALUES ('user123', '{"source": "web-app"}'::jsonb)
RETURNING *;
```

### Get All Conversations for a User

```sql
SELECT * FROM conversations
WHERE user_id = 'user123'
ORDER BY created_at DESC
LIMIT 50;
```

### Get Conversation with Messages

```sql
SELECT 
  c.*,
  json_agg(
    json_build_object(
      'id', m.id,
      'role', m.role,
      'content', m.content,
      'createdAt', m.created_at
    ) ORDER BY m.created_at ASC
  ) as messages
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY c.id;
```

### Add Message to Conversation

```sql
INSERT INTO messages (conversation_id, role, content)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'user',
  'What is my order status?'
)
RETURNING *;
```

### Get Recent Messages

```sql
SELECT * FROM messages
WHERE conversation_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC
LIMIT 10;
```

### Delete Old Conversations

```sql
-- Delete conversations older than 90 days
DELETE FROM conversations
WHERE created_at < NOW() - INTERVAL '90 days';

-- Messages are automatically deleted due to CASCADE
```

### Update Conversation Timestamp

```sql
UPDATE conversations
SET updated_at = NOW()
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

### Search Messages by Content

```sql
SELECT m.*, c.user_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.content ILIKE '%order%'
  AND m.role = 'user'
ORDER BY m.created_at DESC
LIMIT 20;
```

### Get Conversation Statistics

```sql
SELECT 
  c.id,
  c.user_id,
  COUNT(m.id) as message_count,
  MIN(m.created_at) as first_message,
  MAX(m.created_at) as last_message
FROM conversations c
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE c.user_id = 'user123'
GROUP BY c.id, c.user_id;
```

---

## Performance Optimization

### Recommended Indexes

```sql
-- Already created in schema
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_role ON messages(role);

-- Additional indexes for production
CREATE INDEX idx_conversations_metadata ON conversations USING gin(metadata);
CREATE INDEX idx_messages_metadata ON messages USING gin(metadata);
CREATE INDEX idx_messages_content_search ON messages USING gin(to_tsvector('english', content));
```

### Query Optimization Tips

1. **Always use indexes** for user_id and conversation_id lookups
2. **Limit results** to avoid scanning large datasets
3. **Use pagination** for large result sets
4. **Avoid SELECT *** on messages table (use specific columns)
5. **Use EXPLAIN ANALYZE** to understand query performance

---

## Backup & Maintenance

### Backup Strategy

```bash
# Daily backup
pg_dump -U postgres -d chatbot > backup_$(date +%Y%m%d).sql

# Compressed backup
pg_dump -U postgres -d chatbot | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# From SQL file
psql -U postgres -d chatbot < backup_20251004.sql

# From compressed file
gunzip -c backup_20251004.sql.gz | psql -U postgres -d chatbot
```

### Maintenance Tasks

```sql
-- Vacuum tables
VACUUM ANALYZE conversations;
VACUUM ANALYZE messages;

-- Reindex tables
REINDEX TABLE conversations;
REINDEX TABLE messages;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Migration Management

### Initialize Database

```bash
# Generate migration
bun run drizzle-kit generate:pg

# Run migrations
bun run drizzle-kit push:pg
```

### Migration Files

Migrations are stored in `drizzle/` directory:
```
drizzle/
  0000_initial_schema.sql
  0001_add_metadata.sql
  0002_add_indexes.sql
```

---

## Data Retention Policy

Recommended retention policies:

| Data Type | Retention Period | Action |
|-----------|------------------|--------|
| Active conversations | Indefinite | Keep |
| Inactive conversations (>90 days) | 90 days | Archive or delete |
| System messages | 30 days | Delete |
| User messages | 90 days | Archive |
| Deleted user data | Immediate | Purge |

**Implementation:**
```sql
-- Archive old conversations
CREATE TABLE conversations_archive AS
SELECT * FROM conversations
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete archived conversations
DELETE FROM conversations
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## Security Considerations

1. **Encryption at Rest:** Enable PostgreSQL encryption
2. **Access Control:** Use role-based access control (RBAC)
3. **Connection Security:** Use SSL/TLS for database connections
4. **Sensitive Data:** Hash or encrypt sensitive metadata
5. **SQL Injection:** Use parameterized queries (Drizzle handles this)
6. **Audit Logging:** Enable PostgreSQL audit logging

**Example Connection String (with SSL):**
```
postgresql://user:password@host:5432/chatbot?sslmode=require
```

---

## Scaling Considerations

### Vertical Scaling
- Increase PostgreSQL memory and CPU
- Optimize connection pooling
- Use read replicas for read-heavy workloads

### Horizontal Scaling
- Implement database sharding by user_id
- Use connection pooling (PgBouncer)
- Consider read replicas for analytics

### Archival Strategy
```sql
-- Partition by date
CREATE TABLE messages_2025_01 PARTITION OF messages
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE messages_2025_02 PARTITION OF messages
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

---

## Monitoring Queries

### Active Connections
```sql
SELECT count(*) FROM pg_stat_activity;
```

### Slow Queries
```sql
SELECT pid, now() - query_start as duration, query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - query_start > interval '5 seconds';
```

### Table Statistics
```sql
SELECT schemaname, tablename, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;
```

---

## References

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Schema File](../src/db/schema.ts)
- [Database Configuration](../src/db/index.ts)
