# Documentation

Welcome to the TypeScript Monorepo documentation. This directory contains comprehensive guides for developing, deploying, and maintaining the application.

## 📚 Table of Contents

### Getting Started
- [Main README](../README.md) - Project overview and quick start guide
- [API Documentation](../apps/api/API.md) - REST API endpoints reference

### Development Workflows
- [Feature Deployment Guide](./FEATURE_DEPLOYMENT.md) - Complete workflow for deploying features with schema changes
- [Planetscale Workflow](./PLANETSCALE_WORKFLOW.md) - Database branching and management
- [CI/CD Setup](./CICD_SETUP.md) - Continuous integration and deployment configuration

---

## 🚀 Quick Links

### For New Developers

**Getting Started:**
1. Read the [Main README](../README.md) for project setup
2. Follow [CICD_SETUP.md](./CICD_SETUP.md) to configure your environment
3. Review [API Documentation](../apps/api/API.md) to understand existing endpoints

**Your First Feature:**
1. Follow [FEATURE_DEPLOYMENT.md](./FEATURE_DEPLOYMENT.md) step-by-step
2. Refer to [PLANETSCALE_WORKFLOW.md](./PLANETSCALE_WORKFLOW.md) for database operations

### For DevOps/Infrastructure

**Setting Up Infrastructure:**
1. [CICD_SETUP.md](./CICD_SETUP.md) - Configure GitHub Actions and Vercel
2. [PLANETSCALE_WORKFLOW.md](./PLANETSCALE_WORKFLOW.md) - Set up database branching

**Deployment Process:**
1. [FEATURE_DEPLOYMENT.md](./FEATURE_DEPLOYMENT.md) - Complete deployment workflow

---

## 📖 Documentation Overview

### [FEATURE_DEPLOYMENT.md](./FEATURE_DEPLOYMENT.md)
**Complete guide for deploying features with schema changes**

Topics covered:
- Development workflow from start to finish
- Planetscale database branching integration
- Schema changes and migrations
- CI/CD pipeline integration
- Production deployment process
- Rollback procedures
- Best practices and troubleshooting

**When to use:**
- Implementing a new feature that requires database changes
- Understanding the complete deployment lifecycle
- Planning a complex feature rollout

**Example scenarios:**
- Adding a new "comments" feature
- Implementing user profiles
- Creating a new microservice

---

### [PLANETSCALE_WORKFLOW.md](./PLANETSCALE_WORKFLOW.md)
**Deep dive into Planetscale database branching**

Topics covered:
- Planetscale CLI setup and authentication
- Branch management (create, list, delete)
- Connection strings and secure access
- Deploy requests and schema reviews
- Safety checks and migration guidelines
- Common workflows and patterns

**When to use:**
- Working with database schema changes
- Creating or managing database branches
- Reviewing and deploying schema changes
- Troubleshooting database connections

**Example scenarios:**
- Creating a development branch for testing
- Deploying schema changes to production
- Rolling back a problematic migration
- Experimenting with database optimizations

---

### [CICD_SETUP.md](./CICD_SETUP.md)
**Setting up and configuring CI/CD pipeline**

Topics covered:
- GitHub Actions workflow configuration
- Vercel integration and deployment
- Environment variable management
- Pipeline stages and optimization
- Turbo Remote Cache setup
- Monitoring and troubleshooting

**When to use:**
- Initial project setup
- Configuring new deployment environments
- Optimizing build times
- Debugging CI/CD issues

**Example scenarios:**
- Setting up a new repository
- Adding preview deployments
- Configuring environment variables
- Troubleshooting build failures

---

## 🔄 Complete Workflow Example

### Scenario: Adding a "Posts" Feature

Here's how the documentation works together:

