# GPTO Suite Testing Guide

## Test Coverage

### Unit Tests

- Schema validation
- Update pipeline (diff, merge, rollback)
- APM weight calculation
- Intent classification

### Integration Tests

- Telemetry ingestion flow
- Update deployment flow
- Servo orchestration
- Chatbot message processing

### E2E Tests

- Complete site update workflow
- Telemetry → Dashboard → Update cycle
- Chatbot → Servo → Update pipeline

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test suite
pnpm --filter <package> test
```

## Performance Testing

- Telemetry latency: < 100ms (p95)
- Dashboard load: < 2s
- Update deployment: < 5s
- Rollback: < 2s

## Security Testing

- Authentication/authorization
- SQL injection prevention
- XSS prevention
- CSRF protection
- Rate limiting

## Acceptance Criteria

- ✅ Sites can be updated without redeploys
- ✅ All changes are signed, logged, and reversible
- ✅ Telemetry proves impact
- ✅ Non-developers can safely operate the system
- ✅ AI behavior is governed, not free-running
