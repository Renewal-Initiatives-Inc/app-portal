# Performance Guide

Guidelines for measuring and optimizing App Portal performance.

## Performance Targets

Based on the project requirements, aim for:

| Metric | Target | Page |
|--------|--------|------|
| Performance | >90 | All pages |
| Accessibility | >95 | All pages |
| Best Practices | >90 | All pages |
| SEO | >90 | Public pages |
| LCP | <2.5s | All pages |
| FID | <100ms | All pages |
| CLS | <0.1 | All pages |

## Running Lighthouse Audits

### Chrome DevTools

1. Open Chrome DevTools (F12 or Cmd+Opt+I)
2. Go to **Lighthouse** tab
3. Select categories: Performance, Accessibility, Best Practices, SEO
4. Select device: Desktop and Mobile
5. Click **Analyze page load**

### Lighthouse CLI

```bash
# Install
npm install -g lighthouse

# Run audit
lighthouse https://tools.renewalinitiatives.org --output html --output-path ./lighthouse-report.html

# Mobile emulation
lighthouse https://tools.renewalinitiatives.org --preset=desktop
lighthouse https://tools.renewalinitiatives.org --preset=mobile
```

### PageSpeed Insights

Use Google's PageSpeed Insights for public URLs:
https://pagespeed.web.dev/

## Pages to Test

Test these pages at minimum:

1. **Home Portal** (`/`) - Most visited page
2. **Admin Dashboard** (`/admin`)
3. **Apps List** (`/admin/apps`)
4. **Users List** (`/admin/users`)
5. **User Invite Form** (`/admin/users/invite`)

## Current Optimizations

The App Portal includes these optimizations:

### Images

- **next/image**: Automatic optimization, lazy loading, responsive sizes
- **Vercel Blob**: CDN delivery for uploaded icons
- **Icon fallbacks**: Text fallback when no icon uploaded

### Code Splitting

- **App Router**: Automatic route-based code splitting
- **Dynamic imports**: Heavy components loaded on demand
- **Server Components**: Most pages are server-rendered

### Data Loading

- **Suspense boundaries**: Streaming with skeleton loading
- **Parallel data fetching**: `Promise.all` for concurrent requests
- **Revalidation**: Appropriate cache invalidation

### CSS

- **Tailwind CSS**: Unused CSS purged in production
- **CSS Variables**: Theme tokens for consistent styling

## Performance Checklist

### Before Deployment

- [ ] Run Lighthouse on key pages
- [ ] Check Core Web Vitals pass
- [ ] Verify images are optimized
- [ ] Check no console errors
- [ ] Test on slow network (DevTools throttling)

### Code Review

- [ ] No unnecessary client components (`'use client'`)
- [ ] Heavy imports are dynamic (`import()`)
- [ ] Data fetches use appropriate caching
- [ ] No redundant re-renders

## Common Issues and Fixes

### Slow Time to First Byte (TTFB)

**Cause**: Server taking too long to respond

**Fixes**:
- Check database queries for efficiency
- Add indexes to frequently queried columns
- Use caching for expensive computations
- Check cold start issues on Vercel

### Large Largest Contentful Paint (LCP)

**Cause**: Hero images/content loading slowly

**Fixes**:
- Preload critical images
- Use appropriate image sizes
- Optimize above-the-fold content
- Reduce server response time

### Cumulative Layout Shift (CLS)

**Cause**: Elements shifting during load

**Fixes**:
- Set explicit dimensions on images
- Reserve space for dynamic content
- Use skeleton loaders matching final size
- Avoid inserting content above existing content

### First Input Delay (FID)

**Cause**: JavaScript blocking main thread

**Fixes**:
- Break up long tasks
- Defer non-critical JavaScript
- Use Web Workers for heavy computation
- Reduce bundle size

## Bundle Analysis

### Analyze Bundle Size

```bash
# Install analyzer
npm install @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});
module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

### Common Large Dependencies

Watch for these potentially large dependencies:
- date-fns (use specific imports)
- lodash (use lodash-es or specific imports)
- moment (consider date-fns instead)
- icons (import specific icons, not entire libraries)

### Reducing Bundle Size

```typescript
// Bad - imports entire library
import { format } from 'date-fns';

// Good - tree-shakeable import
import format from 'date-fns/format';

// Bad - imports all icons
import * as Icons from 'lucide-react';

// Good - specific icon import
import { Home, Settings } from 'lucide-react';
```

## Monitoring

### Vercel Analytics

If enabled, Vercel provides:
- Real User Metrics (RUM)
- Core Web Vitals tracking
- Geographic performance data

### Custom Performance Marks

```typescript
// Add performance marks for custom measurements
performance.mark('data-fetch-start');
const data = await fetchData();
performance.mark('data-fetch-end');
performance.measure('data-fetch', 'data-fetch-start', 'data-fetch-end');
```

## Performance Budget

Suggested limits:

| Asset Type | Budget |
|------------|--------|
| JavaScript (total) | <300KB gzipped |
| CSS (total) | <50KB gzipped |
| Images (per page) | <500KB |
| Fonts | <100KB |
| Total page weight | <1MB |

## Next Steps After Audit

1. Document current scores
2. Identify lowest-scoring areas
3. Prioritize fixes by impact
4. Implement changes
5. Re-measure and compare
6. Repeat until targets met
