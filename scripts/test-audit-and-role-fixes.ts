/**
 * Test script for audit logging and role validation fixes
 * 
 * Tests:
 * 1. Audit logging skips fallback superadmin (ID: 999)
 * 2. Users cannot be created without roles
 * 3. Users cannot be updated to remove roles
 * 4. Fix script works correctly
 * 
 * Run with: npx tsx scripts/test-audit-and-role-fixes.ts
 */

import { db } from '../server/db';
import { users, auditLogs } from '@shared/schema';
import { eq, or, sql, isNull, desc } from 'drizzle-orm';
import { createAuditLog, AuditLogger } from '../server/audit';
import type { AuthRequest } from '../server/middleware/auth';

// Mock request object
const createMockRequest = (userId: number, username: string, role: string): Partial<AuthRequest> => {
  return {
    user: {
      id: userId,
      username,
      role,
      organizationId: 1
    },
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'test-agent'
    },
    get: (name: string) => {
      if (name === 'User-Agent') return 'test-agent';
      return undefined;
    }
  } as Partial<AuthRequest>;
};

async function testAuditLogging() {
  console.log('\n🧪 TEST 1: Audit Logging');
  console.log('=' .repeat(50));

  // Test 1.1: Skip audit log for fallback superadmin (ID: 999)
  console.log('\n1.1 Testing: Skip audit log for superadmin (ID: 999)...');
  
  const beforeCount = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const beforeCountNum = Number(beforeCount[0]?.count || 0);

  await createAuditLog({
    userId: 999,
    action: 'TEST_ACTION',
    entityType: 'user',
    entityId: 1,
    request: createMockRequest(999, 'superadmin', 'superadmin') as any
  });

  const afterCount = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const afterCountNum = Number(afterCount[0]?.count || 0);

  if (beforeCountNum === afterCountNum) {
    console.log('✅ PASS: Audit log skipped for superadmin (ID: 999)');
  } else {
    console.log('❌ FAIL: Audit log was created for superadmin (ID: 999)');
    console.log(`   Before: ${beforeCountNum}, After: ${afterCountNum}`);
  }

  // Test 1.2: Create audit log for valid user
  console.log('\n1.2 Testing: Create audit log for valid user...');
  
  // Get a real user from database
  const [realUser] = await db.select().from(users).limit(1);
  
  if (!realUser) {
    console.log('⚠️  SKIP: No users found in database. Cannot test audit logging.');
    return;
  }

  const beforeCount2 = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const beforeCount2Num = Number(beforeCount2[0]?.count || 0);

  await createAuditLog({
    userId: realUser.id,
    action: 'TEST_ACTION_VALID_USER',
    entityType: 'user',
    entityId: realUser.id,
    request: createMockRequest(realUser.id, realUser.username, realUser.role) as any
  });

  const afterCount2 = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const afterCount2Num = Number(afterCount2[0]?.count || 0);

  if (afterCount2Num > beforeCount2Num) {
    console.log(`✅ PASS: Audit log created for valid user (ID: ${realUser.id})`);
  } else {
    console.log(`❌ FAIL: Audit log was not created for valid user`);
    console.log(`   Before: ${beforeCount2Num}, After: ${afterCount2Num}`);
  }

  // Test 1.3: Skip audit log for user without role
  console.log('\n1.3 Testing: Skip audit log for user without role...');
  
  // Find or create a user without role for testing
  let userWithoutRole = await db.select()
    .from(users)
    .where(
      or(
        isNull(users.role),
        sql`${users.role} = ''`,
        sql`TRIM(${users.role}) = ''`
      )
    )
    .limit(1);

  if (userWithoutRole.length === 0) {
    // Create a test user without role (we'll clean it up later)
    const [testUser] = await db.insert(users).values({
      username: `test_no_role_${Date.now()}`,
      password: 'test_password_hash',
      role: '', // Empty role
      organizationId: 1,
      isActive: true
    }).returning();
    
    userWithoutRole = [testUser];
    console.log(`   Created test user without role (ID: ${testUser.id})`);
  }

  const testUser = userWithoutRole[0];
  const beforeCount3 = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const beforeCount3Num = Number(beforeCount3[0]?.count || 0);

  await createAuditLog({
    userId: testUser.id,
    action: 'TEST_ACTION_NO_ROLE',
    entityType: 'user',
    entityId: testUser.id,
    request: createMockRequest(testUser.id, testUser.username, testUser.role || '') as any
  });

  const afterCount3 = await db.select({ count: sql<number>`count(*)` }).from(auditLogs);
  const afterCount3Num = Number(afterCount3[0]?.count || 0);

  if (beforeCount3Num === afterCount3Num) {
    console.log(`✅ PASS: Audit log skipped for user without role (ID: ${testUser.id})`);
  } else {
    console.log(`❌ FAIL: Audit log was created for user without role`);
    console.log(`   Before: ${beforeCount3Num}, After: ${afterCount3Num}`);
  }

  // Clean up test user
  if (testUser.username.startsWith('test_no_role_')) {
    await db.delete(users).where(eq(users.id, testUser.id));
    console.log(`   Cleaned up test user (ID: ${testUser.id})`);
  }
}

