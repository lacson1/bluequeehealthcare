#!/usr/bin/env npx tsx
/**
 * Script to check user role and audit logs
 * Usage: npx tsx scripts/check-user-role.ts [username]
 */

import { db } from '../server/db';
import { users, auditLogs, roles } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

async function checkUserRole(username: string) {
  console.log(`\n🔍 Checking user: ${username}\n`);
  
  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    console.error(`❌ User "${username}" not found`);
    return;
  }

  // Get role name if roleId exists
  let roleName = user.role;
  if (user.roleId) {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, user.roleId))
      .limit(1);
    if (role) {
      roleName = `${user.role} (RBAC: ${role.name})`;
    }
  }

  console.log('📋 User Information:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Role: ${roleName}`);
  console.log(`   Role ID: ${user.roleId || 'None'}`);
  console.log(`   Organization ID: ${user.organizationId || 'None'}`);
  console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
  console.log(`   Created: ${user.createdAt}`);
  console.log(`   Updated: ${user.updatedAt}`);

  // Check recent role changes in audit logs
  console.log('\n📜 Recent Role Changes:');
  const roleChangeLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      userId: auditLogs.userId,
      entityId: auditLogs.entityId,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
    })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityId, user.id),
        eq(auditLogs.action, 'CHANGE_USER_ROLE')
      )
    )
    .orderBy(desc(auditLogs.timestamp))
    .limit(5);

  if (roleChangeLogs.length === 0) {
    console.log('   No role change logs found');
  } else {
    for (const log of roleChangeLogs) {
      const details = log.details ? JSON.parse(log.details as string) : {};
      const [changedBy] = await db
        .select()
        .from(users)
        .where(eq(users.id, log.userId))
        .limit(1);
      
      console.log(`\n   [${log.timestamp}]`);
      console.log(`   Changed by: ${changedBy?.username || 'Unknown'} (ID: ${log.userId})`);
      console.log(`   Old Role: ${details.oldRole || 'Unknown'}`);
      console.log(`   New Role: ${details.newRole || 'Unknown'}`);
      if (details.oldRoleId) console.log(`   Old Role ID: ${details.oldRoleId}`);
      if (details.newRoleId) console.log(`   New Role ID: ${details.newRoleId}`);
    }
  }

  // Check all user update logs
  console.log('\n📝 Recent User Updates:');
  const updateLogs = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      userId: auditLogs.userId,
      details: auditLogs.details,
      timestamp: auditLogs.timestamp,
    })
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.entityId, user.id),
        eq(auditLogs.action, 'USER_UPDATED')
      )
    )
    .orderBy(desc(auditLogs.timestamp))
    .limit(5);

  if (updateLogs.length === 0) {
    console.log('   No update logs found');
  } else {
    for (const log of updateLogs) {
      const details = log.details ? JSON.parse(log.details as string) : {};
      const [changedBy] = await db
        .select()
        .from(users)
        .where(eq(users.id, log.userId))
        .limit(1);
      
      console.log(`\n   [${log.timestamp}]`);
      console.log(`   Changed by: ${changedBy?.username || 'Unknown'} (ID: ${log.userId})`);
      if (details.updatedFields) {
        console.log(`   Updated fields: ${details.updatedFields.join(', ')}`);
      }
      if (details.roleChanged) {
        console.log(`   ⚠️  Role was changed!`);
      }
    }
  }

  console.log('\n✅ Check complete\n');
}

// Main execution
const username = process.argv[2] || 'bis';

checkUserRole(username)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });

