-- ============================================
-- Database Size Reduction Script
-- ============================================
-- Run these commands to reduce database size
-- by removing redundancy and old data.
-- ============================================

-- 1. CLEAN UP SYSTEM_HEALTH TABLE (Biggest issue - 31K+ rows, 2.8MB)
-- Keep only last 7 days of health metrics
DELETE FROM system_health 
WHERE timestamp < NOW() - INTERVAL '7 days';

-- Verify cleanup
SELECT COUNT(*) as remaining_rows, 
       pg_size_pretty(pg_total_relation_size('system_health')) as new_size
FROM system_health;

-- 2. VACUUM AND RECLAIM SPACE
-- After deleting, reclaim the disk space
VACUUM FULL system_health;

-- 3. CLEAN UP OLD SESSIONS
-- Remove expired sessions
DELETE FROM sessions WHERE expire < NOW();
VACUUM sessions;

-- 4. CLEAN UP OLD AUDIT LOGS (if any)
-- Keep only last 30 days
DELETE FROM audit_logs 
WHERE timestamp < NOW() - INTERVAL '30 days';
VACUUM audit_logs;

-- 5. CLEAN UP ERROR LOGS (if any)
-- Keep only last 7 days
DELETE FROM error_logs 
WHERE created_at < NOW() - INTERVAL '7 days';
VACUUM error_logs;

-- 6. ANALYZE TABLES FOR QUERY OPTIMIZATION
ANALYZE;

-- 7. CHECK NEW DATABASE SIZE
SELECT pg_size_pretty(pg_database_size('clinicconnect')) as total_db_size;

-- ============================================
-- OPTIONAL: Remove completely unused tables
-- (Only do this if you're sure they won't be used)
-- ============================================

-- List candidates for removal (tables with 0 rows and no recent schema changes)
-- SELECT relname FROM pg_stat_user_tables WHERE n_live_tup = 0;

-- DROP TABLE IF EXISTS table_name CASCADE; -- Be careful!

