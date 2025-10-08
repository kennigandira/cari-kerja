# Subresource Integrity (SRI) Implementation Guide

## Current Status: ✅ No External Resources

The application currently does not use any external CDN resources. All JavaScript and CSS are bundled by Vite and served from the same origin, which provides inherent security without needing SRI.

## What is SRI?

Subresource Integrity (SRI) is a security feature that allows browsers to verify that resources fetched from CDNs haven't been tampered with. It uses cryptographic hashes to ensure file integrity.

## When to Use SRI

SRI should be implemented when:
1. Loading JavaScript libraries from CDN (e.g., jQuery, React from CDN)
2. Loading CSS stylesheets from external sources
3. Loading fonts from external providers
4. Any resource loaded from a domain you don't control

## SRI Not Needed For

- ✅ Resources bundled by Vite (current setup)
- ✅ Resources served from same origin
- ✅ Resources loaded from your own domain/CDN

## How to Implement SRI

### 1. For External Scripts

```html
<!-- Without SRI (vulnerable) -->
<script src="https://cdn.example.com/library.js"></script>

<!-- With SRI (secure) -->
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous">
</script>
```

### 2. For External Stylesheets

```html
<!-- With SRI -->
<link
  rel="stylesheet"
  href="https://cdn.example.com/style.css"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous">
```

### 3. Generating SRI Hashes

#### Option A: Using openssl
```bash
# Generate SHA-384 hash
cat library.js | openssl dgst -sha384 -binary | openssl base64 -A
```

#### Option B: Using online tools
- https://www.srihash.org/
- Paste the CDN URL and it generates the integrity attribute

#### Option C: Using npm
```bash
npm install -g sri-toolbox
sri-toolbox generate https://cdn.example.com/library.js
```

## Automated SRI for Build Assets

While our current setup doesn't use external CDNs, if you want to add SRI to your own build assets for additional security:

### Install Vite Plugin

```bash
npm install --save-dev vite-plugin-sri
```

### Configure in vite.config.ts

```typescript
import sri from 'vite-plugin-sri';

export default defineConfig({
  plugins: [
    sri({
      algorithms: ['sha384'],
    }),
  ],
});
```

This will automatically add integrity attributes to all script and link tags in the built HTML.

## CSP Integration

SRI works best with Content Security Policy. Our current CSP already requires:
```
script-src 'self'
```

If you add external CDN resources, update CSP to allow them:
```
script-src 'self' https://cdn.example.com
```

## Example: Adding a CDN Library with SRI

If you need to add an external library (not recommended, but for reference):

```html
<!-- Example: Adding Chart.js from CDN with SRI -->
<script
  src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"
  integrity="sha384-..."
  crossorigin="anonymous">
</script>
```

**Better approach:** Install via npm instead:
```bash
npm install chart.js
```

Then import in your code:
```typescript
import { Chart } from 'chart.js';
```

## Security Best Practices

### ✅ DO:
- Bundle all dependencies via npm/Vite (current approach)
- Use SRI for any external CDN resources
- Verify integrity hashes match the expected values
- Use `crossorigin="anonymous"` with SRI
- Use sha384 or sha512 (more secure than sha256)

### ❌ DON'T:
- Load resources from untrusted CDNs
- Use SRI without crossorigin attribute
- Skip SRI for "convenience"
- Trust inline scripts in production

## Monitoring and Maintenance

If you add external resources with SRI:

1. **Update hashes when versions change**
   ```html
   <!-- Old version -->
   <script src="https://cdn.example.com/lib@1.0.0.js"
           integrity="sha384-old-hash"></script>

   <!-- New version requires new hash -->
   <script src="https://cdn.example.com/lib@2.0.0.js"
           integrity="sha384-new-hash"></script>
   ```

2. **Monitor for SRI failures**
   ```javascript
   // Detect SRI failures
   window.addEventListener('error', (e) => {
     if (e.target && e.target.integrity) {
       console.error('SRI verification failed:', e.target.src);
       // Send to error tracking service
     }
   }, true);
   ```

3. **Test before deploying**
   - Ensure hashes are correct
   - Test with different browsers
   - Verify fallback behavior

## Fallback Strategy

If an SRI check fails, implement a fallback:

```html
<script
  src="https://cdn.example.com/library.js"
  integrity="sha384-..."
  crossorigin="anonymous"
  onerror="loadFallback()">
</script>

<script>
function loadFallback() {
  // Load from backup CDN or local copy
  const script = document.createElement('script');
  script.src = '/local/library.js';
  document.head.appendChild(script);
}
</script>
```

## Current Application Status

**✅ Secure without SRI** because:
1. No external CDN dependencies
2. All resources bundled by Vite
3. Same-origin policy applies
4. Content Security Policy restricts external resources

**If future changes add external resources:**
1. Follow this guide
2. Generate SRI hashes
3. Update CSP to allow the domain
4. Test thoroughly
5. Monitor for failures

## Resources

- [MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)
- [W3C SRI Specification](https://www.w3.org/TR/SRI/)
- [SRI Hash Generator](https://www.srihash.org/)
- [OWASP: Subresource Integrity](https://cheatsheetseries.owasp.org/cheatsheets/Subresource_Integrity_Cheat_Sheet.html)

---

**Last Updated:** 2025-10-07
**Status:** No external resources - SRI not currently needed
**Next Review:** When external CDN resources are added
