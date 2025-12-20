/**
 * Script to check for users without roles
 * 
 * This script finds all users without valid roles and reports them.
 * Run with: npx tsx scripts/check-users-without-roles.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq, or, sql, isNull } from 'drizzle-orm';

async function checkUsersWithoutRoles() {
  console.log('🔍 Checking for users without roles...\n');

  try {
    // Find users without roles (null, empty, or whitespace)
    const usersWithoutRole = await db
      .select({
        id: users.id,
        username: users.username,
        role: users.role,
        roleId: users.roleId,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        organizationId: users.organizationId,
        isActive: users.isActive,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        or(
          isNull(users.role),
          sql`${users.role} = ''`,
          sql`TRIM(${users.role}) = ''`
        )
      );

    // Find users without roleId (RBAC role)
    const usersWithoutRoleId = await db
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
      .where(isNull(users.roleId));

    // Find users with invalid role values
    const validRoles = ['admin', 'doctor', 'nurse', 'pharmacist', 'receptionist', 'physiotherapist', 'lab_technician', 'superadmin', 'super_admin', 'staff'];
    const allUsers = await db.select({
      id: users.id,
      username: users.username,
      role: users.role,
      roleId: users.roleId
    }).from(users);

    const usersWithInvalidRole = allUsers.filter(user => 
      user.role && 
      !validRoles.includes(user.role.toLowerCase()) &&
      user.role.trim() !== ''
    );

    // Display results
    console.log('='.repeat(70));
    console.log('📊 USER ROLE ANALYSIS REPORT');
    console.log('='.repeat(70));

    // Users without role (null/empty)
    console.log(`\n1️⃣  Users WITHOUT role (null, empty, or whitespace): ${usersWithoutRole.length}`);
    if (usersWithoutRole.length > 0) {
      console.log('\n   ⚠️  CRITICAL: These users have no role assigned!');
      usersWithoutRole.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Username: ${user.username}`);
        console.log(`      Email: ${user.email || 'N/A'}`);
        console.log(`      Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A');
        console.log(`      Organization ID: ${user.organizationId || 'N/A'}`);
        console.log(`      Active: ${user.isActive ? 'Yes' : 'No'}`);
        console.log(`      Created: ${user.createdAt || 'N/A'}`);
        console.log(`      Role: ${user.role || 'NULL'}`);
        console.log(`      Role ID: ${user.roleId || 'NULL'}`);
        console.log('');
      });
    } else {
      console.log('   ✅ All users have a role assigned');
    }

    // Users without roleId (RBAC)
    console.log(`\n2️⃣  Users WITHOUT roleId (RBAC role): ${usersWithoutRoleId.length}`);
    if (usersWithoutRoleId.length > 0) {
      console.log('\n   ℹ️  INFO: These users use legacy role system (no RBAC roleId)');
      const displayCount = Math.min(usersWithoutRoleId.length, 10);
      usersWithoutRoleId.slice(0, displayCount).forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Username: ${user.username}, Role: ${user.role || 'N/A'}`);
      });
      if (usersWithoutRoleId.length > 10) {
        console.log(`   ... and ${usersWithoutRoleId.length - 10} more`);
      }
    } else {
      console.log('   ✅ All users have a roleId assigned');
    }

    // Users with invalid role values
    console.log(`\n3️⃣  Users with INVALID role values: ${usersWithInvalidRole.length}`);
    if (usersWithInvalidRole.length > 0) {
      console.log('\n   ⚠️  WARNING: These users have non-standard role values');
      usersWithInvalidRole.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Username: ${user.username}, Role: "${user.role}"`);
      });
    } else {
      console.log('   ✅ All users have valid role values');
    }

    // Summary statistics
    console.log('\n' + '='.repeat(70));
    console.log('📈 SUMMARY STATISTICS');
    console.log('='.repeat(70));
    console.log(`Total users in database: ${allUsers.length}`);
    console.log(`Users without role: ${usersWithoutRole.length}`);
    console.log(`Users without roleId: ${usersWithoutRoleId.length}`);
    console.log(`Users with invalid role: ${usersWithInvalidRole.length}`);
    console.log(`Users with both role and roleId: ${allUsers.filter(u => u.role && u.roleId).length}`);
    console.log(`Users with only legacy role: ${allUsers.filter(u => u.role && !u.roleId).length}`);

    // Recommendations
    console.log('\n' + '='.repeat(70));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(70));

    if (usersWithoutRole.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   1. Run fix script: npx tsx scripts/fix-users-without-roles.ts');
      console.log('   2. Or use API endpoint: POST /api/users/fix-missing-roles');
      console.log('   3. Review and assign appropriate roles to affected users');
    }

    if (usersWithoutRoleId.length > 0 && usersWithoutRoleId.length < allUsers.length * 0.5) {
      console.log('\nℹ️  OPTIONAL: Consider migrating users to RBAC system');
      console.log('   - Users without roleId are using legacy role system');
      console.log('   - RBAC provides more granular permissions');
    }

    if (usersWithInvalidRole.length > 0) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('   - Review users with invalid role values');
      console.log('   - Update to valid role values or create custom roles');
    }

    if (usersWithoutRole.length === 0 && usersWithInvalidRole.length === 0) {
      console.log('\n✅ All users have valid roles assigned!');
      console.log('   No action required.');
    }

    console.log('\n' + '='.repeat(70));

    // Return exit code
    if (usersWithoutRole.length > 0 || usersWithInvalidRole.length > 0) {
      process.exit(1); // Exit with error if issues found
    } else {
      process.exit(0); // Exit successfully if no issues
    }

  } catch (error) {
    console.error('\n❌ Error checking users:', error);
    process.exit(1);
  }
}

// Run the check
checkUsersWithoutRoles();

