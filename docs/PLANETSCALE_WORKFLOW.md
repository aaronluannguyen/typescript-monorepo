# Planetscale Database Branching Workflow

Complete guide to working with Planetscale's branching workflow for safe database schema changes.

## Table of Contents

1. [Introduction](#introduction)
2. [Setup](#setup)
3. [Branch Management](#branch-management)
4. [Connection Strings](#connection-strings)
5. [Deploy Requests](#deploy-requests)
6. [Best Practices](#best-practices)
7. [Common Workflows](#common-workflows)

---

## Introduction

Planetscale brings Git-like workflows to your database:

- **Branches**: Create isolated copies of your database for development
- **Deploy Requests**: Review and deploy schema changes safely
- **Non-blocking Schema Changes**: Deploy without downtime
- **Automatic Backups**: Every branch is backed up

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Production Branch** | Your `main` branch - connected to production app |
| **Development Branch** | Feature branches for testing schema changes |
| **Deploy Request** | Proposal to merge schema changes to production |
| **Schema Diff** | Visual comparison of schema changes |
| **Safe Migrations** | Planetscale validates migrations won't break production |

---

## Setup

### 1. Install Planetscale CLI

**macOS:**
```bash
brew install planetscale/tap/pscale
brew install mysql-client
```

**Linux:**
```bash
curl -L https://github.com/planetscale/cli/releases/latest/download/pscale_linux_amd64 -o pscale
chmod +x pscale
sudo mv pscale /usr/local/bin/pscale
```

**Windows:**
```bash
scoop bucket add pscale https://github.com/planetscale/scoop-bucket.git
scoop install pscale mysql
```

### 2. Authenticate

```bash
pscale auth login
```

This opens your browser to authenticate with Planetscale.

### 3. Verify Authentication

```bash
pscale org list
```

### 4. Create Database (if not exists)

```bash
# Create a new database
pscale database create <database-name> --region us-east

# List databases
pscale database list
```

---

## Branch Management

### Creating Branches

#### From Main Branch
```bash
# Create a new branch from main
pscale branch create <database-name> <branch-name>

# Example: Create feature branch
pscale branch create mydb feature-add-comments
```

#### From Another Branch
```bash
# Create branch from specific parent
pscale branch create <database-name> <new-branch> --from <parent-branch>

# Example: Create fix on top of feature
pscale branch create mydb fix-comments-schema --from feature-add-comments
```

### Listing Branches

```bash
# List all branches
pscale branch list <database-name>

# Show branch details
pscale branch show <database-name> <branch-name>
```

### Deleting Branches

```bash
# Delete a development branch
pscale branch delete <database-name> <branch-name>

# Force delete (skip confirmation)
pscale branch delete <database-name> <branch-name> --force
```

**Important:** You cannot delete the production branch (main).

### Branch Promotion

```bash
# Promote a branch to production (use with caution!)
pscale branch promote <database-name> <branch-name>
```

⚠️ **Warning:** This makes the branch your new production branch. Use deploy requests instead for normal workflows.

---

## Connection Strings

### Development Connections

#### Local Proxy Connection (Recommended)

```bash
# Connect to branch via local proxy
pscale connect <database-name> <branch-name> --port 3309

# Keep this running in a terminal
# Your app connects to localhost:3309
```

Set in your `.env`:
```bash
DATABASE_URL="mysql://127.0.0.1:3309/<database-name>"
```

**Advantages:**
- Secure (uses your auth)
- No connection strings to manage
- Easy to switch branches

#### Connection Strings

```bash
# Get connection string for branch
pscale password create <database-name> <branch-name> <password-name>

# Example
pscale password create mydb feature-add-comments dev-connection
```

This returns:
```
Password created successfully.

Username: xxxxxxxxx
Password: pscale_pw_xxxxxxxxxx

Connection string:
mysql://xxxxxxxxx:pscale_pw_xxxxxxxxxx@aws.connect.psdb.cloud/mydb?ssl={"rejectUnauthorized":true}
```

**Store securely in your .env file.**

### Production Connections

#### For Vercel/Production

```bash
# Create production password
pscale password create <database-name> main production

# Store in Vercel environment variables
```

#### Rotating Credentials

```bash
# List passwords
pscale password list <database-name> <branch-name>

# Delete old password
pscale password delete <database-name> <branch-name> <password-id>

# Create new password
pscale password create <database-name> <branch-name> <password-name>
```

---

## Deploy Requests

Deploy requests are how you safely merge schema changes to production.

### Creating Deploy Requests

```bash
# Create deploy request
pscale deploy-request create <database-name> <branch-name>

# Create with notes
pscale deploy-request create <database-name> <branch-name> \
  --notes "Add comments table for user feedback feature"
```

### Viewing Deploy Requests

```bash
# List all deploy requests
pscale deploy-request list <database-name>

# Show specific deploy request
pscale deploy-request show <database-name> <deploy-request-number>

# View schema diff
pscale deploy-request diff <database-name> <deploy-request-number>
```

### Review Process

#### 1. Schema Diff Review

```bash
pscale deploy-request diff <database-name> 1
```

Output shows:
```diff
+ CREATE TABLE comments (
+   id VARCHAR(36) PRIMARY KEY,
+   user_id VARCHAR(36) NOT NULL,
+   post_id VARCHAR(36) NOT NULL,
+   content TEXT NOT NULL,
+   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
+ );

+ ALTER TABLE comments
+   ADD FOREIGN KEY (user_id) REFERENCES users(id);
```

#### 2. Safety Checks

Planetscale automatically checks for:

- **✅ Safe Operations:**
  - Adding tables
  - Adding columns (nullable or with defaults)
  - Adding indexes
  - Creating foreign keys

- **⚠️ Potentially Unsafe:**
  - Renaming columns
  - Changing column types
  - Adding NOT NULL without default

- **❌ Blocked:**
  - Dropping tables with data
  - Removing columns (use deprecation instead)

#### 3. Deploy Request States

| State | Description |
|-------|-------------|
| `open` | Pending review |
| `approved` | Ready to deploy |
| `queued` | In deployment queue |
| `in_progress` | Currently deploying |
| `complete` | Successfully deployed |
| `closed` | Closed without deploying |

### Deploying Changes

#### Via CLI

```bash
# Deploy the schema changes
pscale deploy-request deploy <database-name> <deploy-request-number>

# Check deployment status
pscale deploy-request show <database-name> <deploy-request-number>
```

#### Via Dashboard

1. Go to https://app.planetscale.com
2. Navigate to your database
3. Click "Deploy requests"
4. Review the diff
5. Click "Deploy changes"

### Closing Deploy Requests

```bash
# Close without deploying
pscale deploy-request close <database-name> <deploy-request-number>

# Add reason
pscale deploy-request close <database-name> <deploy-request-number> \
  --reason "Schema changes no longer needed"
```

---

## Best Practices

### Branch Naming

Use consistent naming conventions:

```bash
# Features
feature-<description>
feature-add-comments
feature-user-profiles

# Bug fixes
fix-<description>
fix-user-email-unique

# Hotfixes
hotfix-<description>
hotfix-payment-validation

# Experiments
experiment-<description>
experiment-new-search-index
```

### Branch Lifecycle

```bash
1. Create branch
   ↓
2. Develop and test
   ↓
3. Create deploy request
   ↓
4. Review and deploy
   ↓
5. Delete branch (cleanup)
```

#### Cleanup Old Branches

```bash
# List branches with creation date
pscale branch list <database-name>

# Delete merged branches
pscale branch delete <database-name> feature-old-feature
```

### Schema Change Guidelines

#### ✅ DO

1. **Make additive changes:**
   ```sql
   -- Add new column (nullable)
   ALTER TABLE users ADD COLUMN phone VARCHAR(20);

   -- Add new table
   CREATE TABLE comments (...);
   ```

2. **Use defaults for new columns:**
   ```sql
   ALTER TABLE users
   ADD COLUMN status VARCHAR(20) DEFAULT 'active';
   ```

3. **Test on branch first:**
   ```bash
   # Always test migrations on branch
   pscale connect mydb feature-branch
   # Run migrations
   # Test application
   ```

#### ❌ DON'T

1. **Don't drop columns immediately:**
   ```sql
   -- ❌ Bad: Drop column in use
   ALTER TABLE users DROP COLUMN old_field;

   -- ✅ Good: Deprecate first
   -- Phase 1: Stop using in code, deploy
   -- Phase 2: Wait a week
   -- Phase 3: Then drop column
   ```

2. **Don't change column types without care:**
   ```sql
   -- ❌ Risky: Could truncate data
   ALTER TABLE users MODIFY COLUMN email VARCHAR(100);

   -- ✅ Better: Create new column, migrate, swap
   ALTER TABLE users ADD COLUMN email_new VARCHAR(255);
   -- Migrate data
   -- Switch application to use email_new
   -- Drop old column later
   ```

3. **Don't skip testing:**
   ```bash
   # ❌ Bad: Deploy without testing
   pscale deploy-request create mydb feature-branch
   pscale deploy-request deploy mydb 1

   # ✅ Good: Test first
   pscale connect mydb feature-branch
   # Run application tests
   # Verify data integrity
   # Then create deploy request
   ```

### Multi-Step Migrations

For complex changes, use multiple deploy requests:

#### Example: Renaming a Column

**Phase 1: Add new column**
```sql
ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
UPDATE users SET full_name = name;
```
- Deploy this
- Update application to use `full_name`
- Deploy application

**Phase 2: Drop old column**
```sql
ALTER TABLE users DROP COLUMN name;
```
- Deploy this (after confirming new column works)

---

## Common Workflows

### Workflow 1: Simple Feature with Schema Changes

```bash
# 1. Create branch
pscale branch create mydb feature-comments

# 2. Connect locally
pscale connect mydb feature-comments --port 3309

# 3. Update schema in code
# Edit packages/db/src/schema/comments.ts

# 4. Generate migration
cd packages/db
bun run db:generate

# 5. Apply to branch
bun run db:migrate

# 6. Test locally
cd ../../apps/api
bun run dev

# 7. Create deploy request
pscale deploy-request create mydb feature-comments

# 8. Review diff
pscale deploy-request diff mydb 1

# 9. Deploy
pscale deploy-request deploy mydb 1

# 10. Cleanup
pscale branch delete mydb feature-comments
```

### Workflow 2: Emergency Hotfix

```bash
# 1. Create hotfix branch
pscale branch create mydb hotfix-user-validation

# 2. Connect
pscale connect mydb hotfix-user-validation --port 3309

# 3. Apply quick schema fix
# Update schema, generate, migrate

# 4. Fast-track deployment
pscale deploy-request create mydb hotfix-user-validation \
  --notes "Critical: Fix user validation bug"

pscale deploy-request deploy mydb 1

# 5. Immediate cleanup
pscale branch delete mydb hotfix-user-validation --force
```

### Workflow 3: Long-Running Feature

```bash
# 1. Create feature branch
pscale branch create mydb feature-analytics

# 2. Work over multiple days
pscale connect mydb feature-analytics --port 3309

# Keep developing, making multiple schema changes

# 3. When ready, create deploy request
pscale deploy-request create mydb feature-analytics

# 4. Review comprehensive diff
pscale deploy-request diff mydb 1

# 5. Deploy when application is ready
pscale deploy-request deploy mydb 1

# 6. Keep branch for a bit (in case of rollback)
# Delete after confirming stability
pscale branch delete mydb feature-analytics
```

### Workflow 4: Experimental Changes

```bash
# 1. Create experiment branch
pscale branch create mydb experiment-new-indexes

# 2. Test performance
pscale shell mydb experiment-new-indexes
# Run queries, check performance

# 3. If successful, create deploy request
pscale deploy-request create mydb experiment-new-indexes

# 4. If unsuccessful, just delete
pscale branch delete mydb experiment-new-indexes
```

---

## Database Shell Access

### Interactive Shell

```bash
# Connect to database shell
pscale shell <database-name> <branch-name>

# Example
pscale shell mydb feature-comments
```

Now you can run SQL directly:
```sql
-- Show tables
SHOW TABLES;

-- Describe table
DESCRIBE users;

-- Run queries
SELECT * FROM users LIMIT 5;

-- Check indexes
SHOW INDEX FROM users;

-- Exit
exit
```

### Execute Single Query

```bash
# Run query from command line
pscale shell <database-name> <branch-name> --execute "SELECT COUNT(*) FROM users"
```

---

## Monitoring and Insights

### Branch Statistics

```bash
# Show branch info with stats
pscale branch show <database-name> <branch-name>
```

### Insights Dashboard

Access via https://app.planetscale.com:
- Query performance
- Slow queries
- Connection stats
- Storage usage

---

## Troubleshooting

### Issue: Cannot Create Deploy Request

**Error:** "Branch has no schema changes"

**Solution:**
```bash
# Verify schema changes exist
pscale shell mydb feature-branch --execute "SHOW TABLES"

# Check if migrations were applied
pscale branch show mydb feature-branch
```

### Issue: Deploy Request Shows Unsafe Changes

**Error:** "This migration may cause downtime"

**Solution:**
1. Review the specific changes flagged
2. Make changes backwards-compatible
3. Consider multi-phase deployment

### Issue: Connection Refused

**Error:** "Error connecting to database"

**Solution:**
```bash
# Check if pscale connect is running
ps aux | grep pscale

# Restart connection
pscale connect mydb feature-branch --port 3309

# Verify DATABASE_URL in .env
echo $DATABASE_URL
```

### Issue: Branch Out of Date

**Error:** "Branch is behind main"

**Solution:**
```bash
# Delete and recreate branch (if no important changes)
pscale branch delete mydb old-feature
pscale branch create mydb old-feature

# Or create new branch
pscale branch create mydb feature-name-v2 --from main
```

---

## Additional Resources

- [Planetscale Documentation](https://planetscale.com/docs)
- [Planetscale CLI Reference](https://planetscale.com/docs/concepts/planetscale-cli)
- [Database Branching Guide](https://planetscale.com/docs/concepts/branching)
- [Safe Migrations](https://planetscale.com/docs/concepts/safe-migrations)

---

## Quick Reference

### Essential Commands

```bash
# Authentication
pscale auth login

# Branches
pscale branch create <db> <branch>
pscale branch list <db>
pscale branch delete <db> <branch>

# Connections
pscale connect <db> <branch> --port 3309
pscale shell <db> <branch>

# Deploy Requests
pscale deploy-request create <db> <branch>
pscale deploy-request list <db>
pscale deploy-request diff <db> <number>
pscale deploy-request deploy <db> <number>

# Passwords
pscale password create <db> <branch> <name>
pscale password list <db> <branch>
```
