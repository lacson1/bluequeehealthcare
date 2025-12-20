#!/bin/bash
# Deploy ClinicConnect to Google Cloud Run
# Usage: ./deploy-cloudrun.sh [options]
#
# Options:
#   --project     GCP Project ID (required)
#   --region      GCP Region (default: us-central1)
#   --service     Cloud Run service name (default: clinicconnect)
#   --cloud-sql   Cloud SQL instance connection name (optional)
#   --min         Minimum instances (default: 0)
#   --max         Maximum instances (default: 10)
#   --memory      Memory allocation (default: 1Gi)

set -e

# Default values
REGION="us-central1"
SERVICE_NAME="clinicconnect"
MIN_INSTANCES="0"
MAX_INSTANCES="10"
MEMORY="1Gi"
CPU="1"
CLOUD_SQL_CONNECTION=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            PROJECT_ID="$2"
            shift 2
            ;;
        --region)
            REGION="$2"
            shift 2
            ;;
        --service)
            SERVICE_NAME="$2"
            shift 2
            ;;
        --cloud-sql)
            CLOUD_SQL_CONNECTION="$2"
            shift 2
            ;;
        --min)
            MIN_INSTANCES="$2"
            shift 2
            ;;
        --max)
            MAX_INSTANCES="$2"
            shift 2
            ;;
        --memory)
            MEMORY="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Check required arguments
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: --project is required${NC}"
    echo "Usage: $0 --project YOUR_PROJECT_ID [options]"
    exit 1
fi

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}  ClinicConnect Cloud Run Deployment  ${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${GREEN}Project:${NC} $PROJECT_ID"
echo -e "${GREEN}Region:${NC} $REGION"
echo -e "${GREEN}Service:${NC} $SERVICE_NAME"
echo -e "${GREEN}Memory:${NC} $MEMORY"
echo -e "${GREEN}Instances:${NC} $MIN_INSTANCES - $MAX_INSTANCES"
if [ -n "$CLOUD_SQL_CONNECTION" ]; then
    echo -e "${GREEN}Cloud SQL:${NC} $CLOUD_SQL_CONNECTION"
fi
echo ""

# Set project
echo -e "${YELLOW}Setting GCP project...${NC}"
gcloud config set project "$PROJECT_ID"

# Enable required APIs
echo -e "${YELLOW}Enabling required APIs...${NC}"
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com \
    --quiet

# Create Artifact Registry repository if it doesn't exist
echo -e "${YELLOW}Checking Artifact Registry repository...${NC}"
if ! gcloud artifacts repositories describe "$SERVICE_NAME" --location="$REGION" &>/dev/null; then
    echo -e "${YELLOW}Creating Artifact Registry repository...${NC}"
    gcloud artifacts repositories create "$SERVICE_NAME" \
        --repository-format=docker \
        --location="$REGION" \
        --description="$SERVICE_NAME Docker images"
fi

# Configure Docker for Artifact Registry
echo -e "${YELLOW}Configuring Docker authentication...${NC}"
gcloud auth configure-docker "${REGION}-docker.pkg.dev" --quiet

# Build the Docker image
IMAGE_URI="${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/${SERVICE_NAME}:$(date +%Y%m%d-%H%M%S)"
IMAGE_LATEST="${REGION}-docker.pkg.dev/${PROJECT_ID}/${SERVICE_NAME}/${SERVICE_NAME}:latest"

echo -e "${YELLOW}Building Docker image...${NC}"
docker build -t "$IMAGE_URI" -t "$IMAGE_LATEST" .

# Push the image
echo -e "${YELLOW}Pushing Docker image...${NC}"
docker push "$IMAGE_URI"
docker push "$IMAGE_LATEST"

# Build deploy command
DEPLOY_CMD="gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_URI \
    --region $REGION \
    --platform managed \
    --memory $MEMORY \
    --cpu $CPU \
    --concurrency 80 \
    --min-instances $MIN_INSTANCES \
    --max-instances $MAX_INSTANCES \
    --timeout 300s \
    --cpu-boost \
    --set-env-vars NODE_ENV=production"

# Add Cloud SQL if specified
if [ -n "$CLOUD_SQL_CONNECTION" ]; then
    DEPLOY_CMD="$DEPLOY_CMD --add-cloudsql-instances $CLOUD_SQL_CONNECTION"
fi

# Check if secrets exist and add them
echo -e "${YELLOW}Checking for secrets...${NC}"
SECRETS=""
if gcloud secrets describe DATABASE_URL &>/dev/null; then
    SECRETS="${SECRETS}DATABASE_URL=DATABASE_URL:latest,"
    echo -e "${GREEN}✓ DATABASE_URL secret found${NC}"
else
    echo -e "${YELLOW}⚠ DATABASE_URL secret not found - you'll need to set this manually${NC}"
fi

if gcloud secrets describe SESSION_SECRET &>/dev/null; then
    SECRETS="${SECRETS}SESSION_SECRET=SESSION_SECRET:latest,"
    echo -e "${GREEN}✓ SESSION_SECRET secret found${NC}"
else
    echo -e "${YELLOW}⚠ SESSION_SECRET secret not found - you'll need to set this manually${NC}"
fi

if gcloud secrets describe SENDGRID_API_KEY &>/dev/null; then
    SECRETS="${SECRETS}SENDGRID_API_KEY=SENDGRID_API_KEY:latest,"
    echo -e "${GREEN}✓ SENDGRID_API_KEY secret found${NC}"
fi

if gcloud secrets describe OPENAI_API_KEY &>/dev/null; then
    SECRETS="${SECRETS}OPENAI_API_KEY=OPENAI_API_KEY:latest,"
    echo -e "${GREEN}✓ OPENAI_API_KEY secret found${NC}"
fi

# Remove trailing comma and add to command
if [ -n "$SECRETS" ]; then
    SECRETS="${SECRETS%,}"
    DEPLOY_CMD="$DEPLOY_CMD --set-secrets $SECRETS"
fi

# Add allow-unauthenticated
DEPLOY_CMD="$DEPLOY_CMD --allow-unauthenticated"

# Deploy
echo -e "${YELLOW}Deploying to Cloud Run...${NC}"
eval "$DEPLOY_CMD"

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format 'value(status.url)')

echo ""
echo -e "${GREEN}======================================${NC}"
echo -e "${GREEN}  Deployment Complete! 🚀${NC}"
echo -e "${GREEN}======================================${NC}"
echo ""
echo -e "${GREEN}Service URL:${NC} $SERVICE_URL"
echo -e "${GREEN}Health Check:${NC} $SERVICE_URL/api/health"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update ALLOWED_ORIGINS if using a custom domain"
echo "2. Run database migrations if needed"
echo "3. Set up Cloud Build triggers for CI/CD"
echo ""

