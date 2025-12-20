/**
 * Simple script to assign a user to an organization
 * Usage: node fix-user-organization.mjs <username> <organizationId>
 */

import { db } from './server/db.js';
import { users, organizations } from './shared/schema.js';
import { eq } from 'drizzle-orm';

const [username, orgId] = process.argv.slice(2);

if (!username || !orgId) {
  console.log('Usage: node fix-user-organization.mjs <username> <organizationId>');
  console.log('Example: node fix-user-organization.mjs johndoe 1');
  process.exit(1);
}

try {
  // Find user
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  
  if (!user) {
    console.error(`❌ User "${username}" not found`);
    process.exit(1);
  }

  // Verify organization
  const [org] = await db.select().from(organizations).where(eq(organizations.id, parseInt(orgId))).limit(1);
  
  if (!org) {
    console.error(`❌ Organization ID ${orgId} not found`);
    process.exit(1);
  }

  // Update user
  const [updated] = await db
    .update(users)
    .set({ organizationId: parseInt(orgId) })
    .where(eq(users.id, user.id))
    .returning();

  console.log(`✅ Success! User "${username}" assigned to "${org.name}"`);
  console.log(`   User ID: ${updated.id}`);
  console.log(`   Organization ID: ${updated.organizationId}`);
  console.log(`\n💡 Please log out and log back in to refresh your session.`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

