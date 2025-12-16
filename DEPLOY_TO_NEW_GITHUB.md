# Deploy to New GitHub Repository

## ✅ Changes Made

1. ✅ Removed `replitAuthId` field from `shared/schema.ts`
2. ✅ Created migration `013_remove_replit_auth_id.sql` to drop the column from database
3. ✅ Updated `.do/app.yaml` with placeholder for new GitHub repo

## 🚀 Steps to Deploy to New GitHub Repository

### Step 1: Create/Prepare Your New GitHub Repository

1. Create a new repository on GitHub (or use an existing one)
2. Note the repository name: `username/repository-name`

### Step 2: Update .do/app.yaml

Edit `.do/app.yaml` and replace:
```yaml
repo: YOUR_USERNAME/YOUR_REPO_NAME
```

With your actual repository:
```yaml
repo: your-username/your-repo-name
```

### Step 3: Push Code to New Repository

```bash
# Add new remote (replace with your repo URL)
git remote add new-origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to new repository
git push new-origin main

# Or if you want to make it your main remote:
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push origin main
```

### Step 4: Deploy on DigitalOcean

#### Option A: Via Dashboard (Recommended)

1. Go to https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Select **"GitHub"** as source
4. Choose your **NEW repository** (not the old one)
5. Select branch: `main`
6. Enable **"Autodeploy"** ✅
7. Follow the rest of the deployment steps from `DEPLOY_NOW.md`

#### Option B: Via CLI (if using app.yaml)

```bash
# Make sure .do/app.yaml has the correct repo name
doctl apps create --spec .do/app.yaml
```

### Step 5: Verify Migration Runs

The migration `013_remove_replit_auth_id.sql` will automatically run on deployment startup. Check the logs to confirm:

```bash
# In DigitalOcean dashboard, check Runtime Logs
# Should see: "🔄 Running database migrations..."
# Should see: "📝 Running migration: 013_remove_replit_auth_id.sql"
```

---

## 📝 What Changed

### Schema Changes
- **Removed:** `replitAuthId` field from `users` table schema
- **File:** `shared/schema.ts`

### Database Migration
- **Created:** `server/migrations/013_remove_replit_auth_id.sql`
- **Action:** Drops `replit_auth_id` column from `users` table
- **Runs:** Automatically on deployment startup

### Deployment Config
- **Updated:** `.do/app.yaml` with placeholder for new repo
- **Action Required:** Update with your actual GitHub repository name

---

## ✅ Verification Checklist

After deployment:

- [ ] Code pushed to new GitHub repository
- [ ] `.do/app.yaml` updated with new repo name
- [ ] DigitalOcean app created/updated with new repository
- [ ] Migration runs successfully (check logs)
- [ ] `replit_auth_id` column removed from database
- [ ] Application starts without errors
- [ ] Login/authentication works correctly

---

## 🔄 If You Need to Keep Old Repo

If you want to keep both repositories:

```bash
# Keep old remote
git remote rename origin old-origin

# Add new remote as origin
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to both
git push old-origin main  # Old repo
git push origin main      # New repo
```

---

## 📚 Related Files

- `DEPLOY_NOW.md` - Full deployment guide
- `PRODUCTION_CHECKLIST.md` - Production checklist
- `.do/app.yaml` - DigitalOcean app configuration
- `server/migrations/013_remove_replit_auth_id.sql` - Migration file

