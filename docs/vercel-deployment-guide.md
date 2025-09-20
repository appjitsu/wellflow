# Vercel Deployment Guide for WellFlow MVP

This guide covers the complete setup of Vercel frontend infrastructure for the
WellFlow MVP Next.js application.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install using `npm i -g vercel`
3. **GitHub Repository**: Connected to Vercel for automatic deployments
4. **Railway Backend**: Ensure the backend API is deployed and accessible

## Project Structure

```
wellflow/
├── vercel.json              # Vercel deployment configuration
├── .vercelignore           # Files to ignore during deployment
├── apps/web/               # Next.js frontend application
│   ├── .env.production.example  # Production environment template
│   ├── middleware.ts.example    # Middleware template
│   └── src/app/api/        # API routes (when needed)
└── docs/
    └── vercel-deployment-guide.md  # This guide
```

## Step 1: Initial Vercel Setup

### 1.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 1.2 Login to Vercel

```bash
vercel login
```

### 1.3 Link Project to Vercel

From the project root directory:

```bash
vercel link
```

Follow the prompts to:

- Select your Vercel account/team
- Link to existing project or create new one
- Set project name as `wellflow-web`

## Step 2: Configure Environment Variables

### 2.1 Set Production Environment Variables

In the Vercel dashboard or via CLI, set the following environment variables:

```bash
# Core application variables
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://your-railway-api-domain.railway.app

vercel env add NEXT_PUBLIC_APP_URL production
# Enter: https://your-vercel-domain.vercel.app

vercel env add NODE_ENV production
# Enter: production

vercel env add NEXT_PUBLIC_APP_NAME production
# Enter: WellFlow

vercel env add NEXT_PUBLIC_APP_VERSION production
# Enter: 0.1.0
```

### 2.2 Optional Environment Variables

```bash
# Feature flags
vercel env add NEXT_PUBLIC_ENABLE_ANALYTICS production
vercel env add NEXT_PUBLIC_ENABLE_ERROR_REPORTING production
vercel env add NEXT_PUBLIC_ENABLE_DEBUG_MODE production

# External services (when configured)
vercel env add NEXT_PUBLIC_SENTRY_DSN production
vercel env add NEXT_PUBLIC_ANALYTICS_KEY production
```

## Step 3: Deploy Application

### 3.1 Deploy from CLI

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 3.2 Automatic Deployments

Once connected to GitHub:

- **Preview deployments**: Automatically created for all branches
- **Production deployments**: Automatically created for `main` branch pushes

## Step 4: Custom Domain Setup

### 4.1 Add Custom Domain

In Vercel dashboard:

1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `wellflow.com`)
3. Follow DNS configuration instructions

### 4.2 DNS Configuration

Add these DNS records to your domain provider:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 4.3 SSL Certificate

Vercel automatically provisions SSL certificates for all domains. No additional
configuration needed.

## Step 5: Performance Optimization

### 5.1 Edge Functions Configuration

The `vercel.json` file is configured to:

- Use Node.js runtime for API routes
- Enable edge functions for optimal performance
- Set security headers

### 5.2 Build Optimization

- Uses Turbo for faster builds
- Optimized for monorepo structure
- Excludes unnecessary files via `.vercelignore`

## Step 6: Monitoring and Rollback

### 6.1 Deployment Monitoring

Monitor deployments via:

- Vercel dashboard
- GitHub integration status checks
- Vercel CLI: `vercel logs`

### 6.2 Rollback Procedures

#### Quick Rollback via Dashboard

1. Go to Vercel dashboard → Deployments
2. Find the last working deployment
3. Click "Promote to Production"

#### Rollback via CLI

```bash
# List recent deployments
vercel ls

# Promote specific deployment to production
vercel promote <deployment-url>
```

#### Emergency Rollback via Git

```bash
# Revert to last working commit
git revert <commit-hash>
git push origin main
```

## Step 7: Testing Deployment

### 7.1 Automated Testing

```bash
# Test build locally
cd apps/web
pnpm build

# Test production build locally
pnpm start
```

### 7.2 Production Testing Checklist

- [ ] Application loads correctly
- [ ] API calls work (check Network tab)
- [ ] Environment variables are set correctly
- [ ] SSL certificate is active
- [ ] Custom domain redirects properly
- [ ] Performance metrics are acceptable
- [ ] Error tracking is working (if configured)

### 7.3 Health Check Endpoint

Once API routes are added, test the health endpoint:

```bash
curl https://your-domain.com/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "0.1.0",
  "environment": "production"
}
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check build logs in Vercel dashboard
   - Verify all dependencies are in `package.json`
   - Ensure TypeScript compilation succeeds

2. **Environment Variable Issues**
   - Verify variables are set in Vercel dashboard
   - Check variable names match exactly (case-sensitive)
   - Redeploy after adding new variables

3. **API Connection Issues**
   - Verify Railway backend is running
   - Check CORS configuration
   - Verify API URL environment variable

4. **Custom Domain Issues**
   - Verify DNS records are correct
   - Allow 24-48 hours for DNS propagation
   - Check domain configuration in Vercel dashboard

### Getting Help

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
- Next.js Documentation: https://nextjs.org/docs

## Security Considerations

- All environment variables containing secrets should be set in Vercel dashboard
- Never commit `.env.production.local` to version control
- Security headers are automatically applied via `vercel.json`
- SSL certificates are automatically managed by Vercel

## Next Steps

1. Configure custom domain when ready
2. Set up monitoring and analytics
3. Add API routes as needed
4. Configure middleware for authentication
5. Set up error tracking with Sentry
6. Implement performance monitoring

---

**Note**: This deployment guide assumes the Railway backend is already
configured and running. Ensure the backend API is accessible before deploying
the frontend.
