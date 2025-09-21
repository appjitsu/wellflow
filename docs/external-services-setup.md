# External Services Setup Guide

This guide covers setting up all external services for WellFlow with
cross-platform compatibility for both web and mobile applications.

## Overview

All services are selected for compatibility with:

- **Web**: Next.js application
- **Mobile**: Future React Native application
- **Backend**: NestJS API

## Service Accounts Setup

### 1. Sentry (Error Tracking)

**Purpose**: Error monitoring and performance tracking for web and mobile

**Setup Steps**:

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new organization: `wellflow`
3. Create projects:
   - `wellflow-api` (Node.js/NestJS)
   - `wellflow-web` (Next.js)
   - `wellflow-mobile` (React Native - for future use)
4. Get DSN keys for each project
5. Configure environment variables in Railway

**Environment Variables**:

```env
SENTRY_DSN_API=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN_WEB=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_DSN_MOBILE=https://xxx@xxx.ingest.sentry.io/xxx
SENTRY_ORG=wellflow
SENTRY_PROJECT_API=wellflow-api
SENTRY_PROJECT_WEB=wellflow-web
```

### 2. LogRocket (Session Recording)

**Purpose**: User session recording and debugging for web and mobile

**Setup Steps**:

1. Go to [logrocket.com](https://logrocket.com) and create an account
2. Create a new application: `WellFlow`
3. Get the App ID
4. Configure for both web and mobile platforms

**Environment Variables**:

```env
LOGROCKET_APP_ID=your-app-id
```

### 3. UploadThing (File Storage)

**Purpose**: File upload and storage service

**Setup Steps**:

1. Go to [uploadthing.com](https://uploadthing.com) and create an account
2. Create a new app: `wellflow`
3. Get API keys
4. Configure file upload endpoints

**Environment Variables**:

```env
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=your-app-id
```

### 4. Resend (Email Service)

**Purpose**: Transactional email service for production

**Setup Steps**:

1. Go to [resend.com](https://resend.com) and create an account
2. Verify your domain
3. Create API key
4. Set up email templates

**Environment Variables**:

```env
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 5. MailPit (Local Email Development)

**Purpose**: Local email testing during development

**Setup Steps**:

1. Install MailPit locally or via Docker
2. Configure SMTP settings for local development
3. Access web interface at <http://localhost:8025>

**Environment Variables (Development)**:

```env
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
MAILPIT_UI_PORT=8025
```

### 6. Firebase (Push Notifications & Analytics)

**Purpose**: Push notifications, analytics, and crashlytics for web and mobile

**Setup Steps**:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project: `wellflow`
3. Enable services:
   - Cloud Messaging (FCM)
   - Analytics
   - Crashlytics
4. Add web app and get config
5. Generate service account key for server-side operations
6. Configure for React Native (future)

**Environment Variables**:

```env
FIREBASE_PROJECT_ID=wellflow-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@wellflow-xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
FIREBASE_WEB_API_KEY=AIzaSyXXX
FIREBASE_WEB_AUTH_DOMAIN=wellflow-xxx.firebaseapp.com
FIREBASE_WEB_PROJECT_ID=wellflow-xxx
FIREBASE_WEB_STORAGE_BUCKET=wellflow-xxx.appspot.com
FIREBASE_WEB_MESSAGING_SENDER_ID=123456789
FIREBASE_WEB_APP_ID=1:123456789:web:xxx
```

### 7. Mapbox (Mapping & GIS)

**Purpose**: Maps and geospatial services for well locations

**Setup Steps**:

1. Go to [mapbox.com](https://mapbox.com) and create an account
2. Create access tokens:
   - Public token (for client-side)
   - Secret token (for server-side)
3. Configure styles and datasets as needed

**Environment Variables**:

```env
MAPBOX_ACCESS_TOKEN=pk.xxx (public token)
MAPBOX_SECRET_TOKEN=sk.xxx (secret token)
```

### 8. Twilio (SMS Notifications)

**Purpose**: SMS notifications for field workers and alerts

**Setup Steps**:

1. Go to [twilio.com](https://twilio.com) and create an account
2. Get Account SID and Auth Token
3. Purchase a phone number
4. Set up messaging service

**Environment Variables**:

```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=MGxxx
```

## Railway Environment Configuration

Add all environment variables to Railway:

1. Go to your Railway project dashboard
2. Navigate to each service (API, Web)
3. Go to Variables tab
4. Add the environment variables for each service

## Local Development Setup

Create `.env.local` files for local development:

**apps/api/.env.local**:

```env
# Copy all the environment variables above
# Use MailPit for local email testing
SMTP_HOST=localhost
SMTP_PORT=1025
```

**apps/web/.env.local**:

```env
# Client-side environment variables (Next.js)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
NEXT_PUBLIC_LOGROCKET_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=wellflow-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=wellflow-xxx
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.xxx
```

## Security Considerations

1. **Never commit API keys** to version control
2. **Use different keys** for development and production
3. **Rotate keys regularly**
4. **Use Railway's secret management** for production
5. **Implement proper CORS** for client-side services
6. **Use environment-specific configurations**

## Testing Setup

1. **Sentry**: Test error reporting in development
2. **LogRocket**: Verify session recording works
3. **UploadThing**: Test file upload functionality
4. **MailPit**: Send test emails locally
5. **Firebase**: Test push notifications
6. **Mapbox**: Verify map rendering
7. **Twilio**: Send test SMS

## Next Steps

After setting up all services:

1. Update Railway environment variables
2. Test each service integration
3. Update documentation with actual configuration values
4. Set up monitoring and alerts
5. Configure service-specific settings (rate limits, quotas, etc.)

---

**Note**: This setup provides a solid foundation for both current web
development and future React Native mobile app integration.
