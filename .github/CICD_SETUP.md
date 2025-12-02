# CI/CD Setup Guide for ClinicConnect

## 🔧 Prerequisites

1. **GitHub Repository** - Your code pushed to GitHub
2. **DigitalOcean Account** - With API access
3. **DigitalOcean Container Registry** - For Docker images

---

## 📋 Required GitHub Secrets

Go to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Essential Secrets

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | DO API token | [Create API Token](https://cloud.digitalocean.com/account/api/tokens) |
| `DIGITALOCEAN_REGISTRY_NAME` | Container registry name | DO Dashboard → Container Registry |
| `DIGITALOCEAN_APP_ID` | App Platform app ID | `doctl apps list` or App Dashboard |

### For Droplet Deployment (Optional)

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `DROPLET_HOST` | Droplet IP address | DO Droplets Dashboard |
| `DROPLET_USER` | SSH username (usually `root`) | Your setup |
| `DROPLET_SSH_KEY` | Private SSH key | `cat ~/.ssh/id_rsa` |
| `PRODUCTION_DOMAIN` | Your domain name | e.g., `clinicconnect.com` |

### Database & App Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PRODUCTION_DATABASE_URL` | Database connection string | `postgresql://user:pass@host:25060/db?sslmode=require` |
| `SESSION_SECRET` | App session secret | `openssl rand -base64 32` |

### Optional Secrets

| Secret Name | Description |
|-------------|-------------|
| `SNYK_TOKEN` | For security scanning |
| `OPENAI_API_KEY` | AI features |
| `SENDGRID_API_KEY` | Email service |

---

## 🚀 Setup Steps

### Step 1: Create DigitalOcean API Token

1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Click **"Generate New Token"**
3. Name: `github-actions`
4. Select **Read & Write** scope
5. Copy the token immediately (shown only once!)
6. Add as `DIGITALOCEAN_ACCESS_TOKEN` secret in GitHub

### Step 2: Create Container Registry

```bash
# Install doctl CLI
brew install doctl  # macOS
# or
snap install doctl  # Ubuntu

# Authenticate
doctl auth init

# Create registry (if not exists)
doctl registry create clinicconnect-registry

# Get registry name
doctl registry get
```

Add the registry name as `DIGITALOCEAN_REGISTRY_NAME` secret.

### Step 3: Create App Platform App (Option A)

```bash
# Create app from spec
doctl apps create --spec .do/app.yaml

# Get app ID
doctl apps list
```

Add the app ID as `DIGITALOCEAN_APP_ID` secret.

### Step 4: Configure Droplet (Option B)

```bash
# Get droplet IP
doctl compute droplet list

# Generate SSH key if needed
ssh-keygen -t ed25519 -C "github-actions"

# Copy public key to droplet
ssh-copy-id root@your-droplet-ip

# Get private key for GitHub secret
cat ~/.ssh/id_ed25519
```

Add the private key as `DROPLET_SSH_KEY` secret.

---

## 📁 Workflow Files

### `deploy.yml` - Main Deployment Pipeline

**Triggers:**
- Push to `main` → Deploy to App Platform
- Push to `production` → Deploy to Droplet
- Pull requests → Run tests only

**Jobs:**
1. **Lint** - Code quality checks
2. **Test** - Run test suite with PostgreSQL
3. **Build** - Build and push Docker image
4. **Deploy** - Deploy to DigitalOcean
5. **Migrate** - Run database migrations
6. **Cleanup** - Remove old images

### `pr-check.yml` - Pull Request Checks

Runs on every PR:
- Lint check
- TypeScript type check
- Build verification
- Test suite
- Docker build test

### `scheduled.yml` - Maintenance Tasks

Runs automatically:
- **Weekly**: Security scans, registry cleanup
- **Daily**: Dependency update checks

---

## 🔄 Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Push to main/production
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Lint   │→ │  Test   │→ │  Build  │→ │ Deploy  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│  DO Container Registry   │     │  DO Container Registry   │
│  (Docker Image)          │     │  (Docker Image)          │
└─────────────────────────┘     └─────────────────────────┘
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│   DO App Platform        │     │   DO Droplet + Docker   │
│   (main branch)          │     │   (production branch)   │
└─────────────────────────┘     └─────────────────────────┘
```

---

## 🧪 Testing the Pipeline

### Test PR Checks

```bash
# Create a test branch
git checkout -b test-ci

# Make a small change
echo "# Test" >> README.md

# Push and create PR
git push origin test-ci
gh pr create --title "Test CI/CD" --body "Testing pipeline"
```

### Test Deployment

```bash
# Push to main to trigger App Platform deploy
git checkout main
git merge test-ci
git push origin main

# Watch the workflow
gh run watch
```

### Manual Trigger

```bash
# Trigger scheduled workflow manually
gh workflow run scheduled.yml
```

---

## 🔍 Troubleshooting

### Common Issues

**1. Registry login fails**
```
Error: unauthorized: access denied
```
Solution: Check `DIGITALOCEAN_ACCESS_TOKEN` has write permissions.

**2. App deployment fails**
```
Error: App not found
```
Solution: Verify `DIGITALOCEAN_APP_ID` is correct. Run `doctl apps list`.

**3. SSH connection fails**
```
Error: Connection refused
```
Solution: 
- Check `DROPLET_HOST` is correct IP
- Verify SSH key is properly formatted (include full key with headers)
- Ensure firewall allows port 22

**4. Build cache issues**
```bash
# Clear GitHub Actions cache
gh cache delete --all
```

---

## 📊 Monitoring Deployments

### View Workflow Runs

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# Watch logs
gh run watch
```

### Check Deployment Status

```bash
# App Platform
doctl apps list-deployments <app-id>

# Container Registry
doctl registry repository list-v2
```

---

## 🔐 Security Best Practices

1. **Never commit secrets** - Use GitHub Secrets only
2. **Rotate tokens regularly** - Every 90 days recommended
3. **Use environment protection** - Require approval for production
4. **Enable branch protection** - Require PR reviews before merge
5. **Monitor security alerts** - Enable Dependabot

### Enable Environment Protection

1. Go to **Settings** → **Environments**
2. Create `production` environment
3. Add protection rules:
   - Required reviewers
   - Wait timer (optional)
   - Restrict to `main` branch

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [DigitalOcean API Reference](https://docs.digitalocean.com/reference/api/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [Docker Build Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

