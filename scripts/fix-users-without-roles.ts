/**
 * Script to fix users without roles
 * 
 * This script finds all users without roles and assigns them a default role.
 * Run with: npx tsx scripts/fix-users-without-roles.ts
 */

import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq, or, sql, isNull } from 'drizzle-orm';

const DEFAULT_ROLE = 'staff'; // Default role to assign

async function fixUsersWithoutRoles() {
  console.log('🔍 Finding users without roles...');

  try {
    // Find users without roles
    const usersWithoutRole = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        roleId: users.roleId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        organizationId: users.organizationId
      })
      .from(users)
      .where(
        or(
          isNull(users.role),
          sql`${users.role} = ''`,
          sql`TRIM(${users.role}) = ''`
        )
      );

    if (usersWithoutRole.length === 0) {
      console.log('✅ No users without roles found. All users have valid roles.');
      return;
    }

    console.log(`\n⚠️  Found ${usersWithoutRole.length} user(s) without roles:`);
    usersWithoutRole.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Username: ${user.username}, Email: ${user.email || 'N/A'}`);
    });

    console.log(`\n🔧 Assigning default role '${DEFAULT_ROLE}' to ${usersWithoutRole.length} user(s)...`);

    // Update users with default role
    const userIds = usersWithoutRole.map(u => u.id);
    const updatedUsers = await db
      .update(users)
      .set({
        role: DEFAULT_ROLE,
        updatedAt: new Date()
      })
      .where(
        or(
          isNull(users.role),
          sql`${users.role} = ''`,
          sql`TRIM(${users.role}) = ''`
        )
      )
      .returning({
        id: users.id,
        username: users.username,
        role: users.role
      });

    console.log(`\n✅ Successfully fixed ${updatedUsers.length} user(s):`);
    updatedUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id}, Username: ${user.username}, New Role: ${user.role}`);
    });

    console.log(`\n✨ Fix complete! All users now have roles assigned.`);
    
    // Verify fix
    const remainingUsersWithoutRole = await db
      .select({ id: users.id, username: users.username })
      .from(users)
      .where(
        or(
          isNull(users.role),
          sql`${users.role} = ''`,
          sql`TRIM(${users.role}) = ''`
        )
      );

    if (remainingUsersWithoutRole.length > 0) {
      console.error(`\n❌ ERROR: ${remainingUsersWithoutRole.length} user(s) still without roles:`);
      remainingUsersWithoutRole.forEach(user => {
        console.error(`   - ID: ${user.id}, Username: ${user.username}`);
      });
      process.exit(1);
    } else {
      console.log(`\n✅ Verification passed: All users have roles assigned.`);
    }

  } catch (error) {
    console.error('❌ Error fixing users without roles:', error);
    process.exit(1);
  }
}

// Run the script
fixUsersWithoutRoles()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

