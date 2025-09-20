# Monitoring & Error Tracking Setup

This document covers the complete setup and configuration of Sentry and
LogRocket for cross-platform error tracking and session recording.

## Overview

WellFlow uses a comprehensive monitoring stack:

- **Sentry**: Error tracking, performance monitoring, and alerting for both API
  and web app
- **LogRocket**: Session recording, user analytics, and debugging for web app
- **Railway Monitoring**: Built-in infrastructure monitoring and metrics

## Sentry Configuration

### API (NestJS) Setup

The API uses `@sentry/nestjs` for comprehensive error tracking:

**Files:**

- `apps/api/src/sentry/sentry.module.ts` - Sentry module configuration
- `apps/api/src/sentry/sentry.service.ts` - Sentry service wrapper
- `apps/api/src/common/filters/sentry-exception.filter.ts` - Global exception
  filter

**Features:**

- Automatic error capture with context
- Performance monitoring with traces
- User context tracking
- Request/response sanitization
- Custom exception filtering

**Environment Variables:**

```env
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=wellflow
SENTRY_PROJECT=wellflow-api
SENTRY_ENVIRONMENT=development|production
```

### Web App (Next.js) Setup

The web app uses `@sentry/nextjs` for client and server-side monitoring:

**Files:**

- `apps/web/sentry.client.config.ts` - Client-side configuration
- `apps/web/sentry.server.config.ts` - Server-side configuration
- `apps/web/sentry.edge.config.ts` - Edge runtime configuration
- `apps/web/next.config.js` - Webpack plugin configuration

**Features:**

- Client-side error tracking
- Server-side error tracking
- Session replay recording
- Performance monitoring
- Source map upload for better stack traces

**Environment Variables:**

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development|production
SENTRY_ORG=wellflow
SENTRY_PROJECT_WEB=wellflow-web
```

## LogRocket Configuration

### Web App Setup

LogRocket provides session recording and user analytics:

**Files:**

- `apps/web/lib/logrocket.ts` - LogRocket configuration and utilities
- `apps/web/components/providers/monitoring-provider.tsx` - React provider

**Features:**

- Session recording with privacy controls
- Network request/response sanitization
- User identification and context
- Exception capture integration
- Console log capture

**Environment Variables:**

```env
NEXT_PUBLIC_LOGROCKET_APP_ID=your-app-id
```

## Testing Setup

### Test Endpoints

**API Test Endpoints:**

- `POST /test-error` - Triggers a test error for Sentry
- `POST /test-sentry` - Sends a test message to Sentry

**Web Test Page:**

- `/monitoring-test` - Interactive test page for both Sentry and LogRocket

### Testing Checklist

1. **Sentry API Tests:**
   - [ ] Error exceptions are captured
   - [ ] Custom messages are sent
   - [ ] User context is included
   - [ ] Request context is sanitized

2. **Sentry Web Tests:**
   - [ ] Client-side errors are captured
   - [ ] Server-side errors are captured
   - [ ] Session replay is working
   - [ ] Performance traces are recorded

3. **LogRocket Tests:**
   - [ ] Session recording is active
   - [ ] User interactions are captured
   - [ ] Network requests are sanitized
   - [ ] Console logs are captured

## Production Configuration

### Sentry Production Settings

```typescript
// Recommended production settings
{
  tracesSampleRate: 0.1, // 10% of transactions
  profilesSampleRate: 0.1, // 10% of profiles
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of error sessions
}
```

### LogRocket Production Settings

```typescript
// Recommended production settings
{
  console: {
    shouldAggregateConsoleErrors: true,
  },
  dom: {
    textSanitizer: true, // Sanitize sensitive text
    inputSanitizer: true, // Sanitize form inputs
  },
}
```

## Privacy & Security

### Data Sanitization

Both services are configured to sanitize sensitive data:

**Automatically Removed:**

- Authorization headers
- Cookie headers
- API keys
- Passwords
- Tokens (access, refresh, etc.)

**Custom Sanitization:**

- Request/response bodies are filtered
- Form inputs are sanitized
- Console logs are filtered

### GDPR Compliance

- User consent should be obtained before initializing LogRocket
- Both services support data deletion requests
- Session recordings can be disabled per user
- Error tracking can be disabled per user

## Monitoring Dashboard

### Key Metrics to Monitor

**Error Tracking:**

- Error rate by endpoint
- Error rate by user
- Critical error alerts
- Performance degradation

**User Experience:**

- Session duration
- User interaction patterns
- Page load times
- API response times

### Alerting Setup

Configure alerts for:

- Error rate spikes (>1% for 5 minutes)
- Performance degradation (>2s response time)
- Critical errors (500 errors, database failures)
- High memory/CPU usage

## Troubleshooting

### Common Issues

1. **Sentry not capturing errors:**
   - Check DSN configuration
   - Verify environment variables
   - Check network connectivity
   - Review beforeSend filters

2. **LogRocket not recording:**
   - Check App ID configuration
   - Verify initialization timing
   - Check browser compatibility
   - Review privacy settings

3. **Source maps not uploading:**
   - Check Sentry CLI configuration
   - Verify build process
   - Check authentication tokens
   - Review webpack plugin settings

### Debug Mode

Enable debug mode in development:

```typescript
// Sentry debug mode
debug: process.env.NODE_ENV === 'development';

// LogRocket debug mode
console.log('LogRocket initialized:', isInitialized);
```

## Next Steps

1. Set up Sentry and LogRocket accounts
2. Configure environment variables in Railway
3. Test monitoring integration using test endpoints
4. Set up alerting rules and dashboards
5. Configure team notifications
6. Set up performance monitoring baselines

## Cross-Platform Compatibility

This monitoring setup is designed for cross-platform compatibility:

- **Current**: Web app (Next.js) and API (NestJS)
- **Future**: React Native mobile app
- **Sentry**: Supports React Native out of the box
- **LogRocket**: Has React Native SDK available

When adding React Native:

1. Install `@sentry/react-native`
2. Install `@logrocket/react-native`
3. Configure similar sanitization rules
4. Set up mobile-specific error tracking
