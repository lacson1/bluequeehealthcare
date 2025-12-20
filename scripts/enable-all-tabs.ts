import 'dotenv/config';
import { db } from '../server/db';
import { tabConfigs } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

async function enableAllTabs() {
  try {
    console.log('🔧 Enabling all system tabs...\n');

    // Get all system tabs
    const systemTabs = await db
      .select()
      .from(tabConfigs)
      .where(and(eq(tabConfigs.scope, 'system'), eq(tabConfigs.isSystemDefault, true)));
    
    console.log(`Found ${systemTabs.length} system tabs\n`);

    // Enable all tabs
    const updatePromises = systemTabs.map(tab => 
      db
        .update(tabConfigs)
        .set({ isVisible: true })
        .where(eq(tabConfigs.id, tab.id))
    );

    await Promise.all(updatePromises);

    console.log('✅ All system tabs are now enabled and visible\n');
    console.log('Tabs enabled:');
    systemTabs.forEach(tab => {
      console.log(`   - ${tab.label} (${tab.key}) - Order: ${tab.displayOrder}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error enabling tabs:', error);
    process.exit(1);
  }
}

enableAllTabs();

