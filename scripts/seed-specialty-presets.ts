/**
 * Seed Specialty Tab Presets
 * 
 * This script creates specialty-specific tab presets that configure
 * which tabs are visible and their order for different medical specialties.
 */

import { db } from '../server/db';
import { tabPresets, tabPresetItems } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

// Define specialty presets with their tab configurations
const SPECIALTY_PRESETS = [
  {
    name: 'Cardiology',
    description: 'Optimized for cardiovascular care - emphasizes vitals, lab results, and imaging',
    icon: 'Heart',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'vitals', visible: true, order: 20 }, // Critical for cardiac monitoring
      { key: 'visits', visible: true, order: 30 },
      { key: 'lab', visible: true, order: 40 }, // Cardiac enzymes, lipid panels
      { key: 'imaging', visible: true, order: 50 }, // Echo, EKG, stress tests
      { key: 'medications', visible: true, order: 60 }, // Cardiac medications
      { key: 'procedures', visible: true, order: 70 }, // Cardiac procedures
      { key: 'allergies', visible: true, order: 80 },
      { key: 'timeline', visible: true, order: 90 },
      { key: 'documents', visible: true, order: 100 },
      { key: 'safety', visible: true, order: 110 },
      { key: 'immunizations', visible: false, order: 120 },
    ]
  },
  {
    name: 'Pediatrics',
    description: 'Child-focused view with growth charts, immunizations, and developmental tracking',
    icon: 'Baby',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'visits', visible: true, order: 20 },
      { key: 'vitals', visible: true, order: 30 }, // Growth tracking
      { key: 'immunizations', visible: true, order: 40 }, // Critical for pediatrics
      { key: 'medications', visible: true, order: 50 },
      { key: 'allergies', visible: true, order: 60 },
      { key: 'lab', visible: true, order: 70 },
      { key: 'timeline', visible: true, order: 80 },
      { key: 'documents', visible: true, order: 90 },
      { key: 'safety', visible: true, order: 100 },
      { key: 'imaging', visible: true, order: 110 },
      { key: 'procedures', visible: true, order: 120 },
    ]
  },
  {
    name: 'Psychiatry',
    description: 'Mental health focused - emphasizes timeline, medications, and safety assessments',
    icon: 'Brain',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'visits', visible: true, order: 20 },
      { key: 'medications', visible: true, order: 30 }, // Psychotropic medications
      { key: 'timeline', visible: true, order: 40 }, // Mental health history
      { key: 'safety', visible: true, order: 50 }, // Suicide risk, self-harm
      { key: 'allergies', visible: true, order: 60 },
      { key: 'lab', visible: true, order: 70 }, // Medication levels
      { key: 'documents', visible: true, order: 80 },
      { key: 'vitals', visible: true, order: 90 },
      { key: 'imaging', visible: false, order: 100 },
      { key: 'procedures', visible: false, order: 110 },
      { key: 'immunizations', visible: false, order: 120 },
    ]
  },
  {
    name: 'Orthopedics',
    description: 'Musculoskeletal care - highlights imaging, procedures, and physical therapy',
    icon: 'Bone',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'visits', visible: true, order: 20 },
      { key: 'imaging', visible: true, order: 30 }, // X-rays, MRIs, CT scans
      { key: 'procedures', visible: true, order: 40 }, // Surgeries, injections
      { key: 'vitals', visible: true, order: 50 },
      { key: 'medications', visible: true, order: 60 },
      { key: 'lab', visible: true, order: 70 },
      { key: 'allergies', visible: true, order: 80 },
      { key: 'timeline', visible: true, order: 90 },
      { key: 'documents', visible: true, order: 100 },
      { key: 'safety', visible: true, order: 110 },
      { key: 'immunizations', visible: false, order: 120 },
    ]
  },
  {
    name: 'Dermatology',
    description: 'Skin care focus - emphasizes imaging (photos), visits, and procedures',
    icon: 'Scissors',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'visits', visible: true, order: 20 },
      { key: 'imaging', visible: true, order: 30 }, // Skin photos
      { key: 'procedures', visible: true, order: 40 }, // Biopsies, excisions
      { key: 'medications', visible: true, order: 50 },
      { key: 'allergies', visible: true, order: 60 }, // Contact allergies
      { key: 'lab', visible: true, order: 70 },
      { key: 'documents', visible: true, order: 80 },
      { key: 'timeline', visible: true, order: 90 },
      { key: 'vitals', visible: true, order: 100 },
      { key: 'safety', visible: true, order: 110 },
      { key: 'immunizations', visible: false, order: 120 },
    ]
  },
  {
    name: 'Oncology',
    description: 'Cancer care - comprehensive view with lab results, imaging, and procedures',
    icon: 'Activity',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'visits', visible: true, order: 20 },
      { key: 'lab', visible: true, order: 30 }, // Tumor markers, CBC
      { key: 'imaging', visible: true, order: 40 }, // CT, PET scans
      { key: 'procedures', visible: true, order: 50 }, // Biopsies, surgeries
      { key: 'medications', visible: true, order: 60 }, // Chemotherapy
      { key: 'timeline', visible: true, order: 70 },
      { key: 'vitals', visible: true, order: 80 },
      { key: 'allergies', visible: true, order: 90 },
      { key: 'documents', visible: true, order: 100 },
      { key: 'safety', visible: true, order: 110 },
      { key: 'immunizations', visible: false, order: 120 },
    ]
  },
  {
    name: 'Emergency Medicine',
    description: 'Fast-paced ER view - quick access to vitals, lab, imaging, and safety',
    icon: 'AlertCircle',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'vitals', visible: true, order: 20 }, // Critical for triage
      { key: 'lab', visible: true, order: 30 }, // Rapid results
      { key: 'imaging', visible: true, order: 40 }, // Quick diagnostics
      { key: 'allergies', visible: true, order: 50 }, // Critical for treatment
      { key: 'medications', visible: true, order: 60 },
      { key: 'safety', visible: true, order: 70 }, // Risk assessment
      { key: 'visits', visible: true, order: 80 },
      { key: 'procedures', visible: true, order: 90 },
      { key: 'timeline', visible: true, order: 100 },
      { key: 'documents', visible: true, order: 110 },
      { key: 'immunizations', visible: false, order: 120 },
    ]
  },
  {
    name: 'General Practice',
    description: 'Comprehensive primary care view with all tabs balanced',
    icon: 'Stethoscope',
    tabs: [
      { key: 'overview', visible: true, order: 10 },
      { key: 'visits', visible: true, order: 20 },
      { key: 'medications', visible: true, order: 30 },
      { key: 'vitals', visible: true, order: 40 },
      { key: 'lab', visible: true, order: 50 },
      { key: 'allergies', visible: true, order: 60 },
      { key: 'immunizations', visible: true, order: 70 },
      { key: 'timeline', visible: true, order: 80 },
      { key: 'documents', visible: true, order: 90 },
      { key: 'imaging', visible: true, order: 100 },
      { key: 'procedures', visible: true, order: 110 },
      { key: 'safety', visible: true, order: 120 },
    ]
  },
];

