# 🚀 Deploy to Production NOW

## ✅ Pre-Flight Check

- [x] Secrets generated and saved to `DEPLOYMENT_SECRETS.txt`
- [x] Code pushed to GitHub: `lacson1/clinicconnect-2`
- [x] Dockerfile.optimized ready
- [x] Database migrations configured

## 🎯 Quick Deployment (15 minutes)

### Step 1: Open DigitalOcean App Platform
👉 **Go to:** https://cloud.digitalocean.com/apps

### Step 2: Create New App
1. Click **"Create App"**
2. Select **"GitHub"** as source
3. Authorize DigitalOcean if needed
4. Choose repository: **`lacson1/clinicconnect-2`**
5. Select branch: **`main`**
6. ✅ Enable **"Autodeploy"** (deploys on every push)

### Step 3: Configure App Settings
- **Name:** `clinicconnect`
- **Region:** Choose closest (e.g., `nyc`, `sfo`, `lon`)
- **Build Type:** Docker
- **Dockerfile Path:** `Dockerfile.optimized`
- **HTTP Port:** `5001`

### Step 4: Add Database
1. Click **"Add Resource"** → **"Database"**
2. **Engine:** PostgreSQL 16
3. **Plan:** 
   - Dev Database (Free) - for testing
   - Production ($15/mo) - for production use
4. **Name:** `clinicconnect-db`

### Step 5: Set Environment Variables 🔒

**Open `DEPLOYMENT_SECRETS.txt` and copy the values.**

In DigitalOcean dashboard, go to **Settings** → **App-Level Environment Variables**:

#### Required Variables:

1. **NODE_ENV**
   - Key: `NODE_ENV`
   - Value: `production`
   - Type: Plain text

2. **PORT**
   - Key: `PORT`
   - Value: `5001`
   - Type: Plain text

3. **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: `${db.DATABASE_URL}`
   - Type: Plain text
   - ⚠️ This is auto-injected from the database resource

4. **JWT_SECRET** 🔒
   - Key: `JWT_SECRET`
   - Value: `ynhodiUktHeyCXQMzbfJCoMkry2s701KANwk5BCRk8JN5wIqa7jF92r1w6nAasX8sMWmg7QIsggqvcBjXoOtWw==`
   - Type: **SECRET** (click lock icon 🔒)
   - ⚠️ **CRITICAL:** Must be marked as SECRET type

5. **SESSION_SECRET** 🔒
   - Key: `SESSION_SECRET`
   - Value: `V3+rT521oOycpAFYO9ecMO2I3c129WHqRmNLeUWCmyJqSaa1g0ap0LnsZBz3T6w30ilEjAbBk3xhswnsVPuZlw==`
   - Type: **SECRET** (click lock icon 🔒)
   - ⚠️ **CRITICAL:** Must be marked as SECRET type

#### Optional Variables (if needed):

- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For Claude AI
- `SENDGRID_API_KEY` - For email notifications

### Step 6: Deploy! 🚀
1. Click **"Create Resources"**
2. Wait 10-15 minutes for build
3. Monitor build logs in the dashboard

### Step 7: Verify Deployment ✅

After deployment completes:

1. **Check App URL**
   - DigitalOcean will provide: `https://your-app.ondigitalocean.app`
   - Visit the URL in your browser

2. **Test Health Endpoint**
   ```bash
   curl https://your-app.ondigitalocean.app/api/health
   ```
   Should return: `{"status":"ok"}`

3. **Check Logs**
   - Go to **Runtime Logs** in DigitalOcean dashboard
   - Should see: `🚀 Server running on port 5001`
   - Should NOT see: `🌱 Seeding...` messages

4. **Test Login**
   - Try logging in with your credentials
   - Verify authentication works

---

## 🔧 Alternative Deployment Options

### Option A: Deploy via CLI (if you have doctl)

If you have `doctl` installed and authenticated:

```bash
# 1. Update .do/app.yaml with secrets (or set via dashboard)
# 2. Create the app
doctl apps create --spec .do/app.yaml

# 3. Monitor deployment
doctl apps list
doctl apps get <app-id>
doctl apps logs <app-id> --type run
```

### Option B: Deploy to Droplet (More Control)

If you prefer a Droplet with Docker for more control:

#### Step 1: Create a Droplet