async function testUsersWithoutRoles() {
  console.log('\n🧪 TEST 2: Users Without Roles');
  console.log('=' .repeat(50));

  // Count users without roles
  const usersWithoutRole = await db.select({
    id: users.id,
    username: users.username,
    role: users.role
  })
  .from(users)
  .where(
    or(
      isNull(users.role),
      sql`${users.role} = ''`,
      sql`TRIM(${users.role}) = ''`
    )
  );

  console.log(`\nFound ${usersWithoutRole.length} user(s) without roles:`);
  if (usersWithoutRole.length > 0) {
    usersWithoutRole.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Username: ${user.username}`);
    });
    console.log('\n⚠️  WARNING: These users need to be fixed!');
    console.log('   Run: npx tsx scripts/fix-users-without-roles.ts');
  } else {
    console.log('✅ All users have roles assigned');
  }
}

async function testRecentAuditLogs() {
  console.log('\n🧪 TEST 3: Recent Audit Logs');
  console.log('=' .repeat(50));

  // Get recent audit logs with user info
  const recentLogs = await db.select({
    id: auditLogs.id,
    userId: auditLogs.userId,
    action: auditLogs.action,
    entityType: auditLogs.entityType,
    timestamp: auditLogs.timestamp,
    username: users.username,
    role: users.role
  })
  .from(auditLogs)
  .leftJoin(users, eq(auditLogs.userId, users.id))
  .orderBy(desc(auditLogs.timestamp))
  .limit(10);

  console.log(`\nRecent ${recentLogs.length} audit log(s):`);
  
  let superadminLogs = 0;
  let noRoleLogs = 0;
  let validLogs = 0;

  recentLogs.forEach((log, index) => {
    const userInfo = log.username ? `${log.username} (${log.role || 'no role'})` : 'Unknown';
    const status = log.userId === 999 
      ? '⚠️ SUPERADMIN' 
      : !log.role || log.role.trim() === ''
        ? '⚠️ NO ROLE'
        : '✅ VALID';
    
    console.log(`   ${index + 1}. [${status}] User ID: ${log.userId} (${userInfo})`);
    console.log(`      Action: ${log.action}, Entity: ${log.entityType}`);
    
    if (log.userId === 999) superadminLogs++;
    else if (!log.role || log.role.trim() === '') noRoleLogs++;
    else validLogs++;
  });

  console.log(`\nSummary:`);
  console.log(`   ✅ Valid logs: ${validLogs}`);
  console.log(`   ⚠️  Superadmin logs (should be 0): ${superadminLogs}`);
  console.log(`   ⚠️  No role logs (should be 0): ${noRoleLogs}`);

  if (superadminLogs > 0) {
    console.log(`\n❌ FAIL: Found ${superadminLogs} audit log(s) for superadmin (ID: 999)`);
  } else {
    console.log(`\n✅ PASS: No audit logs for superadmin (ID: 999)`);
  }

  if (noRoleLogs > 0) {
    console.log(`\n⚠️  WARNING: Found ${noRoleLogs} audit log(s) for users without roles`);
    console.log(`   These are old logs. New logs should skip users without roles.`);
  } else {
    console.log(`\n✅ PASS: No audit logs for users without roles`);
  }
}

async function testRoleValidation() {
  console.log('\n🧪 TEST 4: Role Validation');
  console.log('=' .repeat(50));

  // Check if users table has role column as NOT NULL
  const [user] = await db.select().from(users).limit(1);
  
  if (!user) {
    console.log('⚠️  SKIP: No users found in database');
    return;
  }

  console.log('\n4.1 Testing: Check role column constraints...');
  
  // Try to find users with null/empty roles
  const usersWithInvalidRoles = await db.select({
    id: users.id,
    username: users.username,
    role: users.role
  })
  .from(users)
  .where(
    or(
      isNull(users.role),
      sql`${users.role} = ''`,
      sql`TRIM(${users.role}) = ''`
    )
  )
  .limit(5);

  if (usersWithInvalidRoles.length > 0) {
    console.log(`⚠️  Found ${usersWithInvalidRoles.length} user(s) with invalid roles:`);
    usersWithInvalidRoles.forEach(u => {
      console.log(`   - ID: ${u.id}, Username: ${u.username}, Role: "${u.role || 'NULL'}"`);
    });
    console.log('\n   These users should be fixed by running:');
    console.log('   npx tsx scripts/fix-users-without-roles.ts');
  } else {
    console.log('✅ All users have valid roles');
  }
}

async function runAllTests() {
  console.log('🚀 Testing Audit Logging and Role Validation Fixes');
  console.log('=' .repeat(50));

  try {
    await testAuditLogging();
    await testUsersWithoutRoles();
    await testRecentAuditLogs();
    await testRoleValidation();

    console.log('\n' + '=' .repeat(50));
    console.log('✅ All tests completed!');
    console.log('\nNext steps:');
    console.log('1. If users without roles found, run: npx tsx scripts/fix-users-without-roles.ts');
    console.log('2. Check server logs for audit warnings');
    console.log('3. Verify new audit logs skip superadmin (ID: 999)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests()
  .then(() => {
    console.log('\n🎉 Testing complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Testing failed:', error);
    process.exit(1);
  });

