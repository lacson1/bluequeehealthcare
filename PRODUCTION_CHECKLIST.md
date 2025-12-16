# Production Deployment Checklist

## ✅ Pre-Deployment Requirements

### 1. **Code Status**
- [x] Code pushed to GitHub: `lacson1/clinicconnect-2`
- [x] Dockerfile.optimized exists
- [x] docker-compose.production.yml configured
- [x] All seed/mock code removed
- [x] Database migrations ready

### 2. **Generate Security Secrets** ⚠️ REQUIRED

**CRITICAL:** These secrets MUST be generated and set before deployment. Without them:
- JWT tokens will be invalidated on server restart
- User sessions will not persist
- Authentication will break

```bash
# Generate JWT_SECRET (64+ characters recommended)
openssl rand -base64 64

# Generate SESSION_SECRET (64+ characters recommended)
openssl rand -base64 64
```

**Save these values securely** - you'll need them for environment variables.

### 3. **Required Environment Variables**

| Variable | Required | Description | How to Get |
|----------|----------|-------------|------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | Auto-injected by DigitalOcean or set manually |
| `JWT_SECRET` | ✅ Yes | JWT token signing secret | Generate with `openssl rand -base64 64` |
| `SESSION_SECRET` | ✅ Yes | Session encryption secret | Generate with `openssl rand -base64 64` |
| `NODE_ENV` | ✅ Yes | Must be `production` | Set to `production` |
| `PORT` | ✅ Yes | Server port | Set to `5001` |

**Optional (but recommended):**
- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For Claude AI features
- `SENDGRID_API_KEY` - For email notifications
- `ALLOWED_ORIGINS` - CORS origins (comma-separated)

---

## 🚀 Deployment Options

### Option 1: DigitalOcean App Platform (Easiest - Recommended)

**Cost:** $5-20/month
**Time:** 15-20 minutes
**Difficulty:** ⭐ Easy

#### Steps:

1. **Go to DigitalOcean App Platform**
   - Visit: https://cloud.digitalocean.com/apps
   - Click **"Create App"**

2. **Connect GitHub Repository**
   - Select **GitHub**
   - Choose: `lacson1/clinicconnect-2`
   - Branch: `main`
   - Enable **"Autodeploy"** ✅

3. **Configure App**
   - **Name:** `clinicconnect`
   - **Region:** Choose closest (e.g., `nyc`, `sfo`, `lon`)
   - **Build Type:** Docker
   - **Dockerfile Path:** `Dockerfile.optimized`
   - **HTTP Port:** `5001`

4. **Add Database**
   - Click **"Add Resource"** → **"Database"**
   - **Engine:** PostgreSQL 16
   - **Plan:** 
     - Dev Database (Free) - for testing
     - Production ($15/mo) - for production
   - **Name:** `clinicconnect-db`

5. **Set Environment Variables** 🔒
   
   **Required:**
   ```
   NODE_ENV = production
   PORT = 5001
   DATABASE_URL = ${db.DATABASE_URL}  (auto-injected)
   JWT_SECRET = <paste-your-generated-secret>
   SESSION_SECRET = <paste-your-generated-secret>
   ```
   
   **⚠️ IMPORTANT:** 
   - Mark `JWT_SECRET` and `SESSION_SECRET` as **SECRET** type (click lock icon 🔒)
   - Do NOT use plain text for secrets

6. **Deploy**
   - Click **"Create Resources"**
   - Wait 10-15 minutes
   - Monitor build logs

7. **Verify Deployment**
   - Check app URL: `https://your-app.ondigitalocean.app`
   - Test health: `https://your-app.ondigitalocean.app/api/health`
   - Check logs - should NOT see "Seeding..." messages
   - Test login functionality

---

### Option 2: DigitalOcean Droplet + Docker (More Control)

**Cost:** $12-44/month
**Time:** 30-45 minutes
**Difficulty:** ⭐⭐ Medium

#### Steps:

1. **Create Droplet**
   - Ubuntu 22.04 LTS
   - 2GB RAM minimum ($12/mo) or 4GB ($24/mo)
   - Add SSH key

