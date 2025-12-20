#!/usr/bin/env tsx
/**
 * Check Permissions in Database
 * Verifies if permissions exist in the database
 */

import { db } from '../server/db';
import { permissions, roles, rolePermissions } from '@shared/schema';
import { sql } from 'drizzle-orm';

async function checkPermissions() {
  console.log('🔍 Checking database for permissions...\n');

  try {
    // Check permissions count
    const permissionCount = await db.select({ count: sql<number>`COUNT(*)` }).from(permissions);
    console.log(`📊 Total permissions in database: ${permissionCount[0].count}\n`);

    if (permissionCount[0].count === 0) {
      console.log('❌ No permissions found in database!\n');
      console.log('💡 Solution: Run the seed script to populate permissions:');
      console.log('   npm run seed:permissions\n');
      return;
    }

    // List all permissions
    const allPermissions = await db.select().from(permissions).orderBy(permissions.name);
    console.log(`✅ Found ${allPermissions.length} permissions:\n`);
    
    // Group by category
    const categories: Record<string, typeof allPermissions> = {};
    allPermissions.forEach(perm => {
      let category = 'other';
      const name = perm.name.toLowerCase();
      
      if (name.includes('patient')) category = 'patients';
      else if (name.includes('visit')) category = 'visits';
      else if (name.includes('lab')) category = 'lab';
      else if (name.includes('consultation')) category = 'consultations';
      else if (name.includes('medication') || name.includes('prescription')) category = 'medications';
      else if (name.includes('referral')) category = 'referrals';
      else if (name.includes('user')) category = 'users';
      else if (name.includes('organization')) category = 'organizations';
      else if (name.includes('file')) category = 'files';
      else if (name.includes('dashboard') || name.includes('report') || name.includes('audit')) category = 'dashboard';
      else if (name.includes('appointment')) category = 'appointments';
      else if (name.includes('billing') || name.includes('invoice') || name.includes('payment')) category = 'billing';
      
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(perm);
    });

    // Display by category
    Object.entries(categories).forEach(([category, perms]) => {
      console.log(`📁 ${category.toUpperCase()} (${perms.length} permissions):`);
      perms.forEach(perm => {
        console.log(`   - ${perm.name}: ${perm.description}`);
      });
      console.log('');
    });

    // Check roles
    const roleCount = await db.select({ count: sql<number>`COUNT(*)` }).from(roles);
    console.log(`📊 Total roles in database: ${roleCount[0].count}\n`);

    // Check role-permission mappings
    const mappingCount = await db.select({ count: sql<number>`COUNT(*)` }).from(rolePermissions);
    console.log(`📊 Total role-permission mappings: ${mappingCount[0].count}\n`);

    // Check permissions per role
    const rolesWithPerms = await db.select().from(roles);
    console.log('👥 Roles and their permission counts:');
    for (const role of rolesWithPerms) {
      const rolePermCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(rolePermissions)
        .where(sql`role_id = ${role.id}`);
      console.log(`   - ${role.name}: ${rolePermCount[0].count} permissions`);
    }

  } catch (error: any) {
    console.error('❌ Error checking database:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

// Run the check
checkPermissions()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

