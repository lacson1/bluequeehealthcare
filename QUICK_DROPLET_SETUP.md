# Quick DigitalOcean Droplet Setup

## Prerequisites

1. **DigitalOcean API Token**
   - Get from: https://cloud.digitalocean.com/account/api/tokens
   - Create a token with read/write permissions

2. **Set the token:**
   ```bash
   export TOKEN='your-digitalocean-api-token'
   ```

## Option 1: Using the Script (Recommended)

```bash
# Make script executable (if not already)
chmod +x create-digitalocean-droplet.sh

# Run the script
./create-digitalocean-droplet.sh
```

The script will:
- Create a droplet with recommended settings
- Wait for it to become active
- Display the IP address and next steps

## Option 2: Manual Creation with curl

```bash
# Set your token
export TOKEN='your-digitalocean-api-token'

# Create droplet
curl -X POST \
    -H 'Content-Type: application/json' \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name":"clinicconnect-prod",
        "size":"s-2vcpu-4gb",
        "region":"lon1",
        "image":"ubuntu-24-04-x64",
        "monitoring":true,
        "backups":false,
        "ipv6":true
    }' \
    "https://api.digitalocean.com/v2/droplets"
```

## After Droplet Creation

### 1. SSH into the droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 2. Install Docker and Docker Compose

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

### 3. Clone Repository

```bash
cd /opt
git clone https://github.com/lacson1/clinicconnect-2.git clinicconnect
cd clinicconnect
```

### 4. Create Environment File

```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
DB_PASSWORD=$(openssl rand -base64 24)

# Create .env file
cat > .env << EOF
NODE_ENV=production
PORT=5001
DB_USER=clinicuser
DB_PASSWORD=$DB_PASSWORD
DATABASE_URL=postgresql://clinicuser:$DB_PASSWORD@db:5432/clinicconnect
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# Optional API Keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SENDGRID_API_KEY=
EOF

# Secure the file
chmod 600 .env
```

### 5. Deploy with Docker Compose

```bash
# Build and start all services
docker compose -f docker-compose.optimized.yml up -d --build

# Check status
docker compose -f docker-compose.optimized.yml ps

# View logs
docker compose -f docker-compose.optimized.yml logs -f app
```

### 6. Verify Deployment

```bash
# Check if app is running
curl http://localhost:5001/api/health

# Check from outside (replace with your droplet IP)
curl http://YOUR_DROPLET_IP:5001/api/health
```

## Droplet Sizes

| Size | RAM | vCPU | Cost | Use Case |
|------|-----|------|------|----------|
| s-1vcpu-1gb | 1GB | 1 | $6/mo | Development/Testing |
| s-1vcpu-2gb | 2GB | 1 | $12/mo | Small Production |
| s-2vcpu-2gb | 2GB | 2 | $18/mo | Medium Production |
| s-2vcpu-4gb | 4GB | 2 | $24/mo | **Recommended** |
| s-4vcpu-8gb | 8GB | 4 | $48/mo | Large Production |

## Regions

Choose the region closest to your users:
- `nyc1`, `nyc3` - New York, USA
- `sfo3` - San Francisco, USA
- `lon1` - London, UK
- `fra1` - Frankfurt, Germany
- `sgp1` - Singapore
- `tor1` - Toronto, Canada
- `blr1` - Bangalore, India
- `syd1` - Sydney, Australia

## Security Setup

### 1. Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Setup SSH Key Authentication

```bash
# On your local machine, copy your SSH key
ssh-copy-id root@YOUR_DROPLET_IP

# Disable password authentication (edit /etc/ssh/sshd_config)
# Set: PasswordAuthentication no
# Then restart: systemctl restart sshd
```

### 3. Setup Domain and SSL (Optional)

```bash
# Install Nginx and Certbot
apt install nginx certbot python3-certbot-nginx -y

# Point your domain to droplet IP (A record in DNS)

# Get SSL certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Monitoring

```bash
# Install DigitalOcean monitoring agent
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

## Troubleshooting

### Can't SSH into droplet
- Check firewall allows port 22
- Verify IP address is correct
- Check DigitalOcean dashboard for droplet status

### App won't start
- Check logs: `docker compose logs app`
- Verify .env file has all required variables
- Check database is running: `docker compose ps`

### Database connection errors
- Verify DATABASE_URL in .env
- Check database container is running
- Ensure database is accessible from app container

## Cost Estimate

**Basic Setup:**
- Droplet (s-2vcpu-4gb): $24/month
- **Total: $24/month**

**With Managed Database:**
- Droplet (s-2vcpu-4gb): $24/month
- Managed PostgreSQL: $15/month
- **Total: $39/month**

## Next Steps

1. ✅ Droplet created
2. ✅ Docker installed
3. ✅ Application deployed
4. ⏭️ Setup domain and SSL
5. ⏭️ Configure backups
6. ⏭️ Setup monitoring alerts

