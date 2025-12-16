# Deployment Database Error Fix

## Error
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

## Root Cause
The `DATABASE_URL` environment variable is not being set in the DigitalOcean App Platform. The `.do/app.yaml` references `${db.DATABASE_URL}`, but the database component may not be properly linked.

## Solution Options

### Option 1: Set DATABASE_URL Manually (Quick Fix) ⚡

1. **Go to DigitalOcean Dashboard:**
   - https://cloud.digitalocean.com/apps/b2c2085f-d938-428c-9299-1165af8dfc3c/settings

2. **Navigate to Environment Variables:**
   - Settings → App-Level Environment Variables

3. **Add/Update DATABASE_URL:**
   - **Key**: `DATABASE_URL`
   - **Scope**: Run Time
   - **Value**: Your PostgreSQL connection string
     ```
     postgresql://user:password@host:port/database?sslmode=require
     ```
   - **Get the connection string from:**
     - DigitalOcean Databases → Your Database → Connection Details
     - Or from your existing database if you have one

4. **Also Set Required Secrets:**
   - `JWT_SECRET` (as SECRET type) = `hTHerpoXMnHeojvaGCRqO9/aLuE/JtaMkNUfr0xVHFGdJSyP/BUP7AmQJsRupiChp8/JP+VKWzrbBy0v92F7Nw==`
   - `SESSION_SECRET` (as SECRET type) = `Wv3VetMSsAJoD/loK7TZeG60cXGJokk9T5+fKWxEiym0SvpwIKg0Ckg3LYUB/COt+Um4EUjpxvcbqkbvXBWh2g==`

5. **Save and Redeploy**

### Option 2: Link Database Component (Recommended) 🔗

If you have a database component in your app:

1. **Check Database Component Name:**
   ```bash
   doctl apps get b2c2085f-d938-428c-9299-1165af8dfc3c -o json | grep -A 5 "databases"
   ```

2. **Update `.do/app.yaml`** to match the actual database name:
   ```yaml
   - key: DATABASE_URL
     scope: RUN_TIME
     value: ${YOUR_DB_NAME.DATABASE_URL}  # Replace YOUR_DB_NAME
   ```

3. **Update the app spec:**
   ```bash
   doctl apps update b2c2085f-d938-428c-9299-1165af8dfc3c --spec .do/app.yaml
   ```

### Option 3: Create New Database Component

If no database exists:

1. **Add Database to App:**
   - Go to: https://cloud.digitalocean.com/apps/b2c2085f-d938-428c-9299-1165af8dfc3c/components
   - Click "Add Component" → "Database"
   - Choose PostgreSQL 16
   - Name it `db` (to match app.yaml)

2. **Update App Spec:**
   - The `.do/app.yaml` already has the database definition
   - Redeploy the app

## Quick Fix Steps (Recommended)

### Step 1: Get Database Connection String

**If you have an existing DigitalOcean Managed Database:**
1. Go to: https://cloud.digitalocean.com/databases
2. Click on your database
3. Go to "Connection Details"
4. Copy the "Connection String" (or construct it manually)

**If you need to create a database:**
1. Go to: https://cloud.digitalocean.com/databases/new
2. Choose PostgreSQL 16
3. Choose a plan (db-s-dev-database is free for dev)
4. Create the database
5. Get the connection string from Connection Details

### Step 2: Set Environment Variables in DigitalOcean

1. Go to: https://cloud.digitalocean.com/apps/b2c2085f-d938-428c-9299-1165af8dfc3c/settings
2. Scroll to "App-Level Environment Variables"
3. Add/Update:

   **DATABASE_URL:**
   - Key: `DATABASE_URL`
   - Scope: `Run Time`
   - Value: `postgresql://user:password@host:port/database?sslmode=require`
   - (Use your actual connection string)

   **JWT_SECRET:**
   - Key: `JWT_SECRET`
   - Scope: `Run Time`
   - Type: `SECRET` (click the 🔒 lock icon)
   - Value: `hTHerpoXMnHeojvaGCRqO9/aLuE/JtaMkNUfr0xVHFGdJSyP/BUP7AmQJsRupiChp8/JP+VKWzrbBy0v92F7Nw==`

   **SESSION_SECRET:**
   - Key: `SESSION_SECRET`
   - Scope: `Run Time`
   - Type: `SECRET` (click the 🔒 lock icon)
   - Value: `Wv3VetMSsAJoD/loK7TZeG60cXGJokk9T5+fKWxEiym0SvpwIKg0Ckg3LYUB/COt+Um4EUjpxvcbqkbvXBWh2g==`

4. **Save Changes**

### Step 3: Redeploy

1. Go to: https://cloud.digitalocean.com/apps/b2c2085f-d938-428c-9299-1165af8dfc3c
2. Click "Actions" → "Create Deployment"
3. Or wait for auto-deploy on next push

## Verify Database Connection

After deployment, check the logs:
```bash
doctl apps logs b2c2085f-d938-428c-9299-1165af8dfc3c --follow
```

Look for:
- ✅ "🐘 Using PostgreSQL database with standard connection"
- ❌ "Error: DATABASE_URL must be set" (if still failing)

## Database Connection String Format

For DigitalOcean Managed Databases:
```
postgresql://doadmin:PASSWORD@HOST:PORT/database?sslmode=require
```

Example:
```
postgresql://doadmin:abc123@db-postgresql-nyc1-12345.db.ondigitalocean.com:25060/defaultdb?sslmode=require
```

## Troubleshooting

### Issue: Database connection timeout
- **Fix**: Check firewall rules allow app connections
- **Fix**: Verify SSL mode is `require` in connection string

### Issue: Authentication failed
- **Fix**: Verify username and password in connection string
- **Fix**: Check database user permissions

### Issue: Database not found
- **Fix**: Verify database name in connection string
- **Fix**: Check database exists in DigitalOcean

## Next Steps

After fixing DATABASE_URL:
1. ✅ Set JWT_SECRET and SESSION_SECRET
2. ✅ Redeploy the app
3. ✅ Verify deployment succeeds
4. ✅ Check application logs for any other errors





