# Feature Deployment Guide with Schema Changes

This guide walks you through the complete process of implementing and deploying a new feature that requires database schema changes, including Planetscale's branching workflow and CI/CD integration.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Workflow](#development-workflow)
4. [Planetscale Database Branching](#planetscale-database-branching)
5. [Schema Changes and Migrations](#schema-changes-and-migrations)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Deployment Process](#deployment-process)
8. [Rollback Procedures](#rollback-procedures)
9. [Best Practices](#best-practices)

---

## Overview

The deployment process for features with schema changes follows this high-level flow:

```
1. Create Git branch → 2. Create Planetscale branch → 3. Develop feature
                                                              ↓
8. Deploy to Production ← 7. Merge Planetscale branch ← 4. Create Deploy Request
                                                              ↓
                                                         5. Run CI/CD
                                                              ↓
                                                         6. Test & Review
```

---

## Prerequisites

Before starting, ensure you have:

- [x] Planetscale CLI installed: `brew install planetscale/tap/pscale`
- [x] Planetscale account with database created
- [x] Git repository access
- [x] Vercel account connected to your repository
- [x] Environment variables configured in Vercel

---

## Development Workflow

### Step 1: Create Git Feature Branch

```bash
# From main branch
git checkout main
git pull origin main

# Create your feature branch
git checkout -b feature/add-user-profiles
```

### Step 2: Create Planetscale Database Branch

Planetscale branches allow you to safely make schema changes without affecting production.

```bash
# Authenticate with Planetscale (one-time setup)
pscale auth login

# Create a new database branch from main
pscale branch create <database-name> feature-add-user-profiles --from main

# Get the connection string for your branch
pscale connect <database-name> feature-add-user-profiles --port 3309
```

**Important:** Keep this connection open in a separate terminal while developing.

### Step 3: Update Your Local Environment

Create or update your local `.env` file to point to the branch database:

```bash
# apps/api/.env
DATABASE_URL="mysql://127.0.0.1:3309/<database-name>"

# packages/db/.env
DATABASE_URL="mysql://127.0.0.1:3309/<database-name>"
```

---

## Schema Changes and Migrations

### Step 4: Define Schema Changes

Update your Drizzle schema in `packages/db/src/schema/`:

**Example: Adding user profiles**

```typescript
// packages/db/src/schema/profiles.ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  website: varchar("website", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

Export from schema index:

```typescript
// packages/db/src/schema/index.ts
export * from "./users";
export * from "./profiles";  // Add this
```

### Step 5: Generate Migration

```bash
cd packages/db

# Generate migration files from schema changes
bun run db:generate

# Review the generated migration in drizzle/migrations/
```

This creates SQL migration files in the `drizzle/` folder.

### Step 6: Apply Migration to Branch Database

```bash
# Make sure your pscale connect is still running
cd packages/db
bun run db:migrate
```

### Step 7: Test Schema Changes Locally

```bash
# Start the API with the branch database
cd apps/api
bun run dev

# Test your endpoints
curl http://localhost:3000/profiles
```

---

## Planetscale Database Branching

### Understanding Planetscale Branches

Planetscale branches work similarly to Git branches:

- **main**: Production database
- **feature branches**: Development databases with schema changes
- **Deploy Requests**: Like pull requests for schema changes

### Create a Deploy Request

Once your schema changes are tested:

```bash
# Create a deploy request to merge your branch into main
pscale deploy-request create <database-name> feature-add-user-profiles

# List deploy requests
pscale deploy-request list <database-name>

# View specific deploy request
pscale deploy-request show <database-name> <deploy-request-number>
```

### Review Deploy Request

1. **Via CLI:**
   ```bash
   pscale deploy-request diff <database-name> <deploy-request-number>
   ```

2. **Via Dashboard:**
   - Go to https://app.planetscale.com
   - Navigate to your database
   - Click "Deploy requests"
   - Review the schema diff

### Deploy Request Checks

Planetscale automatically runs safety checks:
- ✅ **Safe migrations**: Non-destructive changes
- ⚠️ **Potential issues**: Column drops, type changes
- ❌ **Blocked migrations**: Breaking changes

---

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.1.38

      - name: Install dependencies
        run: bun install

      - name: Type check
        run: bun run type-check

      - name: Build
        run: bun run build

  deploy-preview:
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/api

  deploy-production:
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./apps/api
```

### Required GitHub Secrets

Set these in your GitHub repository settings:

```
VERCEL_TOKEN          - From Vercel Account Settings → Tokens
VERCEL_ORG_ID         - From Vercel project settings
VERCEL_PROJECT_ID     - From Vercel project settings
TURBO_TOKEN           - From Vercel (optional, for Remote Cache)
TURBO_TEAM            - Your Turbo team slug (optional)
```

### Vercel Environment Variables

Configure in Vercel Dashboard:

**Preview Environment:**
```bash
DATABASE_URL=<planetscale-branch-connection-string>
```

**Production Environment:**
```bash
DATABASE_URL=<planetscale-main-connection-string>
```

---

## Deployment Process

### Complete Feature Deployment Checklist

#### Phase 1: Development (Local)
- [ ] Create Git feature branch
- [ ] Create Planetscale database branch
- [ ] Connect to branch database locally
- [ ] Update schema in `packages/db/src/schema/`
- [ ] Generate migrations with `bun run db:generate`
- [ ] Apply migrations with `bun run db:migrate`
- [ ] Implement feature code
- [ ] Test locally with branch database
- [ ] Commit changes to Git

#### Phase 2: Review (Staging)
- [ ] Push Git branch to remote
- [ ] Create Pull Request on GitHub
- [ ] CI/CD runs tests and builds
- [ ] Create Planetscale Deploy Request
- [ ] Review schema changes in Planetscale Dashboard
- [ ] Vercel deploys preview environment
- [ ] Test preview deployment
- [ ] Get code review approval

#### Phase 3: Database Deployment
- [ ] Approve Planetscale Deploy Request
- [ ] Deploy schema changes to production database
- [ ] Verify schema changes in production database
- [ ] **Wait for deployment to complete** (this is crucial!)

#### Phase 4: Application Deployment
- [ ] Merge Pull Request to main
- [ ] CI/CD automatically deploys to Vercel Production
- [ ] Monitor deployment logs
- [ ] Verify production application
- [ ] Monitor error rates and metrics

### Detailed Deployment Steps

#### 1. Create Pull Request

```bash
git add .
git commit -m "feat: add user profiles functionality"
git push origin feature/add-user-profiles
```

Create PR on GitHub and ensure CI passes.

#### 2. Deploy Database Changes

```bash
# Create deploy request
pscale deploy-request create <database-name> feature-add-user-profiles

# Review the diff
pscale deploy-request diff <database-name> 1

# Deploy (can also be done via dashboard)
pscale deploy-request deploy <database-name> 1
```

**Important:** Wait for the schema deployment to complete before merging your PR.

#### 3. Verify Schema Changes

```bash
# Connect to production database
pscale shell <database-name> main

# Verify tables
SHOW TABLES;

# Check schema
DESCRIBE profiles;

# Exit shell
exit
```

#### 4. Deploy Application

Once database changes are live:

1. Merge PR on GitHub
2. CI/CD automatically deploys to Vercel
3. Monitor deployment in Vercel Dashboard

#### 5. Post-Deployment Verification

```bash
# Test production API
curl https://your-api.vercel.app/health
curl https://your-api.vercel.app/profiles

# Check Vercel logs
vercel logs <deployment-url>
```

---

## Rollback Procedures

### Database Rollback

Planetscale doesn't support automatic rollbacks, but you can:

1. **Create a reverse migration:**
   ```bash
   # Create new branch from main
   pscale branch create <database-name> rollback-profiles --from main

   # Connect and test rollback
   pscale connect <database-name> rollback-profiles --port 3309
   ```

2. **Apply reverse migration:**
   ```typescript
   // Create reverse migration manually
   // drizzle/rollback_profiles.sql
   DROP TABLE IF EXISTS profiles;
   ```

3. **Deploy rollback:**
   ```bash
   pscale deploy-request create <database-name> rollback-profiles
   pscale deploy-request deploy <database-name> <number>
   ```

### Application Rollback

Vercel makes this easy:

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback <previous-deployment-url>
```

Or via Vercel Dashboard:
1. Go to your project
2. Click "Deployments"
3. Find the previous working deployment
4. Click "..." → "Promote to Production"

---

## Best Practices

### Schema Changes

1. **Always be backwards compatible**
   - Add columns as nullable or with defaults
   - Never drop columns immediately
   - Use feature flags for new features

2. **Use safe migrations**
   ```sql
   -- ✅ Good: Add nullable column
   ALTER TABLE users ADD COLUMN phone VARCHAR(20);

   -- ✅ Good: Add column with default
   ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'active';

   -- ❌ Avoid: Drop column immediately
   ALTER TABLE users DROP COLUMN old_field;

   -- ✅ Better: Deprecate first, drop later
   -- 1. Stop using the column in code
   -- 2. Deploy application
   -- 3. Wait a few days
   -- 4. Then drop the column
   ```

3. **Test with production-like data**
   - Use Planetscale's branching to test with production data
   - Test migration performance on large tables

### Deployment Timing

1. **Deploy during low-traffic periods**
2. **Database first, application second**
3. **Monitor for at least 1 hour post-deployment**
4. **Have rollback plan ready**

### Version Control

1. **Never commit `.env` files**
2. **Always commit migration files**
3. **Use semantic commit messages:**
   ```
   feat: add user profiles feature
   fix: correct profile avatar upload
   db: add profiles table migration
   ```

### Monitoring

1. **Set up error tracking** (e.g., Sentry)
2. **Monitor database performance** (Planetscale Insights)
3. **Track API metrics** (Vercel Analytics)
4. **Set up alerts** for critical errors

### Documentation

1. **Update API documentation** in `apps/api/API.md`
2. **Update README** if architecture changes
3. **Document breaking changes** in CHANGELOG.md
4. **Add inline code comments** for complex logic

---

## Example: Complete Feature Implementation

Let's walk through adding a complete feature: **User Posts**

### 1. Setup

```bash
# Git branch
git checkout -b feature/user-posts

# Planetscale branch
pscale branch create mydb feature-user-posts --from main
pscale connect mydb feature-user-posts --port 3309
```

### 2. Schema Changes

```typescript
// packages/db/src/schema/posts.ts
import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  published: boolean("published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

### 3. Generate & Apply Migration

```bash
cd packages/db
bun run db:generate
bun run db:migrate
```

### 4. Create Posts Package

```bash
# Create package structure
mkdir -p packages/posts/src

# Similar to packages/users, create service.ts, types.ts, index.ts
```

### 5. Add API Endpoints

```typescript
// apps/api/src/routes/posts.ts
import { Hono } from "hono";
// ... implement CRUD endpoints
```

### 6. Test Locally

```bash
cd apps/api
bun run dev

# Test endpoints
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"userId": "...", "title": "Test", "content": "..."}'
```

### 7. Deploy

```bash
# Commit and push
git add .
git commit -m "feat: add user posts feature with CRUD endpoints"
git push origin feature/user-posts

# Create PR on GitHub
# Wait for CI to pass

# Deploy database
pscale deploy-request create mydb feature-user-posts
# Review in dashboard and deploy

# Merge PR (triggers production deployment)
```

### 8. Verify

```bash
# Check production
curl https://your-api.vercel.app/posts

# Monitor logs
vercel logs --follow
```

---

## Troubleshooting

### Common Issues

1. **Migration fails on branch**
   - Check connection: `pscale connect` running?
   - Verify DATABASE_URL in .env
   - Check migration SQL for errors

2. **Deploy request shows breaking changes**
   - Review the diff carefully
   - Make migrations backwards compatible
   - Consider multi-phase deployment

3. **Production deployment fails**
   - Check Vercel logs
   - Verify environment variables
   - Ensure DATABASE_URL points to main branch
   - Check if schema changes are deployed

4. **Type errors after schema changes**
   - Regenerate types: `bun run db:generate`
   - Restart TypeScript server
   - Clear `.turbo` cache: `bun run clean`

---

## Additional Resources

- [Planetscale Documentation](https://planetscale.com/docs)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Turbo Documentation](https://turbo.build/docs)

---

## Questions?

If you encounter issues not covered in this guide:
1. Check Planetscale dashboard for deploy request status
2. Review Vercel deployment logs
3. Check CI/CD workflow runs on GitHub
4. Consult team leads or create an issue in the repository
