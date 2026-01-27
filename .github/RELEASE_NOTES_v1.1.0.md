# Release Notes - v1.1.0

## 🚀 Automatic Server-Side Schema Injection

We're excited to announce **v1.1.0** with automatic server-side schema injection! This major update makes schemas visible to external audit tools without requiring manual HTML edits.

## What's New

### ✨ Automatic Server-Side Schema Injection

Schemas are now automatically generated and can be injected server-side, making them visible to external audit tools that don't execute JavaScript.

**New API Endpoints:**
- `GET /api/sites/[id]/render` - Returns HTML script tags with schemas
- `GET /api/sites/[id]/proxy?url=<target-url>` - Proxies website with schemas injected

**New Utilities:**
- `generateSchemaScriptTags()` - Generate HTML script tags from config
- `injectSchemasIntoHTML()` - Inject schemas into existing HTML
- `generateOrganizationSchema()` - Generate Organization schema
- `generateAllSchemas()` - Generate all schemas for a config

### 🔧 Configuration Fixes

- Fixed autofill forms schema validation
- Now requires `selector` and `map` properties (was missing)
- Improved error messages for invalid configurations

### 📚 Documentation

- Updated installation guides with server-side injection
- Added integration examples (Next.js, React, PHP, Express.js)
- Created sample configuration files for different industries
- Added troubleshooting guides

## Installation

### Update Package

```bash
npm install @careerdriver/black-box@latest
# or
pnpm add @careerdriver/black-box@latest
```

### Add Server-Side Schema Injection

**Next.js / React:**
```tsx
const schemas = await fetch(
  `/api/sites/${siteId}/render`
);
const schemaHTML = await schemas.text();

<div dangerouslySetInnerHTML={{ __html: schemaHTML }} />
```

**PHP:**
```php
<?php
$schemas = file_get_contents(
  "https://gpto-dashboard.vercel.app/api/sites/{$siteId}/render"
);
echo $schemas;
?>
```

## Breaking Changes

### Configuration Schema

- `autofill.forms[]` now requires `selector` property
- Structure changed from field definitions to form objects

**Migration:**
```json
// Before (Invalid)
"forms": [
  {
    "id": "student_id",
    "label": "Student ID",
    "type": "text"
  }
]

// After (Valid)
"forms": [
  {
    "selector": "form",
    "map": {
      "student_id": "#student_id"
    }
  }
]
```

## Benefits

✅ **External Audit Tools** can see schemas (they're in initial HTML)  
✅ **Automatic Updates** when config changes  
✅ **Telemetry Integration** improves schemas over time  
✅ **No Manual Work** required after initial setup  

## Upgrade Guide

1. Update package: `npm install @careerdriver/black-box@latest`
2. Add server-side schema injection (see examples above)
3. Update autofill configuration if needed
4. Verify schemas are visible in page source

## Documentation

- [Installation Guide](../INSTALLATION_UPDATED.md)
- [Automatic Schema Injection](../AUTOMATIC_SCHEMA_INJECTION.md)
- [Configuration Samples](../samples/README.md)
- [CHANGELOG](../CHANGELOG.md)

## Support

For issues or questions:
- Check [Troubleshooting Guide](../AUDIT_TROUBLESHOOTING.md)
- Review [Configuration Fix Summary](../CONFIG_FIX_SUMMARY.md)
- Open an issue on GitHub

---

**Version:** 1.1.0  
**Release Date:** January 28, 2026
