# API Endpoints Documentation

## Base URL

```
http://localhost:3000
```

## Overview

The Micro Chatbot Service provides RESTful APIs for managing conversations and messages.

---

## Conversations

### Create Conversation

Create a new conversation for a user.

**Endpoint:** `POST /api/conversations`

**Request Body:**
```json
{
  "userId": "string (required)",
  "metadata": {
    "source": "string (optional)",
    "customField": "any (optional)"
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "string",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp",
  "metadata": {
    "source": "string"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "metadata": {
      "source": "web-app",
      "department": "support"
    }
  }'
```

---

### Get All Conversations

Retrieve all conversations for a specific user.

**Endpoint:** `GET /api/conversations?userId={userId}`

**Query Parameters:**
- `userId` (required): The user ID to filter conversations
- `limit` (optional): Number of conversations to return (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response:** `200 OK`
```json
{
  "conversations": [
    {
      "id": "uuid",
      "userId": "string",
      "createdAt": "ISO8601 timestamp",
      "updatedAt": "ISO8601 timestamp",
      "metadata": {},
      "messageCount": 0
    }
  ],
  "total": 10,
  "limit": 50,
  "offset": 0
}
```

**Example:**
```bash
curl http://localhost:3000/api/conversations?userId=user123
```

---

### Get Conversation by ID

Retrieve a specific conversation with its details.

**Endpoint:** `GET /api/conversations/:id`

**Path Parameters:**
- `id` (required): The conversation UUID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "string",
  "createdAt": "ISO8601 timestamp",
  "updatedAt": "ISO8601 timestamp",
  "metadata": {},
  "messages": [
    {
      "id": "uuid",
      "role": "user|assistant",
      "content": "string",
      "createdAt": "ISO8601 timestamp"
    }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/api/conversations/550e8400-e29b-41d4-a716-446655440000
```

---

### Delete Conversation

Delete a conversation and all its messages.

**Endpoint:** `DELETE /api/conversations/:id`

**Path Parameters:**
- `id` (required): The conversation UUID

**Response:** `204 No Content`

**Example:**
```bash
curl -X DELETE http://localhost:3000/api/conversations/550e8400-e29b-41d4-a716-446655440000
```

---

## Messages

### Send Message

Send a message in a conversation and get an AI response.

**Endpoint:** `POST /api/conversations/:conversationId/messages`

**Path Parameters:**
- `conversationId` (required): The conversation UUID

**Request Body:**
```json
{
  "content": "string (required)",
  "metadata": {
    "customField": "any (optional)"
  }
}
```

**Response:** `201 Created`
```json
{
  "userMessage": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "user",
    "content": "string",
    "createdAt": "ISO8601 timestamp"
  },
  "assistantMessage": {
    "id": "uuid",
    "conversationId": "uuid",
    "role": "assistant",
    "content": "string",
    "createdAt": "ISO8601 timestamp"
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/conversations/550e8400-e29b-41d4-a716-446655440000/messages \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What is the weather today?"
  }'
```

---

### Get All Messages

Retrieve all messages in a conversation.

**Endpoint:** `GET /api/conversations/:conversationId/messages`

**Path Parameters:**
- `conversationId` (required): The conversation UUID

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)
- `order` (optional): Sort order, `asc` or `desc` (default: asc)

**Response:** `200 OK`
```json
{
  "messages": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "role": "user|assistant",
      "content": "string",
      "createdAt": "ISO8601 timestamp"
    }
  ],
  "total": 20,
  "limit": 100,
  "offset": 0
}
```

**Example:**
```bash
curl http://localhost:3000/api/conversations/550e8400-e29b-41d4-a716-446655440000/messages?limit=10
```

---

### Get Message by ID

Retrieve a specific message.

**Endpoint:** `GET /api/messages/:id`

**Path Parameters:**
- `id` (required): The message UUID

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "conversationId": "uuid",
  "role": "user|assistant",
  "content": "string",
  "createdAt": "ISO8601 timestamp",
  "metadata": {}
}
```

**Example:**
```bash
curl http://localhost:3000/api/messages/660e8400-e29b-41d4-a716-446655440000
```

---

## Health & Status

### Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "ISO8601 timestamp",
  "uptime": 3600,
  "service": "micro-chatbot"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### Database Health Check

Check database connectivity.

**Endpoint:** `GET /health/db`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "database": "connected",
  "latency": 5
}
```

**Example:**
```bash
curl http://localhost:3000/health/db
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Timestamp when limit resets

**Example Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1633024800
```

---

## Authentication

Currently, the API does not require authentication. For production deployments, consider implementing:

- API Keys
- JWT Tokens
- OAuth 2.0

**Example with API Key (Future Implementation):**
```bash
curl -H "X-API-Key: your-api-key" \
  http://localhost:3000/api/conversations
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit`: Number of items to return (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

**Response includes:**
```json
{
  "data": [],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

## Filtering & Sorting

### Conversations
- Filter by `userId`
- Sort by `createdAt` (default: desc)

### Messages
- Filter by `conversationId`
- Filter by `role` (user/assistant)
- Sort by `createdAt` (default: asc)

**Example:**
```bash
# Get user messages only
curl "http://localhost:3000/api/conversations/550e8400/messages?role=user"

# Get latest conversations first
curl "http://localhost:3000/api/conversations?userId=user123&order=desc"
```

---

## WebSocket Support (Future)

Future versions may include WebSocket support for real-time messaging:

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');

ws.on('open', () => {
  ws.send(JSON.stringify({
    type: 'join',
    conversationId: '550e8400-e29b-41d4-a716-446655440000'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Received:', message);
});
```

---

## CORS

The service supports CORS for browser-based applications:

**Allowed Origins:** `*` (configure in production)
**Allowed Methods:** GET, POST, PUT, DELETE, OPTIONS
**Allowed Headers:** Content-Type, Authorization

---

## Request/Response Format

### Content Type
All requests and responses use `application/json`.

### Timestamps
All timestamps are in ISO 8601 format: `2025-10-04T12:00:00.000Z`

### UUIDs
All IDs are UUIDv4 format: `550e8400-e29b-41d4-a716-446655440000`

---

## API Versioning

Current version: `v1` (implicit)

Future versions will be prefixed:
- `/api/v1/conversations`
- `/api/v2/conversations`

---

## Rate Limit Response

When rate limit is exceeded:

**Response:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

For error codes and detailed error responses, see [Error Response Codes](./ERROR_CODES.md).
