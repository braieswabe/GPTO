# AI Search Optimization Guide

## Understanding AI Search vs Traditional SEO

**GPTO (GPT Optimization)** optimizes your website specifically for **AI search engines** like ChatGPT, Perplexity, Claude, and other GPT-powered search tools. Unlike traditional SEO (which optimizes for Google/Bing), GPTO focuses on making your content easily discoverable and understandable by AI models.

### Key Differences

| Aspect | Traditional SEO | AI Search Optimization (GPTO) |
|--------|----------------|-------------------------------|
| **Target** | Search engines (Google, Bing) | AI models (ChatGPT, Perplexity, Claude) |
| **Primary Focus** | Keywords, backlinks, page speed | Structured data, authority signals, factual accuracy |
| **Content Format** | HTML text, meta tags | JSON-LD schemas, structured data |
| **Authority Signals** | Domain authority, backlinks | Authority Grove, partner networks, sameAs links |
| **Ranking Factors** | PageRank, relevance, user signals | Schema completeness, factual accuracy, authority signals |
| **Optimization** | Keyword density, meta descriptions | Schema quality, semantic structure, AI comprehension |

### Why AI Models Need Structured Data

AI models rely heavily on structured data (JSON-LD schemas) because:

1. **Direct Parsing**: AI models can directly parse JSON-LD schemas without HTML parsing complexity
2. **Context Understanding**: Structured data provides clear context about entities, relationships, and properties
3. **Factual Accuracy**: AI models prioritize authoritative sources with complete structured data
4. **Semantic Understanding**: Schemas help AI models understand the meaning and relationships in your content

## Key Optimization Strategies

### 1. JSON-LD Schema Best Practices

#### Required Elements

- **@context**: Always use `"https://schema.org"` as the context
- **@type**: Specify the schema type (Organization, Product, Service, FAQPage, etc.)
- **Complete Properties**: Fill in all relevant properties for your schema type

