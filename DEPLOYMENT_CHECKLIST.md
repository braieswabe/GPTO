# Deployment Checklist

## ✅ Completed Tasks

### 1. Database Migration
- ✅ Migration `0001_dashboard_signals.sql` is ready
- ✅ Migration registered in `packages/database/migrations/meta/_journal.json`
- ✅ Script created: `scripts/run-migration-production.sh`

**To run migration in production:**
```bash
# Set DATABASE_URL_UNPOOLED environment variable
export DATABASE_URL_UNPOOLED="postgresql://..."

# Run migration
pnpm db:migrate
# OR
./scripts/run-migration-production.sh
```

### 2. Black Box Runtime
- ✅ Updated `apps/black-box/src/runtime.ts` with new telemetry fields:
  - `event_type` (page_view, interaction, search, custom)
  - `session_id` (UUID)
  - `page` (JSONB with url, path, title)
  - `search` (JSONB with query, results_count, selected_result)
- ✅ Runtime built successfully (dist/runtime.js and dist/runtime.global.js)
- ✅ TypeScript types generated (dist/runtime.d.ts)

**To deploy:**
- The runtime is automatically built during dashboard build (`prebuild` script)
- Built files are copied to dashboard public directory

### 3. Scheduled Jobs (Cron)
- ✅ Created `/api/cron/refresh-rollups` endpoint
- ✅ Added Vercel cron configuration in `vercel.json`
- ✅ Cron schedule: Daily at 2 AM UTC (`0 2 * * *`)

**Configuration:**
- Set `CRON_SECRET` environment variable in Vercel
- Endpoint refreshes:
  - Telemetry rollups (daily aggregations)
  - Authority signals
  - Confusion signals

### 4. Testing Framework
- ✅ Set up Vitest testing framework
- ✅ Created test files:
  - `apps/dashboard/src/app/api/dashboard/telemetry/route.test.ts`
  - `apps/dashboard/src/app/api/dashboard/authority/route.test.ts`
  - `apps/dashboard/src/app/api/dashboard/confusion/route.test.ts`
  - `apps/dashboard/src/app/api/dashboard/export/route.test.ts`
  - `apps/dashboard/src/app/api/cron/refresh-rollups/route.test.ts`

**To run tests:**
```bash
cd apps/dashboard
pnpm test
pnpm test:ui  # For UI mode
```

### 5. PDF Export
- ✅ Implemented PDF generation using `pdfkit`
- ✅ Export endpoint supports `format=json` (default) and `format=pdf`
- ✅ PDF includes:
  - Header with generation date and range
  - Telemetry summary
  - Authority & Trust metrics
  - Confusion & Mismatch data
  - Schema & Structure scores
  - Coverage & Gaps analysis
  - Executive Summary insights

**Usage:**
```
GET /api/dashboard/export?format=pdf&range=7d&siteId=<site-id>
```

## 📋 Deployment Steps

### Step 1: Run Database Migration
```bash
# In production environment
export DATABASE_URL_UNPOOLED="your-production-db-url"
pnpm db:migrate
```

### Step 2: Set Environment Variables
In Vercel dashboard, set:
- `CRON_SECRET` - Secret key for cron job authentication (optional but recommended)

### Step 3: Deploy to Vercel
```bash
git add .
git commit -m "Deploy dashboard signals migration, cron jobs, and PDF export"
git push origin main
```

Vercel will automatically:
- Build Black Box runtime
- Build dashboard application
- Deploy API routes including cron endpoint
- Set up cron job schedule

### Step 4: Verify Deployment

1. **Check Migration:**
   ```sql
   SELECT * FROM dashboard_rollups_daily LIMIT 1;
   SELECT * FROM authority_signals LIMIT 1;
   SELECT * FROM confusion_signals LIMIT 1;
   SELECT * FROM coverage_signals LIMIT 1;
   ```

2. **Test Cron Job:**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/cron/refresh-rollups \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

3. **Test PDF Export:**
   ```bash
   curl "https://your-domain.vercel.app/api/dashboard/export?format=pdf&range=7d" \
     -H "Authorization: Bearer <your-token>" \
     -o report.pdf
   ```

4. **Run Tests:**
   ```bash
   cd apps/dashboard
   pnpm test
   ```

## 🔍 Verification Checklist

- [ ] Migration `0001_dashboard_signals.sql` applied successfully
- [ ] New tables exist: `dashboard_rollups_daily`, `authority_signals`, `confusion_signals`, `coverage_signals`
- [ ] Telemetry events table has new columns: `event_type`, `session_id`, `page`, `search`
- [ ] Black Box runtime deployed and serving from CDN
- [ ] Cron job endpoint accessible at `/api/cron/refresh-rollups`
- [ ] Vercel cron job scheduled (check Vercel dashboard)
- [ ] PDF export working (`format=pdf` parameter)
- [ ] All tests passing
- [ ] Dashboard endpoints returning data with new fields

## 📝 Notes

- The cron job runs daily at 2 AM UTC to refresh rollups and signals
- PDF export is available for all dashboard data
- Tests use Vitest with mocked dependencies
- Black Box runtime is automatically built during dashboard build process
