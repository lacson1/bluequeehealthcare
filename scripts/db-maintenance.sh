#!/bin/bash
# Database Maintenance Script
# Run this periodically to keep the database clean

echo "🧹 Starting Database Maintenance"
echo "================================="
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if database container is running
if ! docker ps --format '{{.Names}}' | grep -q "clinicconnect-postgres"; then
    echo "❌ Database container is not running. Starting it..."
    docker start clinicconnect-postgres
    sleep 3
fi

echo "📊 Current database size:"
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "SELECT pg_size_pretty(pg_database_size('clinicconnect')) as size;"

echo ""
echo "🔍 Top 5 largest tables:"
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "
SELECT 
    relname as table_name,
    pg_size_pretty(pg_total_relation_size('public.' || relname)) as size,
    n_live_tup as rows
FROM pg_stat_user_tables 
ORDER BY pg_total_relation_size('public.' || relname) DESC
LIMIT 5;
"

echo ""
echo "🧹 Cleaning up old system_health records (keeping last 7 days)..."
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "
DELETE FROM system_health WHERE timestamp < NOW() - INTERVAL '7 days';
"

echo ""
echo "🧹 Cleaning up expired sessions..."
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "
DELETE FROM sessions WHERE expire < NOW();
"

echo ""
echo "🧹 Cleaning up old audit logs (keeping last 30 days)..."
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "
DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '30 days';
"

echo ""
echo "🧹 Cleaning up old error logs (keeping last 7 days)..."
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "
DELETE FROM error_logs WHERE created_at < NOW() - INTERVAL '7 days';
"

echo ""
echo "🔧 Running VACUUM to reclaim space..."
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "VACUUM FULL system_health;"
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "VACUUM FULL sessions;"
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "VACUUM FULL audit_logs;"
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "VACUUM FULL error_logs;"

echo ""
echo "📊 New database size:"
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "SELECT pg_size_pretty(pg_database_size('clinicconnect')) as size;"

echo ""
echo "✅ Database maintenance complete!"