#### Example: Organization Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Your Company Name",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png",
  "sameAs": [
    "https://twitter.com/yourcompany",
    "https://linkedin.com/company/yourcompany",
    "https://github.com/yourcompany"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service"
  }
}
```

#### Schema Types by Tier

- **Bronze**: Organization schema (required)
- **Silver**: Organization + Product/Service schemas
- **Gold**: Full schema deployment with dynamic schemas

### 2. Authority Grove Setup

Authority Grove builds trust signals and partner relationships that AI models recognize.

#### Configuration

```json
{
  "panthera_blackbox": {
    "authority_grove": {
      "keywords": ["your", "industry", "keywords"],
      "verticals": ["your", "industry", "verticals"],
      "partners": [
        {
          "name": "Partner Name",
          "url": "https://partner.com",
          "relationship": "partner"
        }
      ]
    }
  }
}
```

#### Best Practices

- **Keywords**: Use 5-10 relevant industry keywords
- **Verticals**: Specify 2-5 industry verticals
- **Partners**: List authoritative partners and relationships
- **sameAs Links**: Include social media profiles and partner sites

### 3. TruthSeeker Integration

TruthSeeker re-ranks content based on:
- **Intent**: User intent matching
- **Authority**: Source authority signals
- **Fairness**: Balanced representation
- **Recency**: Up-to-date information

Ensure your content is:
- **Accurate**: Factually correct information
- **Current**: Regularly updated content
- **Balanced**: Fair representation of topics
- **Authoritative**: From trusted sources

### 4. Telemetry Tracking

Monitor AI search visibility through telemetry:

- **Schema Completeness**: Track how complete your schemas are
- **Authority Signals**: Monitor authority signal strength
- **Structured Data Quality**: Measure structured data quality scores
- **Search Visibility**: Overall AI search visibility score

## Metrics & Analytics

### AI Search Visibility Score

The AI Search Visibility Score (0-100) is calculated from:

1. **Schema Quality (30 points)**
   - Valid Schema.org context
   - Schema type declarations
   - Organization schema presence

2. **Authority Signals (25 points)**
   - sameAs links in schemas
   - Authority Grove configuration
   - Keywords and verticals

3. **Structured Data Completeness (20 points)**
   - Organization schema
   - Tier-appropriate schemas (Product/Service for Silver/Gold)
   - FAQ schemas if applicable

4. **Factual Accuracy (15 points)**
   - Clear, descriptive content
   - Semantic structure (H1, headings)
   - Descriptive paragraphs

5. **Traditional Elements (10 points)**
   - Title tag optimization
   - Meta description

### Interpreting Dashboard Metrics

- **Score 80-100**: Excellent AI search visibility
- **Score 60-79**: Good visibility, minor improvements needed
- **Score 40-59**: Moderate visibility, significant improvements needed
- **Score 0-39**: Poor visibility, critical issues to address

### Schema Completeness Metrics

- **0.0-0.3**: Missing critical schemas
- **0.4-0.6**: Basic schemas present, incomplete
- **0.7-0.9**: Good schema coverage
- **1.0**: Complete schema deployment

### Authority Signal Strength

- **0.0-0.3**: Weak authority signals
- **0.4-0.6**: Moderate authority signals
- **0.7-0.9**: Strong authority signals
- **1.0**: Maximum authority signals

## Best Practices

### 1. Complete Authority Grove Setup

- Configure all Authority Grove fields
- Add partner relationships
- Include sameAs links for social profiles
- Specify keywords and verticals

### 2. Rich Schema Deployment

- Start with Organization schema (required)
- Add Product/Service schemas for Silver/Gold tiers
- Include FAQ schemas for Q&A content
- Use dynamic schemas for Gold tier

### 3. Factual Accuracy Maintenance

- Regularly review and update content
- Ensure information is current and accurate
- Use clear, descriptive language
- Maintain semantic structure (headings, paragraphs)

### 4. Regular Optimization Cycles

- Run audits monthly
- Review AI Search Visibility scores
- Address critical issues immediately
- Track improvements over time

## Troubleshooting

### Low AI Search Visibility Scores

**Problem**: Score below 60

**Solutions**:
1. Check for missing Organization schema
2. Verify Schema.org context is correct
3. Ensure Authority Grove is configured
4. Add sameAs links to schemas
5. Improve structured data completeness

### Schema Validation Issues

**Problem**: Schemas not being recognized

**Solutions**:
1. Verify JSON-LD syntax is valid
2. Check @context is "https://schema.org"
3. Ensure @type is a valid Schema.org type
4. Validate JSON structure
5. Check for script tag formatting

### Authority Signal Problems

**Problem**: Low authority signal strength

**Solutions**:
1. Configure Authority Grove keywords
2. Add verticals to Authority Grove
3. Include sameAs links in Organization schema
4. Build partner relationships
5. Ensure partner links are valid

### Missing Schema Types

**Problem**: Required schemas not present

**Solutions**:
1. Add Organization schema (required for all tiers)
2. Add Product/Service schemas for Silver/Gold
3. Include FAQ schemas for Q&A content
4. Use dynamic schemas for Gold tier
5. Verify schemas are injected correctly

## Advanced Optimization

### Dynamic Schema Injection

Gold tier includes dynamic schema injection through Black Box runtime:

- Schemas update automatically based on content
- Real-time schema generation
- Context-aware schema selection
- Telemetry-driven optimization

### Multi-Market Authority Graph

Gold tier includes multi-market authority graph:

- Track authority across markets
- Compare with competitors
- Identify optimization opportunities
- Monitor authority trends

### AI-Driven Link Building

Gold tier includes AI-driven link and reputation building:

- Identify authoritative link opportunities
- Build partner relationships
- Monitor reputation signals
- Optimize for AI recognition

## Getting Started

1. **Install Black Box**: Follow [BLACK_BOX_INSTALLATION.md](./BLACK_BOX_INSTALLATION.md)
2. **Configure Authority Grove**: Set up keywords, verticals, and partners
3. **Deploy Schemas**: Start with Organization schema, add tier-appropriate schemas
4. **Run Audit**: Use the dashboard to run technical audits
5. **Monitor Metrics**: Track AI Search Visibility scores and improvements
6. **Optimize**: Address recommendations and improve scores over time

## Resources

- [Black Box Installation Guide](./BLACK_BOX_INSTALLATION.md)
- [Schema.org Documentation](https://schema.org/)
- [GPTO Dashboard](./README.md)
- [Technical Audit Documentation](./packages/audit/README.md)

## Support

For questions or issues:
- Check the troubleshooting section above
- Review audit recommendations in the dashboard
- Consult the GPTO documentation
- Contact support for Gold tier users
