/**
 * Script to list all users without an organization assignment
 * 
 * Usage:
 *   node list-users-without-organization.js
 */

async function runScript() {
  try {
    const { db } = await import('./server/db.js');
    const schema = await import('./shared/schema.js');
    const { isNull, or, sql, eq } = await import('drizzle-orm');
    return { db, users: schema.users, isNull, or, sql, eq };
  } catch (error) {
    const { db } = require('./server/db');
    const schema = require('./shared/schema');
    const { isNull, or, sql, eq } = require('drizzle-orm');
    return { db, users: schema.users, isNull, or, sql, eq };
  }
}

async function listUsersWithoutOrganization() {
  try {
    const { db, users, isNull, or, sql } = await runScript();
    
    const usersWithoutOrg = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        organizationId: users.organizationId,
        createdAt: users.createdAt
      })
      .from(users)
      .where(
        or(
          isNull(users.organizationId),
          sql`${users.organizationId} = 0`
        )
      )
      .orderBy(users.createdAt);

    if (usersWithoutOrg.length === 0) {
      console.log('✅ All users are assigned to organizations');
      return;
    }

    console.log(`\n📋 Found ${usersWithoutOrg.length} user(s) without organization assignment:\n`);
    
    usersWithoutOrg.forEach((user, index) => {
      console.log(`${index + 1}. ${user.username}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A');
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Created: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}`);
      console.log(`   Organization ID: ${user.organizationId || 'NULL'}`);
      console.log('');
    });

    console.log('\n💡 To assign a user to an organization, run:');
    console.log('   node assign-user-to-organization.js <username> <organizationId>');
    console.log('\n💡 To list available organizations, you can query the database or check the admin panel.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

listUsersWithoutOrganization();

