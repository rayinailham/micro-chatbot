# Error Response Codes

## Overview

This document describes all error codes and responses returned by the Micro Chatbot Service API.

---

## HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 204 | No Content - Request succeeded with no response body |
| 400 | Bad Request - Invalid request format or parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource conflict |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |
| 502 | Bad Gateway - Upstream service error |
| 503 | Service Unavailable - Service temporarily unavailable |
| 504 | Gateway Timeout - Upstream service timeout |

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": "ErrorType",
  "message": "Human-readable error description",
  "statusCode": 400,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations",
  "requestId": "req-uuid-here",
  "details": {
    "field": "Additional context about the error"
  }
}
```

---

## Client Errors (4xx)

### 400 Bad Request

Invalid request format or missing required parameters.

**Example: Missing Required Field**
```json
{
  "error": "BadRequest",
  "message": "Validation failed",
  "statusCode": 400,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations",
  "details": {
    "userId": "userId is required"
  }
}
```

**Common Causes:**
- Missing required fields
- Invalid JSON format
- Invalid data types
- Malformed request body

**Example Request:**
```bash
# Missing userId
curl -X POST http://localhost:3000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 401 Unauthorized

Authentication is required but not provided or invalid.

**Example:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "statusCode": 401,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations"
}
```

**Common Causes:**
- Missing authentication token
- Invalid API key
- Expired JWT token
- Invalid credentials

**Example Request:**
```bash
# Missing API key (when auth is enabled)
curl http://localhost:3000/api/conversations
```

---

### 403 Forbidden

Authenticated but insufficient permissions.

**Example:**
```json
{
  "error": "Forbidden",
  "message": "Access denied to this resource",
  "statusCode": 403,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400",
  "details": {
    "reason": "You don't have permission to access this conversation"
  }
}
```

**Common Causes:**
- Accessing another user's conversation
- Insufficient role permissions
- API key lacks required scopes

---

### 404 Not Found

The requested resource does not exist.

**Example: Conversation Not Found**
```json
{
  "error": "NotFound",
  "message": "Conversation not found",
  "statusCode": 404,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/invalid-uuid",
  "details": {
    "conversationId": "invalid-uuid"
  }
}
```

**Example: Message Not Found**
```json
{
  "error": "NotFound",
  "message": "Message not found",
  "statusCode": 404,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/messages/invalid-uuid",
  "details": {
    "messageId": "invalid-uuid"
  }
}
```

**Common Causes:**
- Invalid UUID format
- Resource deleted
- Typo in URL
- Resource never existed

**Example Request:**
```bash
curl http://localhost:3000/api/conversations/non-existent-id
```

---

### 409 Conflict

Request conflicts with current state of the resource.

**Example: Duplicate Conversation**
```json
{
  "error": "Conflict",
  "message": "Active conversation already exists for this user",
  "statusCode": 409,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations",
  "details": {
    "existingConversationId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Common Causes:**
- Duplicate resource creation
- Concurrent modification
- Business rule violation

---

### 422 Unprocessable Entity

Request is well-formed but contains semantic errors.

**Example: Invalid Message Content**
```json
{
  "error": "UnprocessableEntity",
  "message": "Validation failed",
  "statusCode": 422,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400/messages",
  "details": {
    "content": "Message content cannot be empty",
    "maxLength": "Message exceeds maximum length of 4096 characters"
  }
}
```

**Common Causes:**
- Content too long/short
- Invalid format
- Business logic validation failure
- Invalid enum value

**Example Request:**
```bash
# Empty message content
curl -X POST http://localhost:3000/api/conversations/550e8400/messages \
  -H "Content-Type: application/json" \
  -d '{"content": ""}'
```

---

### 429 Too Many Requests

Rate limit exceeded.

**Example:**
```json
{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded",
  "statusCode": 429,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations",
  "details": {
    "limit": 100,
    "window": "1 minute",
    "retryAfter": 45
  }
}
```

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1633024800
Retry-After: 45
```

**Common Causes:**
- Too many requests in short time
- Aggressive retry logic
- Missing exponential backoff

---

## Server Errors (5xx)

### 500 Internal Server Error

Unexpected server error occurred.

**Example:**
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred",
  "statusCode": 500,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400/messages",
  "requestId": "req-abc-123"
}
```

**Common Causes:**
- Unhandled exception
- Database connection failure
- External service error
- Bug in application code

**Note:** In production, detailed error messages are hidden for security.

---

### 502 Bad Gateway

Error from upstream service (OpenRouter AI).

**Example:**
```json
{
  "error": "BadGateway",
  "message": "AI service returned an error",
  "statusCode": 502,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400/messages",
  "details": {
    "service": "OpenRouter",
    "reason": "Model temporarily unavailable"
  }
}
```

**Common Causes:**
- OpenRouter API error
- Invalid API key
- Model not available
- Upstream service down

---

### 503 Service Unavailable

Service is temporarily unavailable.

**Example:**
```json
{
  "error": "ServiceUnavailable",
  "message": "Service is temporarily unavailable",
  "statusCode": 503,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations",
  "details": {
    "reason": "Database connection pool exhausted",
    "retryAfter": 30
  }
}
```

**Response Headers:**
```
Retry-After: 30
```

**Common Causes:**
- Database maintenance
- Service overload
- Deployment in progress
- Health check failure

---

### 504 Gateway Timeout

Upstream service timeout.

**Example:**
```json
{
  "error": "GatewayTimeout",
  "message": "Request to AI service timed out",
  "statusCode": 504,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400/messages",
  "details": {
    "service": "OpenRouter",
    "timeout": 30000
  }
}
```

**Common Causes:**
- AI model response too slow
- Network issues
- Upstream service overload
- Complex prompt processing

---

## Validation Errors

### Field-Specific Validation

**Example: Multiple Field Errors**
```json
{
  "error": "ValidationError",
  "message": "Multiple validation errors",
  "statusCode": 422,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations",
  "details": {
    "userId": [
      "userId is required",
      "userId must be a string"
    ],
    "metadata": [
      "metadata must be an object"
    ]
  }
}
```

### Common Validation Rules

| Field | Rules |
|-------|-------|
| userId | Required, string, 1-255 characters |
| content | Required, string, 1-4096 characters |
| metadata | Optional, object, max 10 fields |
| conversationId | Required, valid UUID v4 |
| messageId | Required, valid UUID v4 |

---

## Database Errors

### Connection Errors

**Example:**
```json
{
  "error": "DatabaseError",
  "message": "Database connection failed",
  "statusCode": 503,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations",
  "details": {
    "reason": "Connection pool exhausted"
  }
}
```

### Query Errors

**Example:**
```json
{
  "error": "DatabaseError",
  "message": "Database query failed",
  "statusCode": 500,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400",
  "requestId": "req-abc-123"
}
```

---

## AI Service Errors

### API Key Invalid

**Example:**
```json
{
  "error": "AIServiceError",
  "message": "AI service authentication failed",
  "statusCode": 502,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400/messages",
  "details": {
    "service": "OpenRouter",
    "reason": "Invalid API key"
  }
}
```

### Quota Exceeded

**Example:**
```json
{
  "error": "AIServiceError",
  "message": "AI service quota exceeded",
  "statusCode": 429,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400/messages",
  "details": {
    "service": "OpenRouter",
    "reason": "Monthly quota exceeded",
    "resetDate": "2025-11-01T00:00:00.000Z"
  }
}
```

### Content Policy Violation

**Example:**
```json
{
  "error": "AIServiceError",
  "message": "Content violates AI service policies",
  "statusCode": 400,
  "timestamp": "2025-10-04T12:00:00.000Z",
  "path": "/api/conversations/550e8400/messages",
  "details": {
    "service": "OpenRouter",
    "reason": "Content filtered by safety system"
  }
}
```

---

## Error Handling Best Practices

### Client Implementation

```javascript
async function sendMessage(conversationId, content) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      
      switch (error.statusCode) {
        case 400:
        case 422:
          console.error('Validation error:', error.details);
          break;
        case 404:
          console.error('Conversation not found');
          break;
        case 429:
          console.error('Rate limited, retry after:', error.details.retryAfter);
          break;
        case 500:
        case 502:
        case 503:
          console.error('Server error, retrying...');
          // Implement retry logic
          break;
        default:
          console.error('Unexpected error:', error);
      }
      
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}
```

### Retry Strategy

```javascript
async function withRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const shouldRetry = [500, 502, 503, 504].includes(error.statusCode);
      
      if (!shouldRetry || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Logging & Monitoring

All errors include a `requestId` for tracking:

```json
{
  "error": "InternalServerError",
  "requestId": "req-550e8400-e29b-41d4-a716-446655440000"
}
```

Use this ID to:
- Search logs
- Track request flow
- Debug issues
- Report bugs

---

## Support

If you encounter persistent errors:

1. Check the [API Endpoints Documentation](./API_ENDPOINTS.md)
2. Verify your request format
3. Check service status
4. Review logs with requestId
5. Contact support with requestId

---

## Error Code Summary

| Code | Error Type | Retry? | Action |
|------|------------|--------|--------|
| 400 | Bad Request | No | Fix request format |
| 401 | Unauthorized | No | Add authentication |
| 403 | Forbidden | No | Check permissions |
| 404 | Not Found | No | Verify resource ID |
| 409 | Conflict | No | Handle conflict |
| 422 | Validation Error | No | Fix validation issues |
| 429 | Rate Limited | Yes | Wait and retry |
| 500 | Server Error | Yes | Retry with backoff |
| 502 | Bad Gateway | Yes | Retry with backoff |
| 503 | Unavailable | Yes | Wait longer, then retry |
| 504 | Timeout | Yes | Retry with backoff |
