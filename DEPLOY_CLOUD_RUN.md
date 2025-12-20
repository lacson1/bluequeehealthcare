# Deploy ClinicConnect to Google Cloud Run

This guide covers deploying ClinicConnect to Google Cloud Run with Cloud SQL for PostgreSQL.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Project created** in Google Cloud Console

```bash
# Install gcloud CLI (if not installed)
# macOS: brew install google-cloud-sdk
# Or download from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

## Quick Deploy (5 minutes)

For the fastest deployment with an existing PostgreSQL database:

```bash
# 1. Build and push the image
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/clinicconnect -f Dockerfile.cloudrun

# 2. Deploy to Cloud Run
gcloud run deploy clinicconnect \
  --image gcr.io/YOUR_PROJECT_ID/clinicconnect \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --set-env-vars "DATABASE_URL=postgresql://user:pass@host:5432/db" \
  --set-env-vars "SESSION_SECRET=your-super-secret-key" \
  --allow-unauthenticated
```

## Full Setup with Cloud SQL

### Step 1: Enable Required APIs

```bash
# Enable required Google Cloud APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com
```

### Step 2: Create Cloud SQL Instance

```bash
# Create a PostgreSQL instance
gcloud sql instances create clinicconnect-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_DB_ROOT_PASSWORD \
  --storage-size=10GB \
  --storage-type=SSD \
  --availability-type=zonal

# Create the database
gcloud sql databases create clinicconnect --instance=clinicconnect-db

# Create a user
gcloud sql users create clinicconnect_user \
  --instance=clinicconnect-db \
  --password=YOUR_USER_PASSWORD
```

### Step 3: Set Up Secrets

```bash
# Create DATABASE_URL secret
# Format for Cloud SQL: postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE
echo -n "postgresql://clinicconnect_user:YOUR_USER_PASSWORD@/clinicconnect?host=/cloudsql/YOUR_PROJECT_ID:us-central1:clinicconnect-db" | \
  gcloud secrets create DATABASE_URL --data-file=-

# Create SESSION_SECRET
echo -n "$(openssl rand -base64 32)" | \
  gcloud secrets create SESSION_SECRET --data-file=-

# (Optional) Add other secrets
# echo -n "your-sendgrid-key" | gcloud secrets create SENDGRID_API_KEY --data-file=-
# echo -n "your-openai-key" | gcloud secrets create OPENAI_API_KEY --data-file=-
```

### Step 4: Create Artifact Registry Repository

```bash
# Create Docker repository
gcloud artifacts repositories create clinicconnect \
  --repository-format=docker \
  --location=us-central1 \
  --description="ClinicConnect Docker images"
