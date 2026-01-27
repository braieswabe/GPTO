# GPTO Audit Package

This package includes two audit tracks:

- Technical audit (AI search optimization)
- Site audit (AI readiness, structure, content depth, technical readiness)

## Site audit scoring

### AI Readiness (overall score)
- Four dimensions: what, who, how, trust
- Each dimension targets 35% page coverage and contributes up to 25 points
- Base score is capped at 94
- Homepage bonus: +3 if homepage includes WHAT keywords, +3 if homepage includes HOW keywords
- Max score: 100

### Structure
- 40 * titleRate
- 35 * h1Rate
- 25 * metaRate
- Max score: 100

### Content Depth
- Text length score: 75 when avgText >= 6000
- H2 score: 25 when avgH2 >= 6
- Max score: 100

### Technical Readiness
- 45 * jsonLdRate
- 30 * canonicalRate
- 25 * (1 - errorRate)
- Max score: 100
