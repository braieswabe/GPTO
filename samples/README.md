# Configuration Sample Files

This directory contains sample JSON configuration files that follow the Panthera Black Box schema structure. Use these as templates when creating configurations for your sites.

## Files

### `config-minimal.json`
A minimal configuration with only required fields. Use this as a starting point for basic setups.

**Features:**
- Basic site information
- Minimal telemetry
- Basic authority grove setup
- No autofill, ads, or SEO enhancements

### `config-ecommerce.json`
A full-featured e-commerce store configuration.

**Features:**
- Multiple form autofill configurations
- Multiple ad slots with contexts
- Geo nodes enabled
- Comprehensive SEO enhancements
- Authority grove with partners and trust edges
- Truthseeker weights optimized for product discovery

### `config-healthcare.json`
A healthcare clinic configuration with HIPAA considerations.

**Features:**
- Appointment and contact form autofill
- Privacy-focused policy settings
- Medical organization authority grove
- Healthcare-specific SEO content
- Authority-focused truthseeker weights

### `config-restaurant.json`
A restaurant configuration optimized for local search and reservations.

**Features:**
- Reservation form autofill
- Geo nodes with city/attraction templates
- Restaurant-specific schema
- Local SEO optimizations
- Intent-focused truthseeker weights

### `config-mapua.json` (Reference)
The Mapua University Queueing System configuration (located in parent directory as `mapua-config-corrected.json`).

**Features:**
- Educational institution setup
- Queue management system
- Academic tier configuration
- Campus services focus

## Common Patterns

### Autofill Forms
Each form configuration requires:
- `selector`: CSS selector for the form element (e.g., `"form#checkout-form"`)
- `map`: Object mapping logical field names to CSS selectors

```json
"autofill": {
  "enabled": true,
  "forms": [
    {
      "selector": "form#my-form",
      "map": {
        "field_name": "#field_id",
        "another_field": ".field-class"
      }
    }
  ]
}
```

### Authority Grove
Required fields for `node`:
- `id`: Full URL of the organization
- `type`: Schema.org type (e.g., "Organization", "Restaurant", "MedicalOrganization")
- `name`: Display name

Optional but recommended:
- `sameAs`: Array of related URLs (social media, directories)
- `keywords`: Array of relevant keywords

### Truthseeker Weights
All weights must be between 0 and 1, and typically sum to 1.0:
- `intent_match`: How well content matches user intent
- `anchor_match`: Anchor text relevance
- `authority`: Source authority/trustworthiness
- `recency`: Content freshness
- `fairness`: Balanced representation

### SEO Enhancements
Structure enhancements help improve page structure:
- `h1_text`: Primary heading text
- `enhance_title`: Whether to enhance page titles
- `title_template`: Template for generating titles
- `inject_h1_if_missing`: Add H1 if not present

Content depth helps ensure sufficient content:
- `min_h2_count`: Minimum number of H2 headings
- `h2_templates`: Suggested H2 heading templates
- `content_templates`: Template content for sections

## Validation

All sample configurations are validated against the schema. To validate your own configuration:

```typescript
import { siteConfigSchema } from '@gpto/schemas/src/site-config';
import { validator } from '@gpto/schemas/src/validator';

const isValid = validator.validate(siteConfigSchema, yourConfig);
if (!isValid) {
  console.error('Validation errors:', validator.getErrors());
}
```

## Required Fields

Every configuration must include:
- `panthera_blackbox.version`
- `panthera_blackbox.site.domain`
- `panthera_blackbox.site.brand`
- `panthera_blackbox.site.verticals` (array)
- `panthera_blackbox.site.geo` (array)
- `panthera_blackbox.telemetry.emit`
- `panthera_blackbox.telemetry.keys` (array)
- `panthera_blackbox.policy.privacy_mode` ("anon" | "full" | "minimal")
- `panthera_blackbox.policy.log_level` ("basic" | "detailed" | "verbose")

## Best Practices

1. **Start with minimal config**: Begin with `config-minimal.json` and add features as needed
2. **Use specific selectors**: Prefer IDs over classes for form selectors (`#form-id` vs `.form-class`)
3. **Complete authority grove**: Fill in `sameAs` and `keywords` for better authority signals
4. **Match truthseeker weights to use case**: E-commerce favors intent, healthcare favors authority
5. **Test autofill mappings**: Ensure CSS selectors in `map` match your actual form fields
6. **Validate before deploying**: Always validate configurations against the schema

## Notes

- All configurations use `strict: false` in validation, so additional properties are allowed but not validated
- The `tier` field is used by the runtime but not validated by the schema
- Geo codes should use ISO 3166-1 alpha-2 format (e.g., "US", "CA", "PH")
- Domain should not include protocol (e.g., "example.com" not "https://example.com")
