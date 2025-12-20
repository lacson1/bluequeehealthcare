import 'dotenv/config';
import { db } from '../server/db';
import { tabConfigs } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

async function checkTabs() {
  try {
    console.log('🔍 Checking system tabs...\n');

    // Get all system tabs
    const systemTabs = await db
      .select()
      .from(tabConfigs)
      .where(and(eq(tabConfigs.scope, 'system'), eq(tabConfigs.isSystemDefault, true)))
      .orderBy(tabConfigs.displayOrder);
    
    console.log(`Found ${systemTabs.length} system tabs:\n`);

    // Group by key to find duplicates
    const tabsByKey = new Map<string, typeof systemTabs>();
    systemTabs.forEach(tab => {
      if (!tabsByKey.has(tab.key)) {
        tabsByKey.set(tab.key, []);
      }
      tabsByKey.get(tab.key)!.push(tab);
    });

    // Show all tabs
    systemTabs.forEach(tab => {
      const status = tab.isVisible ? '✅' : '❌';
      console.log(`${status} ${tab.label} (${tab.key}) - Order: ${tab.displayOrder} - Visible: ${tab.isVisible}`);
    });

    // Check for duplicates
    console.log('\n🔍 Checking for duplicates:');
    let hasDuplicates = false;
    tabsByKey.forEach((tabs, key) => {
      if (tabs.length > 1) {
        hasDuplicates = true;
        console.log(`\n⚠️  Duplicate key "${key}" found ${tabs.length} times:`);
        tabs.forEach(tab => {
          console.log(`   - ID: ${tab.id}, Label: ${tab.label}, Visible: ${tab.isVisible}`);
        });
      }
    });

    if (!hasDuplicates) {
      console.log('✅ No duplicates found');
    }

    // Check for specialty tab
    const specialtyTabs = systemTabs.filter(t => t.key === 'specialty');
    console.log(`\n🎯 Specialty tabs found: ${specialtyTabs.length}`);
    specialtyTabs.forEach(tab => {
      console.log(`   - ID: ${tab.id}, Label: ${tab.label}, Visible: ${tab.isVisible}, Order: ${tab.displayOrder}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking tabs:', error);
    process.exit(1);
  }
}

checkTabs();