2. **SSH into Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Docker**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   apt install docker-compose-plugin -y
   ```

4. **Clone Repository**
   ```bash
   cd /opt
   git clone https://github.com/lacson1/clinicconnect-2.git clinicconnect
   cd clinicconnect
   ```

5. **Create .env File**
   ```bash
   cat > .env << EOF
   NODE_ENV=production
   PORT=5001
   DATABASE_URL=postgresql://user:pass@host:5432/clinicconnect
   JWT_SECRET=<your-generated-secret>
   SESSION_SECRET=<your-generated-secret>
   EOF
   chmod 600 .env
   ```

6. **Deploy with Docker Compose**
   ```bash
   docker compose -f docker-compose.production.yml up -d --build
   ```

7. **Setup SSL (Optional but Recommended)**
   ```bash
   apt install certbot python3-certbot-nginx -y
   certbot --nginx -d your-domain.com
   ```

---

### Option 3: Use Existing app.yaml (CLI Deployment)

If you have `doctl` installed and authenticated:

```bash
# 1. Update .do/app.yaml with your secrets
# Replace the placeholder values for JWT_SECRET and SESSION_SECRET

# 2. Create the app
doctl apps create --spec .do/app.yaml

# 3. Check status
doctl apps list
doctl apps get <app-id>
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Strong `JWT_SECRET` generated (64+ characters)
- [ ] Strong `SESSION_SECRET` generated (64+ characters)
- [ ] Secrets marked as SECRET type (not plain text)
- [ ] Database uses SSL connection (`sslmode=require`)
- [ ] DigitalOcean Firewall configured (ports 80, 443, 22 only)
- [ ] SSH key authentication enabled (disable password login)
- [ ] HTTPS/SSL certificate configured
- [ ] CORS origins restricted (if using custom domain)
- [ ] Database backups enabled
- [ ] Monitoring/alerts configured

---

## 📊 Post-Deployment Verification

After deployment, verify:

1. **Health Check**
   ```bash
   curl https://your-app.ondigitalocean.app/api/health
   # Should return: {"status":"ok"}
   ```

2. **No Seed Messages**
   - Check logs in DigitalOcean dashboard
   - Should see: `🚀 Server running on port 5001`
   - Should NOT see: `🌱 Seeding...` messages

3. **Authentication Works**
   - Test login endpoint
   - Verify JWT tokens are generated
   - Check that sessions persist

4. **Database Connected**
   - Check logs for database connection success
   - Test API endpoints that require database

5. **Static Assets Load**
   - Check that CSS/JS files load correctly
   - Verify images and fonts load

---

## 🔄 Updating After Code Changes

**With Autodeploy Enabled:**
- Every push to `main` branch automatically triggers deployment
- Monitor deployments in DigitalOcean dashboard
- Check build logs for any issues

**Manual Update:**
```bash
# Trigger new deployment
doctl apps create-deployment <app-id>
```

---

## 💰 Cost Estimates

| Option | Monthly Cost |
|--------|--------------|
| **App Platform (Basic + Dev DB)** | $5/month |
| **App Platform (Basic + Prod DB)** | $20/month |
| **Droplet (2GB) + Managed DB** | $27/month |
| **Droplet (4GB) + Managed DB** | $39/month |

---

## 🆘 Troubleshooting

### Build Fails
- Check `Dockerfile.optimized` exists
- Verify all dependencies in `package.json`
- Check build logs in DigitalOcean dashboard

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check database firewall allows app connections
- Ensure SSL mode is set: `?sslmode=require`

### App Won't Start
- Check environment variables are set
- Verify `JWT_SECRET` and `SESSION_SECRET` are set
- Check application logs in DigitalOcean dashboard

### Authentication Errors
- Verify `JWT_SECRET` is set and consistent
- Check `SESSION_SECRET` is set
- Ensure secrets are marked as SECRET type (not plain text)

### Seed Code Still Running
- Verify latest code is deployed (check commit hash)
- Check that seed files are not in Docker image
- Rebuild Docker image if needed

---

## 📝 Quick Reference

**Generate Secrets:**
```bash
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For SESSION_SECRET
```

**Required Environment Variables:**
```bash
NODE_ENV=production
PORT=5001
DATABASE_URL=<your-database-url>
JWT_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>
```

**Health Check:**
```bash
curl https://your-app.ondigitalocean.app/api/health
```

**View Logs:**
```bash
# DigitalOcean App Platform
# Use dashboard or:
doctl apps logs <app-id> --type run

# Docker
docker compose -f docker-compose.production.yml logs -f app
```

---

## ✅ Ready to Deploy?

1. ✅ Code pushed to GitHub
2. ✅ Secrets generated (`JWT_SECRET`, `SESSION_SECRET`)
3. ✅ Database ready (DigitalOcean Managed or external)
4. ✅ Environment variables prepared
5. ✅ Deployment method chosen

**Next Step:** Follow the deployment steps for your chosen option above.

