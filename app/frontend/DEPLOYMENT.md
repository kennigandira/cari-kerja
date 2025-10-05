# Cloudflare Pages Deployment Guide

This guide walks through deploying the Cari Kerja frontend to Cloudflare Pages.

## Prerequisites

- GitHub account with this repository connected
- Cloudflare account (free tier is sufficient)
- Supabase project with URL and anon key

## Deployment Methods

### Option 1: GitHub Integration (Recommended)

This method automatically deploys on every push to your repository.

#### 1. Connect Repository to Cloudflare Pages

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. Select your GitHub repository
4. Configure build settings:
   - **Project name**: `cari-kerja` (or your preferred name)
   - **Production branch**: `main`
   - **Framework preset**: `None` (we'll configure manually)
   - **Build command**: `bun run build`
   - **Build output directory**: `dist`
   - **Root directory**: `app/frontend`

#### 2. Configure Environment Variables

In Cloudflare Pages dashboard under **Settings** → **Environment variables**, add:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Production & Preview |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production & Preview |
| `NODE_VERSION` | `20` | Production & Preview |

> **Note**: Get these values from your Supabase project settings → API

#### 3. Deploy

Click **Save and Deploy**. Cloudflare will:
- Install dependencies using Bun
- Run the build command
- Deploy the `dist` folder to your Pages site

Your site will be available at: `https://cari-kerja.pages.dev`

### Option 2: Wrangler CLI

For manual deployments or local testing:

#### 1. Install Wrangler

```bash
npm install -g wrangler
# or
bun add -g wrangler
```

#### 2. Authenticate

```bash
wrangler login
```

#### 3. Build Locally

```bash
cd app/frontend
bun install
bun run build
```

#### 4. Deploy

```bash
wrangler pages deploy dist --project-name=cari-kerja
```

#### 5. Set Environment Variables

```bash
# Set production environment variables
wrangler pages secret put VITE_SUPABASE_URL
wrangler pages secret put VITE_SUPABASE_ANON_KEY
```

## Post-Deployment Configuration

### Custom Domain

1. Go to **Custom domains** in your Pages project
2. Click **Set up a custom domain**
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions

### Security Headers

Security headers are automatically applied via the `public/_headers` file:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- And more...

You can verify headers using:
```bash
curl -I https://your-site.pages.dev
```

### SPA Routing

Client-side routing is handled by the `public/_redirects` file, which:
- Serves `index.html` for all routes (except static assets)
- Allows Vue Router to handle navigation
- Preserves direct URL access to specific routes

## Build Configuration Details

### Package Manager

Cloudflare Pages automatically detects Bun from the lockfile (`bun.lock`). If needed, you can force a specific version:

- Set `NODE_VERSION` environment variable to `20` or higher
- Bun is automatically available in the build environment

### Build Output

The build process:
1. Runs TypeScript type checking: `vue-tsc -b`
2. Builds with Vite: `vite build`
3. Outputs to `dist/` directory
4. Copies `_headers` and `_redirects` from `public/`

### Optimization

The build includes:
- Code splitting for vendor and Supabase chunks
- Asset optimization (minification, tree-shaking)
- PWA service worker generation
- Source maps (disabled in production)

## Troubleshooting

### Build Fails

**Error**: `Command not found: bun`
- **Solution**: Set `NODE_VERSION=20` in environment variables

**Error**: TypeScript errors
- **Solution**: Fix type errors locally first with `bun run build`

### Environment Variables Not Working

**Error**: Supabase connection fails
- **Solution**: Ensure variables start with `VITE_` prefix (required by Vite)
- Verify values in Cloudflare dashboard
- Redeploy after adding variables

### 404 on Direct Route Access

**Error**: Accessing `/job/123` directly returns 404
- **Solution**: Verify `_redirects` file is in `public/` directory
- Check build output includes `_redirects` in `dist/`

### CSP Blocking Resources

**Error**: Content Security Policy blocks external resources
- **Solution**: Update CSP in `public/_headers`
- Add trusted domains to appropriate directives

## Monitoring & Analytics

### Cloudflare Analytics

Built-in analytics available in Pages dashboard:
- Page views
- Unique visitors
- Geographic distribution
- Performance metrics

### Custom Analytics

To add custom analytics (e.g., Google Analytics):
1. Update CSP in `public/_headers` to allow analytics domain
2. Add tracking code to `index.html` or app initialization

## CI/CD Pipeline

### Automatic Deployments

Configured branches:
- **Production**: Deploys from `main` branch
- **Preview**: Deploys from all other branches/PRs

### Deployment Status

Check deployment status:
- Cloudflare Pages dashboard
- GitHub commit status checks
- Email notifications (configure in Cloudflare settings)

## Environment Management

### Development
```bash
cd app/frontend
bun run dev
```

### Preview (Production Build Locally)
```bash
bun run build
bun run preview
```

### Production
Deployed automatically to Cloudflare Pages

## API Integration

The frontend connects to:
- **Supabase**: Database and authentication
- **Cloudflare Worker API** (optional): `api.cari-kerja.pages.dev`

Ensure CORS is configured in Supabase and Worker settings if using cross-origin requests.

## Security Features

This application includes comprehensive security features:

### Security Headers

**Content Security Policy (CSP)**
- Strict CSP with nonce-based script loading
- Prevents inline script execution (XSS protection)
- Trusted Types enforcement for DOM manipulation
- Configured via `public/_headers` file

**Modern Security Headers**
- `X-Content-Type-Options: nosniff` - Prevents MIME sniffing
- `X-Frame-Options: DENY` - Prevents clickjacking
- `Referrer-Policy` - Controls referrer information
- `Permissions-Policy` - Restricts browser features
- `Cross-Origin-*` headers - Isolation and security
- `HSTS` - Force HTTPS connections

### Application Security

**Environment Validation**
- Runtime validation of all environment variables
- URL format and domain validation for Supabase
- Fail-fast on misconfiguration
- Location: `src/config/env.ts`

**Input Validation**
- Comprehensive validation composables
- Allowlist-based validation approach
- HTML sanitization and XSS prevention
- Location: `src/composables/useValidation.ts`

**Route Security**
- Route parameter validation
- Invalid ID detection and handling
- 404 handling for unknown routes
- Location: `src/router/index.ts`

**Supabase Security**
- PKCE authentication flow
- Secure session management
- Rate limiting on realtime events
- Location: `src/lib/supabase.ts`

### Build Security

**Source Maps**
- Disabled in production builds
- Enable only for development debugging
- Set via `VITE_PRODUCTION_BUILD` environment variable

**Subresource Integrity (SRI)**
- Asset hashing for integrity verification
- Prevents tampering with built assets
- Automatic via Vite build process

**PWA Security**
- Secure service worker configuration
- Safe caching strategies with cleanup
- No aggressive update mechanisms

### Security Best Practices

1. **Never commit secrets** - Use Cloudflare environment variables
2. **Validate all inputs** - Use validation composables
3. **Sanitize user content** - Use security utilities
4. **Keep dependencies updated** - Run `bun audit` regularly
5. **Monitor CSP violations** - Check browser console
6. **Test security headers** - Use securityheaders.com

### Security Testing

Before deploying:
```bash
# Check for dependency vulnerabilities
bun audit

# Test build process
bun run build

# Preview production build locally
bun run preview
```

After deploying:
1. Test CSP configuration: Check browser console for violations
2. Verify security headers: https://securityheaders.com
3. Test SSL/TLS: https://www.ssllabs.com/ssltest/
4. Check HSTS preload: https://hstspreload.org/

## Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Vue Deployment Guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vue-site/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase Documentation](https://supabase.com/docs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CSP Reference](https://content-security-policy.com/)

## Support

For issues or questions:
- Check [Cloudflare Community](https://community.cloudflare.com/)
- Review [Cloudflare Pages Status](https://www.cloudflarestatus.com/)
- Check build logs in Cloudflare dashboard

For security issues:
- Review security documentation above
- Check browser console for CSP violations
- Verify environment variables are set correctly
- Test with security scanning tools
