# GitHub Actions Workflow Setup

Due to GitHub permissions requirements, the workflow file needs to be added through the GitHub UI or by a user with workflow permissions.

## Adding the Workflow File

### Option 1: Via GitHub UI

1. Go to your repository on GitHub
2. Navigate to **Actions** tab
3. Click **"New workflow"**
4. Choose **"set up a workflow yourself"**
5. Name the file: `deploy.yml`
6. Copy and paste the workflow content below

### Option 2: Via Git with Proper Permissions

If you have workflow permissions:

```bash
# Create the workflow directory
mkdir -p .github/workflows

# Create the workflow file
cat > .github/workflows/deploy.yml << 'EOF'
[paste content below]
EOF

# Commit and push
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions workflow"
git push
```

## Workflow File Content

Create `.github/workflows/deploy.yml` with the following content:

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
        if: always()
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            const url = '${{ steps.vercel-preview.outputs.preview-url }}';
            if (url) {
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: `✅ Preview deployment ready!\n\n🔗 **Preview URL**: ${url}\n\n📝 Changes deployed successfully.`
              });
            }

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
        if: success()
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            github.rest.repos.createCommitComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              commit_sha: context.sha,
              body: '🚀 Successfully deployed to production!'
            });
```

## Required GitHub Secrets

Before the workflow can run, configure these secrets in your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `VERCEL_TOKEN` | Vercel authentication token | [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization/team ID | `.vercel/project.json` after running `vercel link` |
| `VERCEL_PROJECT_ID` | Project ID | `.vercel/project.json` after running `vercel link` |
| `TURBO_TOKEN` | Turbo Remote Cache token | Same as VERCEL_TOKEN or create separate |
| `TURBO_TEAM` | Turbo team slug | Your Vercel team slug |

### Getting Vercel IDs

```bash
# Link your project first
cd apps/api
vercel link

# View the IDs
cat .vercel/project.json
```

Output:
```json
{
  "orgId": "team_xxxxxxxxx",
  "projectId": "prj_xxxxxxxxx"
}
```

## Verifying the Setup

Once the workflow is added:

1. **Push a commit** to trigger the workflow
2. **Go to Actions tab** to see the workflow run
3. **Check the logs** for any errors
4. **Create a PR** to test preview deployments

## Troubleshooting

### Workflow doesn't appear
- Ensure the file is at `.github/workflows/deploy.yml`
- Check file permissions (should be readable)
- Verify YAML syntax is correct

### Secrets not found
- Double-check secret names match exactly
- Ensure secrets are set in the correct repository
- Verify secrets have the correct values

### Build fails
- Check Bun version compatibility
- Verify all dependencies are in `package.json`
- Review error logs in Actions tab

## Next Steps

After adding the workflow:

1. Read [CICD_SETUP.md](./CICD_SETUP.md) for detailed configuration
2. Configure branch protection rules
3. Set up Vercel environment variables
4. Test the complete deployment flow

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Bun GitHub Actions](https://bun.sh/docs/install/ci)
