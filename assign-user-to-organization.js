/**
 * Script to assign a user to an organization
 * 
 * Usage:
 *   node assign-user-to-organization.js <username> <organizationId>
 * 
 * Example:
 *   node assign-user-to-organization.js johndoe 1
 */

// Note: This script requires the database to be properly configured
// Make sure DATABASE_URL is set in your environment

async function runScript() {
  try {
    // Dynamic import to handle ES modules
    const { db } = await import('./server/db.js');
    const { users, organizations } = await import('./shared/schema.js');
    const { eq } = await import('drizzle-orm');
    
    return { db, users, organizations, eq };
  } catch (error) {
    // Fallback for CommonJS
    const { db } = require('./server/db');
    const schema = require('./shared/schema');
    const { eq } = require('drizzle-orm');
    return { 
      db, 
      users: schema.users, 
      organizations: schema.organizations, 
      eq 
    };
  }
}

async function assignUserToOrganization(username, organizationId) {
  try {
    const { db, users, organizations, eq } = await runScript();
    
    // Find the user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (!user) {
      console.error(`❌ User "${username}" not found`);
      process.exit(1);
    }

    // Verify organization exists
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, parseInt(organizationId)))
      .limit(1);

    if (!org) {
      console.error(`❌ Organization with ID ${organizationId} not found`);
      process.exit(1);
    }

    // Check if user already has an organization
    if (user.organizationId) {
      console.log(`⚠️  User "${username}" is already assigned to organization ID: ${user.organizationId}`);
      console.log(`   Current organization: ${user.organizationId}`);
      console.log(`   Requested organization: ${organizationId}`);
      
      // Ask for confirmation (in a real script, you'd use readline)
      console.log(`\n   Updating to organization ID: ${organizationId}...`);
    }

    // Update user's organization
    const [updatedUser] = await db
      .update(users)
      .set({ organizationId: parseInt(organizationId) })
      .where(eq(users.id, user.id))
      .returning();

    if (updatedUser) {
      console.log(`✅ Successfully assigned user "${username}" to organization "${org.name}" (ID: ${organizationId})`);
      console.log(`\n   User Details:`);
      console.log(`   - Username: ${updatedUser.username}`);
      console.log(`   - Name: ${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim());
      console.log(`   - Role: ${updatedUser.role}`);
      console.log(`   - Organization ID: ${updatedUser.organizationId}`);
      console.log(`   - Organization Name: ${org.name}`);
    } else {
      console.error(`❌ Failed to update user`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: node assign-user-to-organization.js <username> <organizationId>');
  console.log('\nExample:');
  console.log('  node assign-user-to-organization.js johndoe 1');
  console.log('\nTo find available organizations, run:');
  console.log('  node -e "require(\'./server/db\').db.select().from(require(\'./shared/schema\').organizations).then(orgs => console.log(JSON.stringify(orgs, null, 2)))"');
  process.exit(1);
}

const [username, organizationId] = args;
assignUserToOrganization(username, organizationId);

