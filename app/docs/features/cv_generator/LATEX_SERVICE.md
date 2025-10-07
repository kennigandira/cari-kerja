# LaTeX Compilation Service
# Render.com Free Tier with Tectonic

**Version:** 1.0
**Last Updated:** October 7, 2025
**Status:** Ready for Implementation
**Cost:** $0/month

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Implementation Files](#3-implementation-files)
4. [Deployment Guide](#4-deployment-guide)
5. [API Usage](#5-api-usage)
6. [Monitoring & Maintenance](#6-monitoring--maintenance)
7. [Troubleshooting](#7-troubleshooting)
8. [Cost Analysis](#8-cost-analysis)

---

## 1. Overview

### What is This?

A **self-hosted LaTeX compilation service** that runs on Render.com's free tier. It uses the same `tectonic` compiler you use locally, ensuring consistent PDF quality.

### Why Render.com?

- ✅ **750 hours/month FREE** (enough for 24/7 uptime)
- ✅ **No credit card required** for free tier
- ✅ **Docker support** (can run tectonic)
- ✅ **Auto-restarts** on crashes
- ✅ **Easy deployment** (connect GitHub, done)

### Key Features

- Uses your exact tectonic setup
- Same PDF quality as local CLI
- Simple HTTP API: Send LaTeX → Get PDF
- Zero infrastructure cost
- Always available (not cold-start serverless)

---

## 2. Architecture

### System Diagram

```
Cloudflare Worker
    ↓
    ↓ HTTP POST /compile
    ↓ Body: { "latex": "..." }
    ↓
┌────────────────────────────────────┐
│  Render.com (Free Tier)            │
│  https://latex-compiler.onrender.com │
│                                    │
│  ┌──────────────────────────────┐ │
│  │  Docker Container            │ │
│  │                              │ │
│  │  ├── tectonic (installed)   │ │
│  │  ├── Node.js HTTP server    │ │
│  │  └── /tmp for temp files    │ │
│  └──────────────────────────────┘ │
│                                    │
│  Resources:                        │
│  - 512MB RAM                       │
│  - Shared CPU                      │
│  - 750 hrs/month (always-on)       │
└────────────────────────────────────┘
    ↓
    ↓ Response: PDF binary
    ↓
Supabase Storage
    ↓
User downloads PDF
```

### Request Flow

```
1. Worker receives CV generation request
2. Worker converts markdown → LaTeX
3. Worker POST LaTeX to Render.com service
4. Service writes LaTeX to /tmp/input.tex
5. Service runs: tectonic /tmp/input.tex -o /tmp
6. Service reads /tmp/input.pdf
7. Service returns PDF binary
8. Worker uploads PDF to Supabase Storage
9. User downloads from Supabase
```

---

## 3. Implementation Files

### File Structure

```
latex-compiler-service/
├── Dockerfile            # Docker image with tectonic
├── server.js             # HTTP API server
├── render.yaml          # Render.com configuration
├── .gitignore
└── README.md
```

### 3.1 Dockerfile

```dockerfile
# Stage 1: Build tectonic from source
FROM rust:1.70 as builder

# Install tectonic
RUN cargo install tectonic

# Stage 2: Runtime image
FROM debian:bullseye-slim

# Copy tectonic binary from builder
COPY --from=builder /usr/local/cargo/bin/tectonic /usr/bin/tectonic

# Install Node.js for HTTP server
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy server code
COPY server.js package.json ./

# Install dependencies (if any)
RUN npm install

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s \
  CMD curl -f http://localhost:8080/health || exit 1

# Start server
CMD ["node", "server.js"]
```

### 3.2 server.js

```javascript
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

const PORT = process.env.PORT || 8080;

// Create server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'latex-compiler' }));
    return;
  }

  // Compile endpoint
  if (req.method === 'POST' && req.url === '/compile') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
      // Prevent huge payloads (10MB limit)
      if (body.length > 10 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Payload too large' }));
        req.connection.destroy();
      }
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const latex = data.latex;

        if (!latex) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing latex field' }));
          return;
        }

        // Generate unique filename
        const id = crypto.randomBytes(8).toString('hex');
        const tmpDir = `/tmp/latex-${id}`;

        // Create temp directory
        fs.mkdirSync(tmpDir, { recursive: true });

        const texPath = path.join(tmpDir, 'input.tex');
        const pdfPath = path.join(tmpDir, 'input.pdf');

        // Write LaTeX file
        fs.writeFileSync(texPath, latex);

        // Compile with tectonic
        const cmd = `tectonic ${texPath} --outdir ${tmpDir}`;

        console.log(`[${id}] Compiling LaTeX...`);
        const startTime = Date.now();

        exec(cmd, { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
          const duration = Date.now() - startTime;

          // Cleanup function
          const cleanup = () => {
            try {
              fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch (e) {
              console.error(`[${id}] Cleanup error:`, e.message);
            }
          };

          if (err) {
            console.error(`[${id}] Compilation failed (${duration}ms):`, stderr);
            cleanup();
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'LaTeX compilation failed',
              details: stderr.toString()
            }));
            return;
          }

          // Check if PDF was created
          if (!fs.existsSync(pdfPath)) {
            console.error(`[${id}] PDF not created (${duration}ms)`);
            cleanup();
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'PDF generation failed' }));
            return;
          }

          // Read PDF
          const pdf = fs.readFileSync(pdfPath);
          console.log(`[${id}] Success! (${duration}ms, ${pdf.length} bytes)`);

          // Send PDF
          res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Length': pdf.length
          });
          res.end(pdf);

          // Cleanup after sending
          cleanup();
        });

      } catch (err) {
        console.error('Parse error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });

    return;
  }

  // 404 for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`LaTeX compiler service listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Compile endpoint: http://localhost:${PORT}/compile`);
});
```

### 3.3 package.json

```json
{
  "name": "latex-compiler-service",
  "version": "1.0.0",
  "description": "LaTeX to PDF compilation service using tectonic",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "author": "Cari Kerja Team",
  "license": "MIT"
}
```

### 3.4 render.yaml

```yaml
services:
  - type: web
    name: latex-compiler
    env: docker
    plan: free  # 750 hours/month FREE
    dockerfilePath: ./Dockerfile
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
```

### 3.5 .gitignore

```
node_modules/
*.pdf
*.aux
*.log
*.out
.DS_Store
```

---

## 4. Deployment Guide

### Step 1: Create GitHub Repository

```bash
# Create new repo
mkdir latex-compiler-service
cd latex-compiler-service

# Initialize git
git init

# Create files (copy from section 3)
# - Dockerfile
# - server.js
# - package.json
# - render.yaml
# - .gitignore

# Commit
git add .
git commit -m "Initial commit: LaTeX compiler service"

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/latex-compiler-service.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Render.com

1. **Sign up for Render.com**
   - Go to https://render.com/
   - Sign up with GitHub (no credit card required)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select `latex-compiler-service` repo
   - Render will auto-detect `render.yaml`

3. **Configure Service**
   - Name: `latex-compiler` (or your choice)
   - Environment: Docker
   - Plan: **Free** ⭐
   - Health Check Path: `/health`
   - Click "Create Web Service"

4. **Wait for Deployment**
   - Initial build takes ~10-15 minutes
   - Render builds Docker image
   - Service starts automatically
   - You'll get a URL: `https://latex-compiler-abc123.onrender.com`

5. **Test Service**
   ```bash
   # Health check
   curl https://latex-compiler-abc123.onrender.com/health
   # {"status":"ok","service":"latex-compiler"}

   # Test compilation
   curl -X POST https://latex-compiler-abc123.onrender.com/compile \
     -H "Content-Type: application/json" \
     -d '{"latex":"\\documentclass{article}\\begin{document}Hello\\end{document}"}' \
     --output test.pdf

   # Open test.pdf to verify
   open test.pdf
   ```

### Step 3: Configure Cloudflare Worker

Update your worker to use the Render.com URL:

```typescript
// app/workers/src/services/latex-compiler.ts
export class LaTeXCompiler {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl; // https://latex-compiler-abc123.onrender.com
  }

  async compile(latexContent: string): Promise<ArrayBuffer> {
    const response = await fetch(`${this.apiUrl}/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex: latexContent })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`LaTeX compilation failed: ${error.error}`);
    }

    return response.arrayBuffer();
  }
}
```

---

## 5. API Usage

### Endpoint

```
POST https://latex-compiler-abc123.onrender.com/compile
```

### Request

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "latex": "\\documentclass{article}\n\\begin{document}\nHello World\n\\end{document}"
}
```