1. Go to [DigitalOcean Droplets](https://cloud.digitalocean.com/droplets)
2. Choose:
   - **Image:** Ubuntu 22.04 LTS
   - **Plan:** Basic $12/mo (2GB RAM, 1 vCPU) or $24/mo (4GB RAM, 2 vCPU)
   - **Region:** Closest to users
   - **Authentication:** SSH Key (recommended)

#### Step 2: Initial Server Setup

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

#### Step 3: Clone and Configure

```bash
# Clone your repository
git clone https://github.com/lacson1/clinicconnect-2.git .

# Create environment file
cat > .env << 'EOF'
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://user:pass@host:5432/clinicconnect

# REQUIRED: Generate with: openssl rand -base64 64
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-super-secure-session-secret

# Optional API Keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SENDGRID_API_KEY=
EOF

# Set secure permissions
chmod 600 .env
```

#### Step 4: Deploy with Docker Compose

```bash
# Build and start services
docker compose -f docker-compose.optimized.yml up -d --build

# Check status
docker compose -f docker-compose.optimized.yml ps

# View logs
docker compose -f docker-compose.optimized.yml logs -f app
```

#### Step 5: Setup Domain & SSL (Optional but Recommended)

```bash
# Install Certbot for free SSL
apt install certbot python3-certbot-nginx -y

# Point your domain to droplet IP (A record)
# Then run:
certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Option C: Managed Database + Droplet (Production Recommended)

For production, use DigitalOcean Managed PostgreSQL:

1. Go to **Databases** → **Create Database Cluster**
2. Choose PostgreSQL 16, Basic plan ($15/mo)
3. Get connection string from database dashboard
4. Update `.env` with managed database URL
5. Use `docker-compose.production.yml` (excludes local DB)

---

## 🆘 Troubleshooting

### Build Fails
- Check build logs in DigitalOcean dashboard
- Verify `Dockerfile.optimized` exists
- Check that all dependencies are in `package.json`

### Database Connection Error
- Verify `DATABASE_URL` is set to `${db.DATABASE_URL}`
- Check database is running and accessible
- Ensure SSL mode is correct

### App Won't Start
- Check environment variables are set correctly
- Verify `JWT_SECRET` and `SESSION_SECRET` are marked as SECRET type
- Check runtime logs for errors

### Authentication Not Working
- Verify `JWT_SECRET` is set and consistent
- Check `SESSION_SECRET` is set
- Ensure secrets are marked as SECRET type (not plain text)

---

## 📊 What Happens During Deployment

1. **Build Phase** (5-10 min)
   - Docker builds the image from `Dockerfile.optimized`
   - Frontend assets are built
   - Backend is compiled

2. **Database Setup** (automatic)
   - Database migrations run on startup
   - Tables are created/updated

3. **Deploy Phase** (2-5 min)
   - Container starts
   - Health checks run
   - App becomes available

---

## 💰 Cost Comparison

### App Platform (Recommended)
- **Basic Plan:** $5/month
- **Dev Database:** Free
- **Production Database:** $15/month (optional)
- **Total:** $5-20/month

### Droplet Deployment
- **Droplet:** $12-24/month (2-4GB RAM)
- **Managed Database:** $15/month
- **Total:** $27-39/month

**Recommendation:** Use App Platform for quick deployment, Droplet for more control.

---

## ✅ Post-Deployment Checklist

- [ ] App is accessible at provided URL
- [ ] Health check endpoint works: `/api/health`
- [ ] No seed messages in logs
- [ ] Login works correctly
- [ ] Database connection successful
- [ ] JWT tokens are generated properly
- [ ] Static assets load correctly

---

## 🔄 Updating After Code Changes

Since autodeploy is enabled:
- Every push to `main` branch automatically triggers deployment
- Monitor deployments in DigitalOcean dashboard
- Check build logs for any issues

---

## 🎉 You're Live!

Once deployed, your app will be available at:
`https://your-app.ondigitalocean.app`

**Next Steps:**
1. Test all major features
2. Set up monitoring/alerts
3. Configure custom domain (optional)
4. Enable database backups
5. Set up SSL certificate (if using custom domain)

---

## 📝 Important Notes

- **Secrets:** The `DEPLOYMENT_SECRETS.txt` file contains sensitive data. Do NOT commit it to git.
- **Database:** Migrations run automatically on startup
- **Health Checks:** App Platform monitors `/api/health` endpoint
- **Autodeploy:** Enabled - every push to `main` triggers deployment

---

## 📊 Monitoring & Maintenance (Droplet Only)

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

**Need Help?** Check `PRODUCTION_CHECKLIST.md` for detailed troubleshooting.

