# Integration Guide

## Overview

This document explains how to integrate the Micro Chatbot Service with other microservices in your ecosystem. The service is designed as a standalone microservice that communicates via RESTful APIs.

## Architecture Pattern

The Micro Chatbot Service follows a standard microservice architecture pattern:

```
┌─────────────────┐
│   API Gateway   │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼──────────┐
│ Auth  │ │   Other     │
│Service│ │  Services   │
└───┬───┘ └──┬──────────┘
    │        │
    └────┬───┘
         │
    ┌────▼────────────┐
    │ Micro Chatbot   │
    │    Service      │
    └────┬────────────┘
         │
    ┌────▼────────┐
    │  PostgreSQL │
    └─────────────┘
```

## Integration Methods

### 1. Direct HTTP Integration

**Concept:** Service langsung berkomunikasi dengan chatbot service melalui HTTP REST API.

**Karakteristik:**
- Paling sederhana dan straightforward
- Synchronous communication
- Cocok untuk aplikasi monolitik atau microservice sederhana
- Menggunakan HTTP client library (axios, fetch, httpx, dll)

**Use Cases:**
- Web applications calling chatbot service
- Mobile backend integration
- Simple microservice architectures

**Requirements:**
- Service URL/hostname chatbot service
- HTTP client library
- Error handling & retry logic

---

### 2. Service Mesh Integration (Kubernetes)

**Concept:** Deployment dalam Kubernetes cluster dengan service mesh untuk service discovery dan load balancing otomatis.

**Karakteristik:**
- Automatic service discovery via DNS
- Built-in load balancing
- Traffic management & routing
- Observability & monitoring
- mTLS security between services

**Use Cases:**
- Large-scale microservices di Kubernetes
- Multi-instance deployment
- High availability requirements

**Requirements:**
- Kubernetes cluster
- Service mesh (Istio, Linkerd, atau Consul)
- Kubernetes Service & Deployment definitions
- Network policies

**Service Discovery:**
- Services dapat diakses via DNS: `micro-chatbot-service.namespace.svc.cluster.local`
- Load balancing otomatis ke multiple pods

---

### 3. API Gateway Integration

**Concept:** Menggunakan API Gateway sebagai single entry point untuk semua microservices.

**Karakteristik:**
- Centralized routing & request handling
- Authentication & authorization di gateway level
- Rate limiting & throttling
- Request/response transformation
- API versioning management

**Use Cases:**
- Public-facing APIs
- Multiple client applications (web, mobile, IoT)
- Centralized security & monitoring
- API composition & aggregation

**Requirements:**
- API Gateway (Kong, AWS API Gateway, Nginx, Traefik)
- Route configuration untuk chatbot endpoints
- Authentication plugins/middleware
- Rate limiting configuration

**Benefits:**
- Single point of entry
- Simplified client integration
- Centralized monitoring & logging

---

### 4. Event-Driven Integration

**Concept:** Asynchronous communication menggunakan message brokers untuk decoupled integration.

**Karakteristik:**
- Asynchronous & non-blocking
- Loose coupling between services
- Event sourcing & CQRS support
- Scalable & resilient
- Eventual consistency

**Use Cases:**
- Long-running chatbot operations
- Notification systems
- Audit logging & analytics
- Background processing
- Multiple consumers untuk same event

**Requirements:**
- Message broker (RabbitMQ, Apache Kafka, AWS SQS/SNS)
- Event schemas & contracts
- Publisher & consumer implementations
- Dead letter queues untuk error handling

**Event Flow:**
1. Service lain publish event (e.g., `chatbot.create-conversation`)
2. Chatbot service consume event dari queue
3. Chatbot service process request
4. Chatbot service publish response event (e.g., `chatbot.conversation-created`)

**Benefits:**
- High scalability
- Fault tolerance
- Temporal decoupling
- Multiple subscribers possible

---

## Authentication & Authorization Strategies

### 1. JWT Token Forwarding

**Concept:** Token authentication dari client diteruskan ke chatbot service untuk validasi.

**Karakteristik:**
- User authentication token di-forward dari calling service
- Chatbot service validate token
- Maintains user context & permissions

**Flow:**
1. User login dan dapat JWT token
2. Client service terima request dengan token
3. Client service forward token ke chatbot service
4. Chatbot service validate & authorize request

---

### 2. Service-to-Service Authentication

**Concept:** Authentication menggunakan API keys atau service tokens khusus untuk inter-service communication.

**Karakteristik:**
- Separate credentials untuk service-to-service calls
- API keys atau service tokens
- Service identity verification
- Tidak bergantung pada user authentication

**Methods:**
- API Keys dalam headers (`X-API-Key`)
- OAuth2 Client Credentials flow
- mTLS (mutual TLS) certificates
- Service mesh built-in authentication

---

### 3. No Authentication (Internal Network)

**Concept:** Tidak ada authentication jika services berjalan dalam trusted internal network.