### Response

**Success (200 OK):**
```
Content-Type: application/pdf
Content-Length: 12345

<PDF binary data>
```

**Error (400 Bad Request):**
```json
{
  "error": "Missing latex field"
}
```

**Error (500 Internal Server Error):**
```json
{
  "error": "LaTeX compilation failed",
  "details": "! Undefined control sequence..."
}
```

### Example: cURL

```bash
curl -X POST https://latex-compiler-abc123.onrender.com/compile \
  -H "Content-Type: application/json" \
  -d '{"latex":"\\documentclass{article}\\usepackage{hyperref}\\begin{document}\\section{Test}Hello World\\end{document}"}' \
  --output output.pdf
```

### Example: JavaScript (Cloudflare Worker)

```javascript
async function compileLaTeX(latex) {
  const response = await fetch('https://latex-compiler-abc123.onrender.com/compile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latex })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.arrayBuffer();
}
```

---

## 6. Monitoring & Maintenance

### Render.com Dashboard

Access at: https://dashboard.render.com/

**Metrics Available:**
- Service uptime
- Request count
- Response times
- Error rates
- Deployment history
- Logs (last 7 days)

### Health Checks

Render automatically monitors `/health` endpoint:
- Interval: Every 30 seconds
- Timeout: 10 seconds
- Auto-restart on 3 consecutive failures

### Logs

