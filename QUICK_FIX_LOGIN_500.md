# Quick Fix: Login 500 Error

## Problem
Getting `500 Internal Server Error` when trying to log in. The error message says:
```
Database user does not exist. The database needs to be set up.
```

## Root Cause
Docker is not running, so the PostgreSQL database container cannot start.

## Solution

### Step 1: Start Docker Desktop
1. Open Docker Desktop application on your Mac
2. Wait for Docker to fully start (you'll see the Docker icon in your menu bar)
3. Verify Docker is running:
   ```bash
   docker ps
   ```
   Should show running containers (or empty list if no containers are running)

### Step 2: Start the Database Container

Once Docker is running, start the database:

```bash
# Option 1: Use the setup script (recommended)
bash setup-dev-db.sh

# Option 2: If container already exists, just start it
docker start clinicconnect-postgres

# Option 3: Check if container exists and start it
docker ps -a | grep clinicconnect-postgres
docker start clinicconnect-postgres
```

### Step 3: Verify Database is Running

```bash
# Check if container is running
docker ps | grep clinicconnect-postgres

# Test database connection
docker exec -it clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "SELECT 1;"
```

### Step 4: Try Login Again

Once the database is running, try logging in again. The 500 error should be resolved.

## Alternative: Use External Database

If you don't want to use Docker, you can update your `.env` file to use an existing PostgreSQL database:

```bash
# Edit .env file
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

Then restart your server.

## Troubleshooting

### Docker won't start?
- Make sure Docker Desktop is installed
- Check if Docker Desktop is running in Applications
- Try restarting Docker Desktop

### Container won't start?
```bash
# Check container status
docker ps -a | grep clinicconnect-postgres

# View container logs
docker logs clinicconnect-postgres

# Remove and recreate container
docker rm -f clinicconnect-postgres
bash setup-dev-db.sh
```

### Still getting 500 error?
1. Check server logs for detailed error messages
2. Verify DATABASE_URL in `.env` file is correct
3. Make sure database migrations have run:
   ```bash
   npx drizzle-kit push
   ```

## Database Credentials (Default)
- **Host:** localhost
- **Port:** 5434
- **Database:** clinicconnect
- **User:** clinicuser
- **Password:** clinic_dev_2024

