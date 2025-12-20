import 'dotenv/config';
import { db } from '../server/db';
import { tabConfigs } from '../shared/schema';
import { eq, and, or, isNotNull } from 'drizzle-orm';

async function fixTabsVisibility() {
  try {
    console.log('🔧 Fixing tabs visibility...\n');

    // Get all tabs (system and organization)
    const allTabs = await db
      .select()
      .from(tabConfigs)
      .orderBy(tabConfigs.displayOrder);
    
    console.log(`Found ${allTabs.length} total tabs\n`);

    // Check for organization-specific tabs that might be hiding system tabs
    const orgTabs = allTabs.filter(t => t.scope === 'organization' && t.organizationId !== null);
    console.log(`Organization-specific tabs: ${orgTabs.length}`);
    
    if (orgTabs.length > 0) {
      console.log('\n⚠️  Found organization-specific tab overrides:');
      orgTabs.forEach(tab => {
        console.log(`   - ${tab.label} (${tab.key}) - Visible: ${tab.isVisible} - Org ID: ${tab.organizationId}`);
      });
    }

    // Ensure all system tabs are visible
    const systemTabs = allTabs.filter(t => t.scope === 'system' && t.isSystemDefault);
    console.log(`\n✅ System tabs: ${systemTabs.length}`);
    
    const hiddenSystemTabs = systemTabs.filter(t => !t.isVisible);
    if (hiddenSystemTabs.length > 0) {
      console.log(`\n⚠️  Found ${hiddenSystemTabs.length} hidden system tabs. Enabling them...`);
      for (const tab of hiddenSystemTabs) {
        await db
          .update(tabConfigs)
          .set({ isVisible: true })
          .where(eq(tabConfigs.id, tab.id));
        console.log(`   ✅ Enabled: ${tab.label} (${tab.key})`);
      }
    } else {
      console.log('✅ All system tabs are visible');
    }

    // Show specialty tab status
    const specialtyTab = systemTabs.find(t => t.key === 'specialty');
    if (specialtyTab) {
      console.log(`\n🎯 Specialty tab status:`);
      console.log(`   - ID: ${specialtyTab.id}`);
      console.log(`   - Label: ${specialtyTab.label}`);
      console.log(`   - Key: ${specialtyTab.key}`);
      console.log(`   - Visible: ${specialtyTab.isVisible}`);
      console.log(`   - Order: ${specialtyTab.displayOrder}`);
    } else {
      console.log('\n❌ Specialty tab not found in system tabs!');
    }

    console.log('\n✅ Done! Refresh your browser to see the tabs.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing tabs:', error);
    process.exit(1);
  }
}

fixTabsVisibility();

