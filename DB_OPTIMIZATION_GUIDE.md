# Database Size Optimization Guide

## Current Analysis

| Metric | Before | After |
|--------|--------|-------|
| Total Size | 14 MB | 11 MB |
| Reduction | - | 21% |
| Rows Deleted | - | 29,007 |

## Main Issues Found

### 1. System Health Table (Biggest Issue)
- **Problem**: 31,127 rows of health metrics accumulated over time
- **Size**: 2.8 MB (20% of total database)
- **Solution**: Keep only last 7 days of data

### 2. Empty Tables (63 tables)
- **Problem**: Most tables have 0 rows (normal for development)
- **Not actual redundancy**: These are valid schema tables waiting for data

### 3. Log Tables
- Audit logs, error logs, sessions can accumulate over time
- Implemented automatic cleanup

## Quick Cleanup

Run the maintenance script anytime:

```bash
bash scripts/db-maintenance.sh
```

This will:
- Delete system_health records older than 7 days
- Clean up expired sessions
- Remove old audit/error logs
- VACUUM to reclaim disk space

## Automatic Maintenance (Recommended)

Add to crontab to run daily:

```bash
# Edit crontab
crontab -e

# Add this line (runs at 2 AM daily)
0 2 * * * cd /path/to/clinicconnect && bash scripts/db-maintenance.sh >> /tmp/db-maintenance.log 2>&1
```

## Schema Redundancy Analysis

### Potential Improvements

1. **JSON Columns**: Many tables use JSON for flexibility. Consider:
   - Breaking out frequently-queried JSON fields into columns
   - Adding indexes on JSON fields if needed

2. **Duplicate Data Patterns**: None found in current schema

3. **Normalization**: Schema is already well-normalized with:
   - Proper foreign key relationships
   - Junction tables for many-to-many relationships
   - Separate tables for lookup data

### Tables That Could Be Combined (Optional)

| Tables | Consideration |
|--------|---------------|
| `medications` + `medicines` | Similar purpose, could merge |
| `lab_tests` + `lab_panels` | Could use single table with type flag |

**Note**: Only consider merging if you're not using both tables.

## Data Retention Policies

Recommended retention periods:

| Table | Retention | Reason |
|-------|-----------|--------|
| system_health | 7 days | Monitoring metrics, high volume |
| error_logs | 7 days | Debug info, high volume |
| audit_logs | 90 days | Compliance/security |
| sessions | Until expired | Auto-cleanup on expiry |
| visits/prescriptions | Forever | Medical records |
| patients | Forever | Medical records |

## Commands Reference

```bash
# Check database size
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "SELECT pg_size_pretty(pg_database_size('clinicconnect'));"

# Check largest tables
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "
SELECT relname, pg_size_pretty(pg_total_relation_size('public.' || relname)) as size
FROM pg_stat_user_tables ORDER BY pg_total_relation_size('public.' || relname) DESC LIMIT 10;"

# Manual VACUUM
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "VACUUM FULL;"

# Analyze for query optimization
docker exec clinicconnect-postgres psql -U clinicuser -d clinicconnect -c "ANALYZE;"
```

## Files Created

- `scripts/db-maintenance.sh` - Maintenance script (run anytime)
- `scripts/reduce-db-size.sql` - SQL commands for manual cleanup

