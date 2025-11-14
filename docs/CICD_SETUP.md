# CI/CD Pipeline Setup

Complete guide to setting up and configuring the CI/CD pipeline for the TypeScript monorepo with Vercel deployment.

## Table of Contents

1. [Overview](#overview)
2. [GitHub Actions Setup](#github-actions-setup)
3. [Vercel Integration](#vercel-integration)
4. [Environment Variables](#environment-variables)
5. [Pipeline Stages](#pipeline-stages)
6. [Turbo Cache](#turbo-cache)
7. [Best Practices](#best-practices)

---

## Overview

Our CI/CD pipeline handles:

- ✅ **Continuous Integration**: Type checking, linting, building
- ✅ **Preview Deployments**: Automatic preview for every PR
- ✅ **Production Deployments**: Automatic deploy on merge to main
- ✅ **Caching**: Turbo Remote Cache for faster builds
- ✅ **Environment Management**: Separate configs for preview/production

### Pipeline Flow

```
┌─────────────────┐
│  Push to Branch │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Run CI Tests  │
│ • Type Check    │
│ • Build         │
└────────┬────────┘
         │
         ▼
    ┌────────┐
    │ PR?    │
    └───┬─┬──┘
        │ │
    Yes │ │ No
        │ │
        ▼ │
  ┌─────────────┐
  │   Preview   │
  │ Deployment  │
  └─────────────┘
        │
        ▼
  ┌──────────┐
  │  Review  │
  └────┬─────┘
       │
       ▼
  ┌─────────┐
  │  Merge  │
  └────┬────┘
       │
       ▼
  ┌──────────────┐
  │  Production  │
  │  Deployment  │
  └──────────────┘
```

---

## GitHub Actions Setup

### 1. Create Workflow Directory

```bash
mkdir -p .github/workflows
```

### 2. Create CI/CD Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
  TURBO_REMOTE_ONLY: true

jobs:
  # Job 1: Run tests and checks
  test:
    name: Test & Build
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.1.38

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.bun/install/cache
            node_modules
            apps/*/node_modules
            packages/*/node_modules
          key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
          restore-keys: |
            ${{ runner.os }}-bun-

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Type check
        run: bun run type-check

      - name: Build all packages
        run: bun run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            apps/api/dist
            packages/*/dist
          retention-days: 1

  # Job 2: Deploy preview for PRs
  deploy-preview:
    name: Deploy Preview
    needs: test
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.1.38

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v25
        id: vercel-preview
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/api
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Comment PR with preview URL
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const url = '${{ steps.vercel-preview.outputs.preview-url }}';
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `✅ Preview deployment ready!\n\n🔗 **Preview URL**: ${url}\n\n📝 Changes deployed successfully.`
            });

  # Job 3: Deploy to production
  deploy-production:
    name: Deploy Production
    needs: test
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.1.38

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./apps/api
          scope: ${{ secrets.VERCEL_ORG_ID }}

      - name: Create deployment notification
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.repos.createDeployment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              ref: context.sha,
              environment: 'production',
              auto_merge: false,
              required_contexts: []
            });
```

### 3. Create Separate Workflow for Linting (Optional)

Create `.github/workflows/lint.yml`:

```yaml
name: Lint

on:
  pull_request:
    branches:
      - main
      - develop

jobs:
  lint:
    name: Run Linters
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: oven-sh/setup-bun@v1
        with:
          bun-version: 1.1.38

      - name: Install dependencies
        run: bun install

      - name: Run linters
        run: bun run lint
```

---

## Vercel Integration

### 1. Install Vercel CLI

```bash
bun add -g vercel
```

### 2. Link Project to Vercel

```bash
# Login to Vercel
vercel login

# Link your project
cd apps/api
vercel link
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your username/org
- **Link to existing project?** No (first time)
- **Project name?** typescript-monorepo-api
- **Directory?** ./

### 3. Get Vercel Credentials

```bash
# Get your Vercel token
# Go to https://vercel.com/account/tokens
# Create new token

# Get org ID and project ID from .vercel/project.json
cat .vercel/project.json
```

Output:
```json
{
  "orgId": "team_xxxxxxxxx",
  "projectId": "prj_xxxxxxxxx"
}
```

### 4. Configure Vercel Project Settings

#### Via Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings**

#### Build Settings
- **Framework Preset**: Other
- **Build Command**: `cd ../.. && bun install && cd apps/api && bun run build`
- **Output Directory**: `apps/api/dist`
- **Install Command**: `bun install`

#### Root Directory
- Set to: `apps/api`

---

## Environment Variables

### GitHub Secrets

Add these secrets in GitHub:
**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | Vercel Account Settings → Tokens |
| `VERCEL_ORG_ID` | Organization/team ID | `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | Project ID | `.vercel/project.json` |
| `TURBO_TOKEN` | Turbo Remote Cache token | Vercel Account Settings → Tokens |
| `TURBO_TEAM` | Turbo team slug | Your Vercel team slug |

#### Setting Secrets via CLI

```bash
# Using GitHub CLI
gh secret set VERCEL_TOKEN

# Or manually add in GitHub UI
```

### Vercel Environment Variables

#### Preview Environment

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Select **Preview** environment

```bash
DATABASE_URL="<planetscale-preview-branch-connection-string>"
NODE_ENV="development"
LOG_LEVEL="debug"
```

#### Production Environment

1. Select **Production** environment

```bash
DATABASE_URL="<planetscale-main-connection-string>"
NODE_ENV="production"
LOG_LEVEL="info"
```

#### Setting via CLI

```bash
# Add production variable
vercel env add DATABASE_URL production

# Add preview variable
vercel env add DATABASE_URL preview

# List all variables
vercel env ls
```

---

## Pipeline Stages

### Stage 1: Type Checking

Ensures TypeScript code has no type errors:

```yaml
- name: Type check
  run: bun run type-check
```

**What it does:**
- Runs `tsc --noEmit` across all packages
- Validates types without generating output
- Fails CI if type errors exist

### Stage 2: Build

Compiles all packages and apps:

```yaml
- name: Build all packages
  run: bun run build
```

**What it does:**
- Turbo builds packages in dependency order
- Caches build artifacts
- Verifies all code compiles successfully

### Stage 3: Preview Deployment

Deploys to Vercel preview environment:

```yaml
- name: Deploy to Vercel (Preview)
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-args: ''  # No --prod flag
```

**What it does:**
- Creates unique preview URL
- Uses Preview environment variables
- Connects to Planetscale preview branch

### Stage 4: Production Deployment

Deploys to production:

```yaml
- name: Deploy to Vercel (Production)
  uses: amondnet/vercel-action@v25
  with:
    vercel-args: '--prod'
```

**What it does:**
- Deploys to production domain
- Uses Production environment variables
- Connects to Planetscale main branch

---

## Turbo Cache

### Enable Remote Caching

Remote caching speeds up CI by sharing build artifacts.

#### 1. Sign up for Vercel

Remote cache is free with Vercel account.

#### 2. Link Turborepo

```bash
bunx turbo login
bunx turbo link
```

#### 3. Configure in CI

Already configured in workflow:

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

#### 4. Verify Caching

Check logs for:
```
>>> TURBO
>>> TURBO FULL TURBO
```

### Local Development Cache

```bash
# Enable local caching
bun run build

# Clean cache
rm -rf .turbo
bun run clean
```

---

## Best Practices

### 1. Fast Feedback

**Keep builds under 5 minutes:**
```yaml
timeout-minutes: 15  # Set reasonable timeouts
```

**Use caching:**
```yaml
- uses: actions/cache@v3
  with:
    path: node_modules
    key: ${{ runner.os }}-bun-${{ hashFiles('**/bun.lockb') }}
```

### 2. Fail Fast

Run cheapest checks first:
1. Type checking (seconds)
2. Linting (seconds)
3. Build (minutes)
4. Deployment (minutes)

### 3. Parallel Jobs

Run independent jobs in parallel:

```yaml
jobs:
  test:
    # ...
  lint:
    # Runs in parallel with test
  security:
    # Runs in parallel with test and lint
```

### 4. Conditional Deployments

Only deploy when tests pass:

```yaml
deploy-preview:
  needs: test  # Wait for test job
  if: github.event_name == 'pull_request'
```

### 5. Branch Protection

Configure in GitHub:
**Settings → Branches → Add rule**

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date
- ✅ Require review from code owners
- ✅ Include administrators

### 6. Notifications

Get notified of deployment status:

```yaml
- name: Notify on failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 7. Deployment Rollback

Keep previous deployments:

```bash
# List recent deployments
vercel ls

# Rollback to previous
vercel rollback <deployment-url>
```

---

## Advanced Configuration

### Custom Deployment Workflow

For more control, use Vercel CLI directly:

```yaml
- name: Custom deployment
  run: |
    cd apps/api
    vercel --token=${{ secrets.VERCEL_TOKEN }} \
          --prod \
          --yes \
          --env DATABASE_URL=${{ secrets.DATABASE_URL }}
```

### Multi-App Deployment

Deploy multiple apps:

```yaml
- name: Deploy API
  working-directory: ./apps/api
  run: vercel --prod

- name: Deploy Web
  working-directory: ./apps/web
  run: vercel --prod
```

### Database Migration in CI

**⚠️ Not recommended for production**, but useful for preview:

```yaml
- name: Run migrations (Preview only)
  if: github.event_name == 'pull_request'
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_PREVIEW }}
  run: |
    cd packages/db
    bun run db:migrate
```

### Performance Monitoring

Track build times:

```yaml
- name: Build with timing
  run: |
    START_TIME=$(date +%s)
    bun run build
    END_TIME=$(date +%s)
    echo "Build took $((END_TIME - START_TIME)) seconds"
```

---

## Troubleshooting

### Issue: Build Fails in CI but Works Locally

**Possible causes:**
1. Environment variables missing
2. Different Bun/Node versions
3. Cached dependencies out of sync

**Solution:**
```yaml
- name: Clear cache and rebuild
  run: |
    rm -rf node_modules .turbo
    bun install
    bun run build
```

### Issue: Deployment Times Out

**Solution:**
```yaml
- name: Deploy with increased timeout
  timeout-minutes: 20  # Increase from default
```

### Issue: Type Checking Fails on CI

**Common cause:** Missing dependencies

**Solution:**
```yaml
- name: Install all dependencies
  run: bun install --frozen-lockfile
```

### Issue: Turbo Cache Not Working

**Solution:**
```bash
# Verify tokens are set
echo $TURBO_TOKEN
echo $TURBO_TEAM

# Re-link Turbo
bunx turbo login
bunx turbo link
```

---

## Monitoring and Insights

### GitHub Actions Insights

View in GitHub:
- **Actions tab** → See all workflow runs
- **Insights** → See workflow statistics

### Vercel Analytics

View in Vercel Dashboard:
- Deployment frequency
- Build times
- Success/failure rates

### Custom Metrics

Add custom metrics:

```yaml
- name: Report build metrics
  run: |
    echo "Build completed at $(date)"
    echo "Total files: $(find apps/api/dist -type f | wc -l)"
    echo "Bundle size: $(du -sh apps/api/dist)"
```

---

## Security Best Practices

### 1. Secret Management

- ✅ Use GitHub Secrets for sensitive data
- ✅ Never commit `.env` files
- ✅ Rotate tokens regularly
- ❌ Don't log secret values

### 2. Dependency Security

```yaml
- name: Security audit
  run: bun audit
```

### 3. Branch Protection

- Require reviews for main/develop
- Require status checks to pass
- Prevent force pushes

---

## Example: Complete Setup Script

```bash
#!/bin/bash
# setup-cicd.sh

echo "Setting up CI/CD pipeline..."

# 1. Create workflow directory
mkdir -p .github/workflows

# 2. Link Vercel
cd apps/api
vercel link

# 3. Get credentials
echo "Vercel credentials:"
cat .vercel/project.json

# 4. Set GitHub secrets (requires gh CLI)
gh secret set VERCEL_TOKEN
gh secret set VERCEL_ORG_ID
gh secret set VERCEL_PROJECT_ID

# 5. Link Turbo
bunx turbo login
bunx turbo link

# 6. Set Turbo secrets
gh secret set TURBO_TOKEN
gh secret set TURBO_TEAM

echo "✅ CI/CD setup complete!"
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Documentation](https://vercel.com/docs/deployments)
- [Turborepo Remote Caching](https://turbo.build/repo/docs/core-concepts/remote-caching)
- [Bun in CI/CD](https://bun.sh/docs/install/ci)

---

## Quick Reference

```bash
# Vercel CLI
vercel login
vercel link
vercel ls
vercel env ls
vercel rollback <url>

# Turbo CLI
bunx turbo login
bunx turbo link
bunx turbo prune --scope=@repo/api

# GitHub CLI
gh secret list
gh secret set SECRET_NAME
gh workflow list
gh run list
```
