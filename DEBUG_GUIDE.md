# 🔧 ClinicConnect Debug Guide

This guide helps you debug and troubleshoot the ClinicConnect application.

## Quick Debug Commands

### 1. Run Debug Tool
```bash
npm run debug
```

This comprehensive debug tool checks:
- ✅ Environment variables (DATABASE_URL, etc.)
- ✅ Database connection
- ✅ Table accessibility
- ✅ Existing data (organizations, users, patients)
- ✅ Seed data requirements

**Output:**
- ✅ PASS - Everything is working
- ❌ FAIL - Critical issue that prevents startup
- ⚠️  WARN - Non-critical issue or missing optional data

### 2. Seed Mock Data
```bash
npm run seed:mock
```

Creates:
- 1 default organization ("Demo Clinic")
- 2 mock patients (John Doe, Mary Johnson)
- 2 mock staff members (doctor.smith, nurse.williams)

**Note:** This is idempotent - it won't create duplicates if data already exists.

### 3. Type Check
```bash
npm run check
```

Runs TypeScript compiler to check for type errors.

## Common Issues & Solutions

### Issue: DATABASE_URL not set

**Error:**
```
DATABASE_URL must be set. Did you forget to provision a database?
```

**Solution:**
1. Set up a PostgreSQL database (Neon, Railway, or local)
2. Set the DATABASE_URL environment variable:
   ```bash
   export DATABASE_URL='postgresql://user:password@host:5432/database'
   ```

### Issue: Database connection fails

**Error:**
```
Failed to connect to database
```

**Solutions:**
1. Verify DATABASE_URL is correct
2. Check database is accessible (firewall, network)
3. Ensure database exists and is running
4. Check credentials are correct

### Issue: Tables don't exist

**Error:**
```
Table does not exist or not accessible
```

**Solution:**
Run database migrations:
```bash
npm run db:push
```

### Issue: Server won't start

**Check:**
1. Run `npm run debug` to identify issues
2. Check console for error messages
3. Verify DATABASE_URL is set
4. Ensure database is accessible

### Issue: Missing mock data

**Solution:**
```bash
npm run seed:mock
```

This will create:
- Demo Clinic organization
- 2 patients
- 2 staff members (login: doctor.smith / nurse.williams, password: staff123)

## Debug Workflow

1. **Start with debug tool:**
   ```bash
   npm run debug
   ```

2. **Fix any ❌ FAIL items** (critical issues)

3. **Address ⚠️ WARN items** (optional but recommended)

4. **Start the server:**
   ```bash
   npm run dev
   ```

5. **If issues persist:**
   - Check server console logs
   - Verify database connection
   - Run `npm run seed:mock` if data is missing

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string

### Optional
- `SESSION_SECRET` - Express session secret (defaults to 'clinic-session-secret-2024')
- `JWT_SECRET` - JWT token secret (defaults to 'clinic-secret-key-2024')
- `ANTHROPIC_API_KEY` - For AI features (optional)

## Health Check Endpoint

Once the server is running, check health:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-...",
  "services": {
    "database": {
      "status": "healthy",
      "responseTime": "50ms"
    },
    "api": {
      "status": "healthy",
      "uptime": 123.45
    }
  }
}
```

## Mock Data Credentials

After running `npm run seed:mock`, you can login with:

**Doctor:**
- Username: `doctor.smith`
- Password: `staff123`

**Nurse:**
- Username: `nurse.williams`
- Password: `staff123`

## Getting Help

If you encounter issues:

1. Run `npm run debug` and check the output
2. Check server console for error messages
3. Verify all environment variables are set
4. Ensure database is accessible and tables exist
5. Check that migrations have been run (`npm run db:push`)