**View logs:**
```bash
# Via Render.com dashboard
# Or use Render CLI:
render logs latex-compiler
```

**Example log output:**
```
[abc12345] Compiling LaTeX...
[abc12345] Success! (1234ms, 45678 bytes)
```

### Free Tier Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Uptime | 750 hrs/month | ~24/7 for one service |
| RAM | 512MB | Enough for most CVs |
| CPU | Shared | Slower than paid tiers |
| Build Time | Free | Initial: ~10-15 min |
| Bandwidth | Free | No egress charges |

**Note:** Free tier services spin down after 15 minutes of inactivity, causing ~30s cold start on next request.

**Workaround:** Use UptimeRobot (free) to ping `/health` every 5 minutes to keep service warm.

---

## 7. Troubleshooting

### Issue 1: Service Won't Start

**Symptoms:**
- Deployment fails
- "Service unavailable" error

**Solutions:**
1. Check Dockerfile syntax:
   ```bash
   docker build -t latex-compiler .
   docker run -p 8080:8080 latex-compiler
   ```
2. Check Render logs for build errors
3. Verify Node.js version matches (18+)
4. Ensure PORT env var is used: `process.env.PORT`

---

### Issue 2: LaTeX Compilation Fails

**Symptoms:**
- 500 error
- "LaTeX compilation failed" message

**Solutions:**
1. Test LaTeX locally:
   ```bash
   echo "\\documentclass{article}..." > test.tex
   tectonic test.tex
   ```
2. Check LaTeX syntax errors in response details
3. Verify all required packages are available
4. Increase timeout if compilation is slow

---

### Issue 3: Cold Start Latency

**Symptoms:**
- First request takes 30-60 seconds
- Subsequent requests are fast

**Explanation:**
- Free tier services spin down after 15 min inactivity
- Cold start takes ~30s to wake up

**Solutions:**
1. **UptimeRobot** (free):
   - Sign up at https://uptimerobot.com/
   - Add monitor: HTTP(s) check
   - URL: `https://latex-compiler-abc123.onrender.com/health`
   - Interval: 5 minutes
   - Keeps service warm 24/7

2. **Accept cold starts:**
   - Show "Compiling (may take 60s)..." message
   - User expectation management

---

### Issue 4: PDF Quality Issues

**Symptoms:**
- Missing fonts
- Incorrect formatting
- Different from local output

**Solutions:**
1. Verify tectonic version matches local:
   ```bash
   docker exec -it <container> tectonic --version
   ```
2. Ensure LaTeX source is identical
3. Check for missing packages:
   ```bash
   # Add packages to Dockerfile if needed
   RUN apt-get install -y texlive-fonts-extra
   ```

---

### Issue 5: Out of Memory

**Symptoms:**
- Compilation times out
- Service crashes during compilation

**Solutions:**
1. Simplify LaTeX document
2. Remove heavy images/graphics
3. Split into multiple smaller documents
4. Upgrade to paid Render plan ($7/month, 1GB RAM)

---

## 8. Cost Analysis

### Render.com Free Tier

| Resource | Free Tier | Usage for 20 CVs/month | Cost |
|----------|-----------|------------------------|------|
| Service hours | 750/month | 720 (24/7) | $0 |
| Build minutes | Unlimited | ~15 min/month | $0 |
| Bandwidth | Unlimited | ~40MB (20 CVs × 2MB) | $0 |
| **Total** | | | **$0/month** |

### Comparison with Alternatives

| Option | Cost/Month | Pros | Cons |
|--------|------------|------|------|
| **Render.com (Free)** | $0 | Same as local, always-on | Slower CPU, cold starts |
| LaTeX.Online | $0 | No setup | Rate limits (100/day) |
| Google Cloud Run | $0* | Fast, scalable | Requires credit card |
| AWS Lambda | $0* | Fast, scalable | Requires credit card |
| Self-hosted VPS | $5-10 | Full control | Maintenance overhead |

*Stays $0 within free tier limits

### ROI Analysis

**Time Saved:**
- No third-party API setup: 2 hours saved
- No rate limit worries: Unlimited compilations
- Same quality as local: No debugging PDF issues

**Recommendation:**
Render.com free tier is perfect for MVP (0-100 CVs/month). Upgrade to paid ($7/month) only if:
- Cold starts become annoying (>30s wait)
- Need faster compilation (<20s)
- Scale beyond 500 CVs/month

---

## Next Steps

1. ✅ Create GitHub repo with files from Section 3
2. ✅ Deploy to Render.com (Section 4)
3. ✅ Test compilation endpoint
4. ✅ Update Cloudflare Worker to use Render.com URL
5. ✅ Set up UptimeRobot to keep service warm (optional)
6. ✅ Monitor first 10 CV compilations
7. ✅ Document any issues and workarounds

---

## Related Documents

- **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- **Implementation Plan:** [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Sprint breakdown
- **User Stories:** [USER_STORIES.md](./USER_STORIES.md) - Acceptance criteria

---

**Questions?** Check Render.com docs: https://render.com/docs