#### 1. Planning Phase
📖 Read: [FEATURE_DEPLOYMENT.md - Overview](./FEATURE_DEPLOYMENT.md#overview)
- Understand the complete workflow
- Plan your approach

#### 2. Development Phase
📖 Read: [FEATURE_DEPLOYMENT.md - Development Workflow](./FEATURE_DEPLOYMENT.md#development-workflow)
📖 Read: [PLANETSCALE_WORKFLOW.md - Creating Branches](./PLANETSCALE_WORKFLOW.md#creating-branches)

```bash
# Create Git branch
git checkout -b feature/add-posts

# Create Planetscale branch
pscale branch create mydb feature-add-posts
pscale connect mydb feature-add-posts --port 3309

# Update schema, generate migrations
cd packages/db
bun run db:generate
bun run db:migrate

# Implement feature
# Test locally
```

#### 3. Review Phase
📖 Read: [CICD_SETUP.md - Pipeline Stages](./CICD_SETUP.md#pipeline-stages)
📖 Read: [PLANETSCALE_WORKFLOW.md - Deploy Requests](./PLANETSCALE_WORKFLOW.md#deploy-requests)

```bash
# Push code
git push origin feature/add-posts

# Create PR (triggers CI/CD)
# CI runs tests, deploys preview

# Create Planetscale deploy request
pscale deploy-request create mydb feature-add-posts

# Review schema changes
pscale deploy-request diff mydb 1
```

#### 4. Deployment Phase
📖 Read: [FEATURE_DEPLOYMENT.md - Deployment Process](./FEATURE_DEPLOYMENT.md#deployment-process)

```bash
# Deploy database changes
pscale deploy-request deploy mydb 1

# Merge PR (triggers production deployment)
# Monitor deployment
```

#### 5. Post-Deployment
📖 Read: [FEATURE_DEPLOYMENT.md - Rollback Procedures](./FEATURE_DEPLOYMENT.md#rollback-procedures)

```bash
# Verify deployment
curl https://api.example.com/posts

# Clean up
pscale branch delete mydb feature-add-posts
```

---

## 🎯 Common Tasks

### I want to...

#### Deploy a new feature with database changes
→ Follow [FEATURE_DEPLOYMENT.md](./FEATURE_DEPLOYMENT.md)

#### Create a database branch
→ See [PLANETSCALE_WORKFLOW.md - Branch Management](./PLANETSCALE_WORKFLOW.md#branch-management)

#### Set up CI/CD for the first time
→ Follow [CICD_SETUP.md - GitHub Actions Setup](./CICD_SETUP.md#github-actions-setup)

#### Configure environment variables
→ See [CICD_SETUP.md - Environment Variables](./CICD_SETUP.md#environment-variables)

#### Review a schema change
→ See [PLANETSCALE_WORKFLOW.md - Deploy Requests](./PLANETSCALE_WORKFLOW.md#deploy-requests)

#### Rollback a deployment
→ See [FEATURE_DEPLOYMENT.md - Rollback Procedures](./FEATURE_DEPLOYMENT.md#rollback-procedures)

#### Debug a failed build
→ See [CICD_SETUP.md - Troubleshooting](./CICD_SETUP.md#troubleshooting)

#### Optimize build times
→ See [CICD_SETUP.md - Turbo Cache](./CICD_SETUP.md#turbo-cache)

---

## 🏗️ Architecture Overview

### Monorepo Structure
```
typescript-monorepo/
├── apps/
│   ├── api/          # Hono REST API (Vercel Serverless)
│   ├── mobile/       # Mobile app (future)
│   └── web/          # Web app (future)
├── packages/
│   ├── db/           # Drizzle ORM + Planetscale
│   └── users/        # User business logic
└── docs/             # 📖 You are here
```

### Tech Stack
- **Runtime**: Bun
- **Framework**: Hono + Effect-TS
- **Database**: PostgreSQL (Planetscale)
- **ORM**: Drizzle
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions
- **Monorepo**: Turbo

### Data Flow
```
Client Request
    ↓
Vercel Edge (Hono)
    ↓
Effect-TS Service Layer
    ↓
Drizzle ORM
    ↓
Planetscale PostgreSQL
```

---

## 📋 Checklists

### New Feature Checklist

Use this when implementing a new feature:

- [ ] Create Git feature branch
- [ ] Create Planetscale database branch
- [ ] Update schema in `packages/db/src/schema/`
- [ ] Generate migrations: `bun run db:generate`
- [ ] Apply migrations: `bun run db:migrate`
- [ ] Implement business logic in packages
- [ ] Add API endpoints in `apps/api`
- [ ] Test locally
- [ ] Push code and create PR
- [ ] Create Planetscale deploy request
- [ ] Review schema changes
- [ ] Wait for CI to pass
- [ ] Deploy database changes
- [ ] Merge PR (triggers production deploy)
- [ ] Verify production
- [ ] Clean up branches

### Production Deployment Checklist

Before deploying to production:

- [ ] All tests passing in CI
- [ ] Code review approved
- [ ] Schema changes reviewed
- [ ] Planetscale deploy request approved
- [ ] Database changes deployed to production
- [ ] Environment variables configured
- [ ] Rollback plan documented
- [ ] Team notified of deployment
- [ ] Monitoring/alerts configured

### Post-Deployment Checklist

After deployment:

- [ ] Verify API endpoints working
- [ ] Check error rates
- [ ] Monitor database performance
- [ ] Review logs for errors
- [ ] Test critical user flows
- [ ] Document any issues
- [ ] Clean up old branches

---

## 🔧 Tools Reference

### Essential CLI Tools

```bash
# Bun (package manager & runtime)
bun install
bun run dev
bun run build

# Planetscale CLI
pscale auth login
pscale branch create <db> <branch>
pscale connect <db> <branch>
pscale deploy-request create <db> <branch>

# Vercel CLI
vercel login
vercel link
vercel deploy
vercel env ls

# Turbo (monorepo)
bunx turbo run build
bunx turbo run dev
bunx turbo prune

# Git
git checkout -b feature/name
git push origin feature/name

# GitHub CLI
gh pr create
gh pr merge
gh secret set SECRET_NAME
```

---

## 🐛 Troubleshooting Guide

### Common Issues and Solutions

#### Build fails in CI but works locally
→ [CICD_SETUP.md - Troubleshooting](./CICD_SETUP.md#troubleshooting)

#### Cannot connect to Planetscale
→ [PLANETSCALE_WORKFLOW.md - Troubleshooting](./PLANETSCALE_WORKFLOW.md#troubleshooting)

#### Migration fails
→ [FEATURE_DEPLOYMENT.md - Troubleshooting](./FEATURE_DEPLOYMENT.md#troubleshooting)

#### Deploy request shows unsafe changes
→ [PLANETSCALE_WORKFLOW.md - Best Practices](./PLANETSCALE_WORKFLOW.md#best-practices)

#### Vercel deployment times out
→ [CICD_SETUP.md - Troubleshooting](./CICD_SETUP.md#troubleshooting)

---

## 📈 Best Practices Summary

### Development
- ✅ Always create feature branches (Git + Planetscale)
- ✅ Test locally before pushing
- ✅ Use type-safe code with TypeScript
- ✅ Write backwards-compatible migrations
- ✅ Keep commits focused and atomic

### Database
- ✅ Always use Planetscale branches for schema changes
- ✅ Review deploy requests carefully
- ✅ Make additive changes (avoid drops/renames)
- ✅ Test with production-like data
- ✅ Deploy database before application

### Deployment
- ✅ Wait for CI to pass before merging
- ✅ Deploy during low-traffic periods
- ✅ Monitor deployments for at least 1 hour
- ✅ Have rollback plan ready
- ✅ Document deployment steps

### Code Review
- ✅ Review schema changes in Planetscale dashboard
- ✅ Check preview deployment
- ✅ Verify types and tests
- ✅ Consider backwards compatibility
- ✅ Approve only when ready for production

---

## 🎓 Learning Path

### For New Team Members

**Week 1: Fundamentals**
1. Read [Main README](../README.md)
2. Set up local environment
3. Run the API locally
4. Review [API Documentation](../apps/api/API.md)

**Week 2: Development Workflow**
1. Read [FEATURE_DEPLOYMENT.md](./FEATURE_DEPLOYMENT.md)
2. Read [PLANETSCALE_WORKFLOW.md](./PLANETSCALE_WORKFLOW.md)
3. Create a practice feature branch
4. Make a simple schema change

**Week 3: Deployment**
1. Read [CICD_SETUP.md](./CICD_SETUP.md)
2. Create a PR with preview deployment
3. Review deploy request process
4. Deploy a small feature

**Week 4: Advanced Topics**
1. Optimize build times
2. Implement complex schema changes
3. Handle production incidents
4. Document learnings

---

## 🤝 Contributing to Documentation

Found an error or want to improve the docs?

1. **Create an issue** describing the problem
2. **Submit a PR** with improvements
3. **Update this README** if adding new docs

### Documentation Standards

- Use clear, concise language
- Include code examples
- Add diagrams where helpful
- Keep information up-to-date
- Link related documentation

---

## 📞 Getting Help

If you're stuck:

1. **Check the docs** - Search this directory
2. **Review troubleshooting sections** - Each guide has one
3. **Check logs** - Vercel, GitHub Actions, Planetscale
4. **Ask the team** - Create an issue or ask in chat
5. **Update the docs** - Help the next person!

---

## 📚 External Resources

### Official Documentation
- [Bun Documentation](https://bun.sh/docs)
- [Hono Documentation](https://hono.dev/)
- [Effect-TS Documentation](https://effect.website/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Planetscale Documentation](https://planetscale.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Turbo Documentation](https://turbo.build/repo/docs)

### Tutorials and Guides
- [Planetscale Branching Guide](https://planetscale.com/docs/concepts/branching)
- [Drizzle Migrations Guide](https://orm.drizzle.team/docs/migrations)
- [Effect-TS Tutorial](https://effect.website/docs/getting-started)

---

## 🗺️ Documentation Roadmap

Future documentation to add:

- [ ] Testing guide
- [ ] Monitoring and observability
- [ ] Security best practices
- [ ] Performance optimization
- [ ] Local development tips
- [ ] Debugging guide
- [ ] API versioning strategy
- [ ] Database indexing guide

---

## 📝 Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-11-14 | Initial documentation created |

---

## License

MIT License - See [LICENSE](../LICENSE) for details
