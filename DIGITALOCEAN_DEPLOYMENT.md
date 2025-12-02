# DigitalOcean Deployment Guide for ClinicConnect

## 🚀 Deployment Options

| Option | Best For | Cost | Effort |
|--------|----------|------|--------|
| **App Platform** | Quick deploy, managed infrastructure | $12-25/mo | Low |
| **Droplet + Docker** | Full control, cost-effective | $6-24/mo | Medium |
| **Kubernetes (DOKS)** | Enterprise, high availability | $24+/mo | High |

---

## Option 1: DigitalOcean App Platform (Recommended for Quick Start)

### Step 1: Prepare Your Repository

1. Push your code to GitHub/GitLab
2. Ensure these files exist:
   - `Dockerfile.optimized` ✅
   - `docker-compose.optimized.yml` ✅

### Step 2: Create App on DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Connect your GitHub repository
4. Select the branch to deploy (e.g., `main`)

### Step 3: Configure App

**App Settings:**
```yaml
Name: clinicconnect
Region: Choose closest to your users
```

**Add a Database:**
1. Click **"Add Resource"** → **"Database"**
2. Choose **PostgreSQL** (Dev Database: $0, Production: $15/mo)
3. Name it: `clinicconnect-db`

**Environment Variables:**
```bash
NODE_ENV=production
DATABASE_URL=${db.DATABASE_URL}  # Auto-injected by DO
SESSION_SECRET=your-super-secure-random-string-here
PORT=5001

# Optional API Keys
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key
SENDGRID_API_KEY=your-key
```

**Build Settings:**
```yaml
Dockerfile Path: Dockerfile.optimized
HTTP Port: 5001
Health Check Path: /api/health
```

### Step 4: Deploy

Click **"Create Resources"** and wait ~10 minutes for deployment.

**Estimated Cost:** $12-17/month (Basic Plan + Dev Database)

---

## Option 2: Droplet with Docker (More Control)

### Step 1: Create a Droplet

1. Go to [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets)
2. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic $12/mo (2GB RAM, 1 vCPU) or $24/mo (4GB RAM, 2 vCPU)
   - **Region:** Closest to users
   - **Authentication:** SSH Key (recommended)

### Step 2: Initial Server Setup

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app directory
mkdir -p /opt/clinicconnect
cd /opt/clinicconnect
```

### Step 3: Clone and Configure

```bash
# Clone your repository
git clone https://github.com/yourusername/clinicconnect.git .

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
DB_USER=clinicuser
DB_PASSWORD=your-secure-password-here
DATABASE_URL=postgresql://clinicuser:your-secure-password-here@db:5432/clinicconnect
SESSION_SECRET=your-super-secure-session-secret
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SENDGRID_API_KEY=
EOF

# Set secure permissions
chmod 600 .env
```

### Step 4: Deploy with Docker Compose

```bash
# Build and start services
docker compose -f docker-compose.optimized.yml up -d --build

# Check status
docker compose -f docker-compose.optimized.yml ps

# View logs
docker compose -f docker-compose.optimized.yml logs -f app
```

### Step 5: Setup Domain & SSL (Optional but Recommended)

```bash
# Install Certbot for free SSL
apt install certbot python3-certbot-nginx -y

# Point your domain to droplet IP (A record)
# Then run:
certbot --nginx -d your-domain.com -d www.your-domain.com
```

**Update nginx.conf for SSL:**
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Option 3: Managed Database + Droplet (Production Recommended)

For production, use DigitalOcean Managed PostgreSQL:

### Step 1: Create Managed Database

1. Go to **Databases** → **Create Database Cluster**
2. Choose:
   - Engine: **PostgreSQL 16**
   - Plan: $15/mo (Basic)
   - Region: Same as your Droplet

### Step 2: Get Connection String

Copy the connection string from the database dashboard:
```
postgresql://doadmin:password@db-cluster.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### Step 3: Update Environment

```bash
# Update .env with managed DB URL
DATABASE_URL=postgresql://doadmin:password@db-cluster.db.ondigitalocean.com:25060/clinicconnect?sslmode=require
```

### Step 4: Modify docker-compose for external DB

Create `docker-compose.production.yml`:
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.optimized
    container_name: clinicconnect-app
    restart: unless-stopped
    ports:
      - "5001:5001"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      SESSION_SECRET: ${SESSION_SECRET}
    volumes:
      - uploads_data:/app/uploads
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  uploads_data:
    driver: local
```

---

## 🔒 Security Checklist

- [ ] Use strong passwords (32+ characters)
- [ ] Enable DigitalOcean Firewall (allow only 80, 443, 22)
- [ ] Setup SSH key authentication (disable password login)
- [ ] Enable automatic security updates
- [ ] Setup database backups
- [ ] Use HTTPS with valid SSL certificate
- [ ] Set secure SESSION_SECRET

```bash
# Generate secure secrets
openssl rand -base64 32  # For SESSION_SECRET
openssl rand -base64 24  # For DB_PASSWORD
```

---

## 📊 Monitoring & Maintenance

### Setup Monitoring

```bash
# Install DigitalOcean monitoring agent
curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash
```

### Automatic Updates

```bash
# Create update script
cat > /opt/clinicconnect/update.sh << 'EOF'
#!/bin/bash
cd /opt/clinicconnect
git pull origin main
docker compose -f docker-compose.optimized.yml up -d --build
docker system prune -f
EOF

chmod +x /opt/clinicconnect/update.sh
```

### Database Backups

```bash
# Backup script for local PostgreSQL
cat > /opt/clinicconnect/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker exec clinicconnect-db pg_dump -U clinicuser clinicconnect > $BACKUP_DIR/backup_$DATE.sql
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
EOF

chmod +x /opt/clinicconnect/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/clinicconnect/backup.sh") | crontab -
```

---

## 💰 Cost Summary

| Component | Dev/Testing | Production |
|-----------|-------------|------------|
| **Droplet** | $6/mo (1GB) | $24/mo (4GB) |
| **Database** | Included | $15/mo (Managed) |
| **Spaces (Storage)** | - | $5/mo |
| **Total** | **$6/mo** | **$44/mo** |

**App Platform Alternative:**
| Plan | Cost |
|------|------|
| Basic (1 container) | $5/mo |
| + Dev Database | Free |
| + Pro Database | $15/mo |
| **Total** | **$5-20/mo** |

---

## 🚨 Quick Start Commands

```bash
# One-liner deployment on fresh Droplet
curl -fsSL https://get.docker.com | sh && \
git clone https://github.com/yourusername/clinicconnect.git /opt/clinicconnect && \
cd /opt/clinicconnect && \
cp .env.example .env && \
nano .env && \
docker compose -f docker-compose.optimized.yml up -d --build
```

---

## Need Help?

- [DigitalOcean Community](https://www.digitalocean.com/community)
- [Docker Documentation](https://docs.docker.com/)
- [Node.js Deployment Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

