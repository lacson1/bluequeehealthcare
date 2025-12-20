/**
 * List all users without organization assignment
 * Usage: node list-unassigned-users.mjs
 */

import { db } from './server/db.js';
import { users, organizations } from './shared/schema.js';
import { isNull, or, sql } from 'drizzle-orm';

try {
  const unassigned = await db
    .select({
      id: users.id,
      username: users.username,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      organizationId: users.organizationId,
    })
    .from(users)
    .where(or(isNull(users.organizationId), sql`${users.organizationId} = 0`))
    .orderBy(users.createdAt);

  if (unassigned.length === 0) {
    console.log('✅ All users are assigned to organizations');
    process.exit(0);
  }

  console.log(`\n📋 Found ${unassigned.length} user(s) without organization:\n`);
  
  unassigned.forEach((u, i) => {
    console.log(`${i + 1}. ${u.username} (ID: ${u.id})`);
    console.log(`   Name: ${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A');
    console.log(`   Email: ${u.email || 'N/A'}`);
    console.log(`   Role: ${u.role || 'N/A'}`);
    console.log('');
  });

  // List available organizations
  const orgs = await db.select({ id: organizations.id, name: organizations.name }).from(organizations);
  
  if (orgs.length > 0) {
    console.log('\n📌 Available Organizations:');
    orgs.forEach(org => {
      console.log(`   ID ${org.id}: ${org.name}`);
    });
    console.log('\n💡 To assign a user, run:');
    console.log('   node fix-user-organization.mjs <username> <organizationId>');
  }

  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

