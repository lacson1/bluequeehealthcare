# Bluequee - Deployment Guide

## 🚀 Production Deployment

### Option 1: Replit Deployment
1. Import project to Replit
2. Set environment variables in Secrets
3. Click "Deploy" button
4. Configure custom domain (optional)

### Option 2: Traditional Hosting

#### Prerequisites
- Node.js 18+
- PostgreSQL database
- Web server (nginx/Apache)

#### Steps
1. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb bluequee_production
   
   # Set DATABASE_URL
   export DATABASE_URL="postgresql://user:pass@host:5432/bluequee_production"
   ```

2. **Application Setup**
   ```bash
   # Clone and install
   git clone <your-repo>
   cd bluequee
   npm install --production
   
   # Build application
   npm run build
   
   # Run database migrations
   npm run db:push
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with production values
   nano .env
   ```

4. **Process Management**
   ```bash
   # Using PM2
   npm install -g pm2
   pm2 start npm --name "bluequee" -- start
   pm2 startup
   pm2 save
   ```

### Option 3: Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Checklist

- [ ] Change default credentials
- [ ] Set secure SESSION_SECRET
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure rate limiting
- [ ] Set up monitoring

## 📊 Monitoring

### Health Checks
- `GET /api/health` - Application health
- `GET /api/health/db` - Database connectivity

### Logging
- Application logs: `/var/log/bluequee/`
- Error tracking built-in
- Audit logs in database

## 🔄 Maintenance

### Regular Tasks
- Database backups
- Log rotation
- Security updates
- Performance monitoring

### Backup Strategy
```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/bluequee
```
