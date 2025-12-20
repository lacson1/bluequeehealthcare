#!/usr/bin/env npx tsx
/**
 * Script to change a user's password
 * Usage: npx tsx scripts/change-user-password.ts [username] [newPassword]
 * Example: npx tsx scripts/change-user-password.ts bis newpassword123
 */

import { db } from '../server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function changeUserPassword(username: string, newPassword: string) {
  console.log(`\n🔐 Changing password for user: ${username}\n`);
  
  // Validate password strength
  if (newPassword.length < 6) {
    console.error('❌ Password must be at least 6 characters long');
    process.exit(1);
  }

  // Find user
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user) {
    console.error(`❌ User "${username}" not found`);
    process.exit(1);
  }

  console.log('📋 User Information:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);

  // Hash new password
  console.log('\n🔒 Hashing new password...');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  console.log('💾 Updating password in database...');
  await db
    .update(users)
    .set({
      password: hashedPassword,
      updatedAt: new Date()
    })
    .where(eq(users.id, user.id));

  console.log('\n✅ Password changed successfully!');
  console.log(`\n📝 New credentials:`);
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${newPassword}`);
  console.log(`\n⚠️  Please save this password securely and inform the user.`);
  console.log(`\n✅ Update complete\n`);
}

// Main execution
const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
  console.error('❌ Usage: npx tsx scripts/change-user-password.ts [username] [newPassword]');
  console.error('   Example: npx tsx scripts/change-user-password.ts bis newpassword123');
  process.exit(1);
}

changeUserPassword(username, newPassword)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });

