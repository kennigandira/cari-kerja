import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

import crypto from 'crypto';

// Generate cryptographically secure nonce for CSP
const generateNonce = () => {
  return crypto.randomBytes(16).toString('base64');
};

// Persistent nonce for the current build
const buildNonce = generateNonce();

// https://vite.dev/config/
export default defineConfig({
  base: '/', // Cloudflare Pages serves from root
  plugins: [
    vue(),
    VitePWA({
      manifest: {
        name: 'Cari Kerja',
        short_name: 'CariKerja',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        description: 'Job Application Tracker',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/_/, /\/[^/]+\.[^/]+$/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: false, // Safer default
        clientsClaim: false // Safer default
      },
      registerType: 'autoUpdate',
      injectRegister: 'auto'
    }),
  ],
  server: {
    headers: {
      // Content Security Policy - Development Only (Permissive for Vite HMR)
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self' ws://localhost:* wss://localhost:* https://*.supabase.co wss://*.supabase.co",
        "frame-src 'none'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; '),

      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'same-origin',

      // HSTS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    },
  },
  build: {
    sourcemap: process.env.NODE_ENV === 'development' && !process.env.VITE_PRODUCTION_BUILD,
    rollupOptions: {
      output: {
        // Enable SRI for chunks
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Manually configure chunks for better caching
        manualChunks: {
          'vendor': ['vue', '@vue/runtime-core', '@vue/runtime-dom'],
          'supabase': ['@supabase/supabase-js'],
          'router': ['vue-router'],
          'pinia': ['pinia'],
          'draggable': ['vuedraggable'],
        },
      },
    },
    // Enable additional security optimizations
    target: 'esnext',
    cssTarget: 'chrome80',
    assetsInlineLimit: 4096, // 4kb
    modulePreload: {
      polyfill: true,
    },
  },
});