```

### Step 5: Grant Permissions

```bash
# Get the Cloud Run service account
PROJECT_NUMBER=$(gcloud projects describe YOUR_PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Grant access to secrets
gcloud secrets add-iam-policy-binding DATABASE_URL \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding SESSION_SECRET \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"

# Grant Cloud SQL Client role
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudsql.client"
```

### Step 6: Deploy with Cloud Build

```bash
# Using the provided cloudbuild.yaml
gcloud builds submit \
  --config cloudbuild-artifact-registry.yaml \
  --substitutions=_REGION=us-central1,_CLOUD_SQL_CONNECTION=YOUR_PROJECT_ID:us-central1:clinicconnect-db
```

Or deploy manually:

```bash
# Build the image
docker build -t us-central1-docker.pkg.dev/YOUR_PROJECT_ID/clinicconnect/clinicconnect:latest -f Dockerfile.cloudrun .

# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev

# Push the image
docker push us-central1-docker.pkg.dev/YOUR_PROJECT_ID/clinicconnect/clinicconnect:latest

# Deploy to Cloud Run
gcloud run deploy clinicconnect \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT_ID/clinicconnect/clinicconnect:latest \
  --region us-central1 \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 80 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300s \
  --cpu-boost \
  --add-cloudsql-instances YOUR_PROJECT_ID:us-central1:clinicconnect-db \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest,SESSION_SECRET=SESSION_SECRET:latest" \
  --allow-unauthenticated
```

### Step 7: Run Database Migrations

```bash
# Connect to Cloud SQL using Cloud SQL Proxy
# Install: https://cloud.google.com/sql/docs/postgres/connect-admin-proxy

# Start proxy in another terminal
cloud-sql-proxy YOUR_PROJECT_ID:us-central1:clinicconnect-db

# Run migrations locally (in a new terminal)
DATABASE_URL="postgresql://clinicconnect_user:YOUR_PASSWORD@127.0.0.1:5432/clinicconnect" \
  npm run db:push
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ | Session encryption key (32+ chars) |
| `NODE_ENV` | ✅ | Set to `production` |
| `ALLOWED_ORIGINS` | ❌ | Comma-separated CORS origins |
| `SENDGRID_API_KEY` | ❌ | SendGrid API key for emails |
| `OPENAI_API_KEY` | ❌ | OpenAI API key for AI features |
| `ANTHROPIC_API_KEY` | ❌ | Anthropic API key for AI features |

### Recommended Cloud Run Settings

| Setting | Recommended | Notes |
|---------|-------------|-------|
| Memory | 1Gi | Increase for heavy usage |
| CPU | 1 | Increase for better performance |
| Min instances | 0 | Use 1 for no cold starts |
| Max instances | 10 | Adjust based on traffic |
| Concurrency | 80 | Requests per instance |
| Timeout | 300s | For long-running requests |
| CPU Boost | Enabled | Faster cold starts |

## Custom Domain Setup

```bash
# Map a custom domain
gcloud run domain-mappings create \
  --service clinicconnect \
  --domain app.yourdomain.com \
  --region us-central1

# Update ALLOWED_ORIGINS
gcloud run services update clinicconnect \
  --region us-central1 \
  --set-env-vars "ALLOWED_ORIGINS=https://app.yourdomain.com"
```

## CI/CD with Cloud Build Triggers

1. Go to Cloud Build → Triggers
2. Create a new trigger
3. Connect your GitHub/GitLab repository
4. Configure:
   - Event: Push to branch (main)
   - Configuration: cloudbuild-artifact-registry.yaml
   - Substitution variables:
     - `_REGION`: us-central1
     - `_CLOUD_SQL_CONNECTION`: YOUR_PROJECT_ID:us-central1:clinicconnect-db

## Monitoring & Logs

```bash
# View logs
gcloud run services logs read clinicconnect --region us-central1

# Stream logs
gcloud run services logs tail clinicconnect --region us-central1

# View in Cloud Console
# https://console.cloud.google.com/run/detail/us-central1/clinicconnect/logs
```

## Cost Optimization

1. **Set min-instances=0** for scale to zero (only pay when used)
2. **Use smaller tier** for Cloud SQL in development
3. **Enable CPU allocation only during requests** (default)
4. **Use regional storage** instead of multi-regional

### Estimated Monthly Costs (Low Traffic)

| Service | Estimate |
|---------|----------|
| Cloud Run (0-1 instance avg) | $0-20 |
| Cloud SQL (db-f1-micro) | ~$10 |
| Cloud Storage | ~$1 |
| **Total** | **~$15-30/month** |

## Troubleshooting

### Cold Start Issues
- Enable `--cpu-boost` for faster startup
- Set `--min-instances 1` for always-warm
- Optimize Docker image size

### Database Connection Errors
- Verify Cloud SQL connection string format
- Check IAM permissions for service account
- Ensure Cloud SQL instance is running

### Memory Issues
- Increase memory allocation
- Check for memory leaks in application
- Monitor with Cloud Monitoring

### View Container Logs
```bash
gcloud run services logs read clinicconnect --region us-central1 --limit 100
```

## Security Checklist

- [ ] Use Secret Manager for all sensitive values
- [ ] Enable IAP for internal-only access
- [ ] Set up Cloud Armor for DDoS protection
- [ ] Enable VPC connector for private database access
- [ ] Configure CORS properly in `ALLOWED_ORIGINS`
- [ ] Enable Cloud SQL backups
- [ ] Set up alerting for errors and high latency

