#!/bin/bash

# DigitalOcean Droplet Creation Script for ClinicConnect
# Usage: ./create-digitalocean-droplet.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 DigitalOcean Droplet Creation for ClinicConnect${NC}"
echo ""

# Check if TOKEN is set
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Error: TOKEN environment variable is not set${NC}"
    echo ""
    echo "Please set your DigitalOcean API token:"
    echo "  export TOKEN='your-digitalocean-api-token'"
    echo ""
    echo "Get your token from: https://cloud.digitalocean.com/account/api/tokens"
    exit 1
fi

# Configuration
DROPLET_NAME="${DROPLET_NAME:-clinicconnect-prod}"
DROPLET_SIZE="${DROPLET_SIZE:-s-2vcpu-4gb}"  # 2GB RAM, 2 vCPU - good for production
DROPLET_REGION="${DROPLET_REGION:-lon1}"     # London 1
DROPLET_IMAGE="${DROPLET_IMAGE:-ubuntu-24-04-x64}"

# Available sizes (uncomment to use different size):
# s-1vcpu-1gb    - $6/mo  (1GB RAM, 1 vCPU) - Development
# s-1vcpu-2gb    - $12/mo (2GB RAM, 1 vCPU) - Small production
# s-2vcpu-2gb    - $18/mo (2GB RAM, 2 vCPU) - Medium production
# s-2vcpu-4gb    - $24/mo (4GB RAM, 2 vCPU) - Recommended for production
# s-4vcpu-8gb    - $48/mo (8GB RAM, 4 vCPU) - Large production

# Available regions:
# nyc1, nyc3    - New York
# sfo3          - San Francisco
# sgp1          - Singapore
# lon1          - London
# fra1          - Frankfurt
# tor1          - Toronto
# blr1          - Bangalore
# syd1          - Sydney

echo "Configuration:"
echo "  Name: $DROPLET_NAME"
echo "  Size: $DROPLET_SIZE"
echo "  Region: $DROPLET_REGION"
echo "  Image: $DROPLET_IMAGE"
echo ""

# Ask for confirmation
read -p "Create droplet with these settings? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Creating droplet...${NC}"

# Create the droplet
RESPONSE=$(curl -s -X POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"name\": \"$DROPLET_NAME\",
        \"size\": \"$DROPLET_SIZE\",
        \"region\": \"$DROPLET_REGION\",
        \"image\": \"$DROPLET_IMAGE\",
        \"monitoring\": true,
        \"backups\": false,
        \"ipv6\": true,
        \"user_data\": \"#!/bin/bash\\napt-get update\\napt-get install -y docker.io docker-compose-plugin\\nsystemctl enable docker\\nsystemctl start docker\\n\"
    }" \
    "https://api.digitalocean.com/v2/droplets")

# Check if request was successful
if echo "$RESPONSE" | grep -q '"id"'; then
    DROPLET_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo -e "${GREEN}✅ Droplet created successfully!${NC}"
    echo ""
    echo "Droplet ID: $DROPLET_ID"
    echo ""
    echo -e "${YELLOW}Waiting for droplet to be active (this may take 1-2 minutes)...${NC}"
    
    # Wait for droplet to be active
    STATUS="new"
    while [ "$STATUS" != "active" ]; do
        sleep 5
        STATUS_RESPONSE=$(curl -s -X GET \
            -H "Authorization: Bearer $TOKEN" \
            "https://api.digitalocean.com/v2/droplets/$DROPLET_ID")
        STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "  Status: $STATUS"
    done
    
    echo ""
    echo -e "${GREEN}✅ Droplet is now active!${NC}"
    echo ""
    
    # Get droplet IP address
    IP_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "https://api.digitalocean.com/v2/droplets/$DROPLET_ID")
    
    IP_ADDRESS=$(echo "$IP_RESPONSE" | grep -o '"ip_address":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$IP_ADDRESS" ]; then
        echo "🌐 IP Address: $IP_ADDRESS"
        echo ""
        echo "Next steps:"
        echo "  1. SSH into your droplet:"
        echo "     ssh root@$IP_ADDRESS"
        echo ""
        echo "  2. Clone your repository:"
        echo "     cd /opt"
        echo "     git clone https://github.com/lacson1/clinicconnect-2.git clinicconnect"
        echo "     cd clinicconnect"
        echo ""
        echo "  3. Create .env file with your configuration"
        echo ""
        echo "  4. Deploy with Docker Compose:"
        echo "     docker compose -f docker-compose.optimized.yml up -d --build"
        echo ""
    else
        echo "⚠️  Could not retrieve IP address. Check DigitalOcean dashboard."
    fi
    
    echo ""
    echo "View droplet in dashboard:"
    echo "  https://cloud.digitalocean.com/droplets/$DROPLET_ID"
    
else
    echo -e "${RED}❌ Error creating droplet${NC}"
    echo ""
    echo "Response:"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
    echo ""
    echo "Common issues:"
    echo "  - Invalid API token"
    echo "  - Insufficient account balance"
    echo "  - Invalid region or size"
    exit 1
fi