**Karakteristik:**
- Cocok untuk development/testing
- Network-level security (firewall, VPC)
- Services tidak exposed ke public

**Use Cases:**
- Development environment
- Internal microservices dalam private network
- When using service mesh dengan mTLS

---

## Environment Configuration

**Concept:** Configuration management menggunakan environment variables untuk flexibility dan security.

**Required Configurations:**
- `CHATBOT_SERVICE_URL` - Base URL chatbot service
- `CHATBOT_API_KEY` - Authentication key (jika diperlukan)
- `CHATBOT_TIMEOUT` - Request timeout duration
- `CHATBOT_RETRY_ATTEMPTS` - Number of retry attempts

**Best Practices:**
- Jangan hardcode URLs dalam code
- Gunakan environment variables atau config service
- Different configs untuk dev/staging/production
- Secret management (Vault, AWS Secrets Manager)

---

## Health Checks & Monitoring

**Concept:** Monitoring service availability dan performance untuk reliability.

**Health Check Endpoints:**
- `/health` - Basic service health
- `/health/db` - Database connectivity check
- `/metrics` - Prometheus-style metrics

**Monitoring Aspects:**
1. **Availability** - Service up/down status
2. **Response Time** - API latency
3. **Error Rate** - Failed requests percentage
4. **Database Health** - Connection pool status
5. **Dependencies** - OpenRouter API health

**Tools:**
- Kubernetes liveness & readiness probes
- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Application Performance Monitoring (APM)

---

## Resilience Patterns

### 1. Circuit Breaker Pattern

**Concept:** Mencegah cascading failures dengan "memutus" koneksi saat service down.

**States:**
- **Closed** - Normal operation, requests diproses
- **Open** - Service down, requests langsung fail
- **Half-Open** - Testing recovery, limited requests

**Benefits:**
- Fail fast mechanism
- Prevent resource exhaustion
- Automatic recovery testing

**Implementation:**
- Libraries: Opossum (Node.js), Resilience4j (Java), Polly (.NET)
- Timeout configuration
- Failure threshold settings
- Recovery timeout

---

### 2. Retry Logic

**Concept:** Automatic retry untuk transient failures.

**Strategies:**
- **Immediate Retry** - Langsung retry
- **Fixed Delay** - Tunggu fixed time
- **Exponential Backoff** - Increasing delay (1s, 2s, 4s, 8s)
- **Jitter** - Random delay untuk avoid thundering herd

**Best Practices:**
- Max retry attempts (biasanya 3-5x)
- Only retry idempotent operations
- Exponential backoff with jitter
- Different strategies untuk different errors

---

### 3. Timeout Management

**Concept:** Set maximum wait time untuk prevent hanging requests.

**Timeout Types:**
- **Connection Timeout** - Time to establish connection
- **Request Timeout** - Total request duration
- **Idle Timeout** - Time between data packets

**Recommendations:**
- Connection: 5-10 seconds
- Request: 30 seconds (atau sesuai AI response time)
- Idle: 60 seconds

---

### 4. Rate Limiting

**Concept:** Membatasi jumlah requests untuk protect service dari overload.

**Types:**
- **Fixed Window** - X requests per time window
- **Sliding Window** - Rolling time window
- **Token Bucket** - Token-based rate limiting
- **Leaky Bucket** - Smooth rate limiting

**Implementation Points:**
- Client-side (respect server limits)
- Server-side (protect from abuse)
- Gateway-level (centralized)

---

## Docker Compose Multi-Service Setup

**Concept:** Orchestrasi multiple services dalam satu environment menggunakan Docker Compose.

**Key Components:**
1. **Networks** - Isolated network untuk inter-service communication
2. **Dependencies** - Service startup order dengan `depends_on`
3. **Environment Variables** - Configuration management
4. **Volumes** - Data persistence
5. **Health Checks** - Container health monitoring

**Services Structure:**
- API Gateway (Nginx, Traefik)
- Chatbot Service
- Database (PostgreSQL)
- Other microservices
- Monitoring tools (optional)

---

## Best Practices

### 1. Service Discovery
**Concept:** Jangan hardcode URLs, gunakan dynamic service discovery.
- Environment variables untuk configuration
- DNS-based service discovery (Kubernetes)
- Service registry (Consul, Eureka)

### 2. Error Handling
**Concept:** Graceful degradation saat chatbot service unavailable.
- Implement fallback mechanisms
- Return cached responses jika available
- Inform users tentang temporary unavailability

### 3. Request Tracking
**Concept:** Correlation IDs untuk tracking requests across services.
- Generate unique ID per request
- Pass ID melalui headers (`X-Correlation-ID`)
- Log ID di semua services untuk troubleshooting

### 4. API Versioning
**Concept:** Maintain backward compatibility dengan versioning.
- URL versioning: `/api/v1/conversations`
- Header versioning: `Accept: application/vnd.api+json;version=1`
- Allow gradual migration ke new versions

