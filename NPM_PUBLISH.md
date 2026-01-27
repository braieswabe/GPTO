# NPM Publishing Guide

## Black Box Package (@careerdriver/black-box)

### Current Version
- **Version:** `1.1.0`
- **Package:** `@careerdriver/black-box`
- **Public:** Yes (published to npm)

### Publishing Steps

1. **Build the package:**
   ```bash
   cd apps/black-box
   pnpm build
   ```

2. **Verify build output:**
   ```bash
   ls -la dist/
   # Should see:
   # - runtime.js (ESM)
   # - runtime.global.js (IIFE)
   # - runtime.d.ts (types)
   ```

3. **Check package.json:**
   - Version: `1.1.0`
   - Description includes new features
   - Keywords updated
   - Repository URL set

4. **Publish to npm:**
   ```bash
   cd apps/black-box
   npm publish
   ```

### Package Details

- **Name:** `@careerdriver/black-box`
- **Version:** `1.1.0`
- **Description:** AI Search Optimization Runtime - Automatic JSON-LD schema injection with server-side rendering support
- **Keywords:** ai-search, gpt-optimization, schema.org, json-ld, seo, ai-visibility, structured-data, chatgpt, perplexity, claude
- **Repository:** https://github.com/careerdriver/gpto-suite
- **Access:** Public

### What's Included

- `dist/runtime.js` - ESM module
- `dist/runtime.global.js` - IIFE for script tags
- `dist/runtime.d.ts` - TypeScript definitions

### Installation

Users can install via:
```bash
npm install @careerdriver/black-box@latest
# or
pnpm add @careerdriver/black-box@latest
```

### CDN Usage

Available via unpkg:
```html
<script src="https://unpkg.com/@careerdriver/black-box@latest/dist/runtime.global.js"></script>
```

## GPTO Servo Package (@gpto/servos-gpto)

### Current Version
- **Version:** `1.1.0`
- **Package:** `@gpto/servos-gpto`
- **Public:** No (private workspace package)

### New Exports

- `generateSchemaScriptTags()` - Server-side schema generation
- `injectSchemasIntoHTML()` - HTML injection utility
- `generateOrganizationSchema()` - Organization schema generator
- `generateLocalBusinessSchema()` - LocalBusiness schema generator
- `generateAllSchemas()` - Generate all schemas

### Usage

```typescript
import { 
  generateSchemaScriptTags,
  injectSchemasIntoHTML 
} from '@gpto/servos-gpto';
```

## Version History

### v1.1.0 (Current)
- Automatic server-side schema injection
- New API endpoints for schema rendering
- Configuration fixes
- Updated documentation

### v1.0.3 (Previous)
- Client-side schema injection
- Basic telemetry
- Authority Grove integration

## GitHub Release

When publishing to GitHub:

1. **Create Release Tag:**
   ```bash
   git tag -a v1.1.0 -m "Release v1.1.0: Automatic Server-Side Schema Injection"
   git push origin v1.1.0
   ```

2. **Release Notes:**
   - Use `.github/RELEASE_NOTES_v1.1.0.md` as template
   - Include changelog highlights
   - Add migration guide if needed

3. **Update GitHub README:**
   - Ensure `.github/README.md` is up to date
   - Include installation instructions
   - Link to documentation

## Checklist

Before publishing:

- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated
- [ ] README.md updated
- [ ] Build succeeds
- [ ] Tests pass (if applicable)
- [ ] Documentation updated
- [ ] Release notes prepared
- [ ] GitHub release created
