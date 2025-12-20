import 'dotenv/config';
import { db } from '../server/db';
import { tabConfigs } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// System tabs configuration - matches the registry
const SYSTEM_TABS = [
  { key: 'overview', label: 'Overview', icon: 'User', contentType: 'builtin_component', displayOrder: 10, category: 'clinical' },
  { key: 'visits', label: 'Visits', icon: 'Calendar', contentType: 'builtin_component', displayOrder: 20, category: 'clinical' },
  { key: 'lab', label: 'Lab Results', icon: 'TestTube', contentType: 'builtin_component', displayOrder: 30, category: 'clinical' },
  { key: 'medications', label: 'Medications', icon: 'Pill', contentType: 'builtin_component', displayOrder: 40, category: 'clinical' },
  { key: 'vitals', label: 'Vitals', icon: 'Activity', contentType: 'builtin_component', displayOrder: 50, category: 'clinical' },
  { key: 'documents', label: 'Documents', icon: 'FileText', contentType: 'builtin_component', displayOrder: 60, category: 'administrative' },
  { key: 'billing', label: 'Billing', icon: 'CreditCard', contentType: 'builtin_component', displayOrder: 70, category: 'administrative' },
  { key: 'insurance', label: 'Insurance', icon: 'Shield', contentType: 'builtin_component', displayOrder: 80, category: 'administrative' },
  { key: 'appointments', label: 'Appointments', icon: 'CalendarDays', contentType: 'builtin_component', displayOrder: 90, category: 'administrative' },
  { key: 'history', label: 'History', icon: 'History', contentType: 'builtin_component', displayOrder: 100, category: 'clinical' },
  { key: 'med-reviews', label: 'Reviews', icon: 'FileCheck', contentType: 'builtin_component', displayOrder: 110, category: 'clinical' },
  { key: 'communication', label: 'Chat', icon: 'MessageSquare', contentType: 'builtin_component', displayOrder: 120, category: 'administrative' },
  { key: 'immunizations', label: 'Vaccines', icon: 'Syringe', contentType: 'builtin_component', displayOrder: 130, category: 'clinical' },
  { key: 'timeline', label: 'Timeline', icon: 'Clock', contentType: 'builtin_component', displayOrder: 140, category: 'clinical' },
  { key: 'safety', label: 'Safety', icon: 'Shield', contentType: 'builtin_component', displayOrder: 150, category: 'clinical' },
  { key: 'specialty', label: 'Specialty', icon: 'Stethoscope', contentType: 'builtin_component', displayOrder: 160, category: 'clinical' },
  { key: 'allergies', label: 'Allergies', icon: 'AlertTriangle', contentType: 'builtin_component', displayOrder: 170, category: 'clinical' },
  { key: 'imaging', label: 'Imaging', icon: 'Scan', contentType: 'builtin_component', displayOrder: 180, category: 'clinical' },
  { key: 'procedures', label: 'Procedures', icon: 'Scissors', contentType: 'builtin_component', displayOrder: 190, category: 'clinical' },
  { key: 'referrals', label: 'Referrals', icon: 'Users', contentType: 'builtin_component', displayOrder: 200, category: 'clinical' },
  { key: 'care-plans', label: 'Care Plans', icon: 'ClipboardList', contentType: 'builtin_component', displayOrder: 210, category: 'clinical' },
  { key: 'notes', label: 'Notes', icon: 'BookOpen', contentType: 'builtin_component', displayOrder: 220, category: 'clinical' },
];

async function seedTabs() {
  try {
    console.log('🌱 Seeding system tabs...\n');

    // Get existing system tabs
    const existingTabs = await db
      .select()
      .from(tabConfigs)
      .where(and(eq(tabConfigs.scope, 'system'), eq(tabConfigs.isSystemDefault, true)));
    
    const existingKeys = new Set(existingTabs.map(t => t.key));
    const tabsToInsert = SYSTEM_TABS.filter(tab => !existingKeys.has(tab.key));
    
    if (tabsToInsert.length === 0) {
      console.log('✅ All system tabs already exist in the database');
      console.log(`   Found ${existingTabs.length} existing tabs\n`);
      return;
    }

    console.log(`📝 Inserting ${tabsToInsert.length} new tabs...\n`);

    // Insert missing tabs
    await db.insert(tabConfigs).values(
      tabsToInsert.map(tab => ({
        ...tab,
        scope: 'system' as const,
        isSystemDefault: true,
        isVisible: true,
        isMandatory: false,
        settings: {},
        organizationId: null,
        roleId: null,
        userId: null,
        createdBy: null,
      }))
    );

    console.log('✅ Successfully seeded tabs:');
    tabsToInsert.forEach(tab => {
      console.log(`   - ${tab.label} (${tab.key})`);
    });
    console.log(`\n✅ Total tabs in database: ${existingTabs.length + tabsToInsert.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding tabs:', error);
    process.exit(1);
  }
}

seedTabs();