export async function seedSpecialtyPresets() {
  console.log('🌱 Seeding specialty tab presets...');

  try {
    // Check if presets already exist
    const existingPresets = await db.select().from(tabPresets).where(
      eq(tabPresets.scope, 'system')
    );

    const existingNames = new Set(existingPresets.map(p => p.name));

    for (const preset of SPECIALTY_PRESETS) {
      // Skip if already exists
      if (existingNames.has(preset.name)) {
        console.log(`  ⏭️  Skipping ${preset.name} (already exists)`);
        continue;
      }

      // Insert preset
      const [insertedPreset] = await db.insert(tabPresets).values({
        name: preset.name,
        description: preset.description,
        scope: 'system',
        icon: preset.icon,
        isDefault: false,
        organizationId: null,
        createdBy: null,
      }).returning();

      console.log(`  ✅ Created preset: ${preset.name}`);

      // Insert preset items
      const presetItems = preset.tabs.map(tab => ({
        presetId: insertedPreset.id,
        tabKey: tab.key,
        isVisible: tab.visible,
        displayOrder: tab.order,
        customLabel: null,
        customIcon: null,
        customSettings: null,
      }));

      await db.insert(tabPresetItems).values(presetItems);
      console.log(`  ✅ Added ${presetItems.length} tab configurations for ${preset.name}`);
    }

    console.log('✅ Specialty presets seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding specialty presets:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedSpecialtyPresets()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}