### 5. Caching Strategy
**Concept:** Cache conversation data untuk improve performance.
- Cache conversation metadata
- Cache recent messages
- Invalidate cache saat update terjadi
- Use Redis atau memcached

### 6. Load Balancing
**Concept:** Distribute traffic across multiple instances.
- Round-robin distribution
- Least connections algorithm
- Health-check based routing
- Session affinity jika diperlukan

### 7. Monitoring & Observability
**Concept:** Track integration health dan performance.
- Success/failure rates
- Response time (p50, p95, p99)
- Error types & frequencies
- Dependency health

### 8. Security
**Concept:** Secure inter-service communication.
- TLS/SSL untuk encryption
- API key rotation
- Network segmentation
- Least privilege access

---

## Data Flow Patterns

### Synchronous Flow (HTTP)
```
Client Service → HTTP Request → Chatbot Service → Database
                                      ↓
Client Service ← HTTP Response ← Chatbot Service
```

**Characteristics:**
- Immediate response
- Simple implementation
- Tight coupling
- Blocking operation

---

### Asynchronous Flow (Event-Driven)
```
Client Service → Publish Event → Message Queue
                                      ↓
Chatbot Service ← Subscribe ← Message Queue → Process
                                      ↓
Client Service ← Subscribe ← Response Queue ← Publish Result
```

**Characteristics:**
- Non-blocking
- Loose coupling
- Scalable
- Eventual consistency

---

## Deployment Patterns

### 1. Sidecar Pattern
**Concept:** Deploy proxy container alongside chatbot service.
- Service mesh sidecar (Envoy, Linkerd)
- Handles networking, monitoring, security
- Transparent to application code

### 2. Ambassador Pattern
**Concept:** Proxy untuk external dependencies.
- Ambassador handles connection pooling
- Retry logic & circuit breaking
- Request aggregation

### 3. Backend for Frontend (BFF)
**Concept:** Dedicated backend untuk each client type.
- Web BFF, Mobile BFF, IoT BFF
- Client-specific API optimization
- Aggregate multiple service calls

---

## Scaling Considerations

### Horizontal Scaling
- Multiple chatbot service instances
- Load balancer distribution
- Stateless service design
- Database connection pooling

### Vertical Scaling
- Increase CPU/Memory per instance
- Optimize for single-instance performance
- Simpler than horizontal scaling

### Database Scaling
- Read replicas untuk read-heavy workloads
- Connection pooling (PgBouncer)
- Query optimization & indexing
- Potential sharding by userId

---

## Testing Integration

### 1. Unit Testing
- Mock chatbot service responses
- Test error handling
- Validate request formatting

### 2. Integration Testing
- Test against real/staging chatbot service
- Validate end-to-end flow
- Test failure scenarios

### 3. Contract Testing
- Define API contracts
- Consumer-driven contract tests
- Prevent breaking changes

### 4. Load Testing
- Simulate high traffic
- Test rate limiting
- Identify bottlenecks

---

## Troubleshooting Guide

### Connection Issues
**Symptoms:** Cannot reach chatbot service

**Common Causes:**
- Wrong URL/hostname
- Network policies blocking traffic
- Service not running
- DNS resolution failure

**Diagnosis:**
- Check service health endpoint
- Verify DNS resolution
- Check network policies
- Review firewall rules

---

### Performance Issues
**Symptoms:** Slow response times

**Common Causes:**
- Database slow queries
- OpenRouter API latency
- Network congestion
- Resource constraints

**Diagnosis:**
- Check service metrics
- Review database query performance
- Monitor network latency
- Check CPU/Memory usage

---

### Authentication Failures
**Symptoms:** 401/403 errors

**Common Causes:**
- Invalid API key
- Expired JWT token
- Wrong permissions
- Missing authentication headers

**Diagnosis:**
- Verify API key validity
- Check token expiration
- Review permission settings
- Inspect request headers

---

## Migration Strategy

### Adding Chatbot to Existing System

**Phase 1: Preparation**
- Deploy chatbot service
- Setup database
- Configure environment

**Phase 2: Integration**
- Implement client library
- Add API calls in calling service
- Deploy with feature flag (disabled)

**Phase 3: Testing**
- Enable for internal users
- Monitor errors & performance
- Iterate based on feedback

**Phase 4: Rollout**
- Gradual rollout (1%, 10%, 50%, 100%)
- Monitor key metrics
- Rollback plan ready

---

## Reference Documentation

For detailed information, refer to:
- [API Endpoints Documentation](./API_ENDPOINTS.md) - Complete API reference
- [Error Response Codes](./ERROR_CODES.md) - Error handling guide
- [Database Schema](./DATABASE_SCHEMA.md) - Database structure
- [Quick Start Guide](./QUICKSTART.md) - Setup instructions
