#!/usr/bin/env tsx
/**
 * Quick fix script to correct the typo in psychological therapy tab configuration
 * 
 * Fixes:
 * - "Phycological therapy" -> "Psychological therapy"
 * - "theraphy" -> "therapy" (in key if present)
 * 
 * Usage:
 *   npx tsx fix-psychological-therapy-typo.ts
 *   OR
 *   tsx fix-psychological-therapy-typo.ts
 */

import 'dotenv/config';
import { pool } from './server/db';

async function fixTypo() {
  console.log('🔧 Fixing psychological therapy tab typo...\n');

  try {
    // Fix label typo: "Phycological" -> "Psychological"
    const labelResult = await pool.query(`
      UPDATE tab_configs
      SET 
        label = 'Psychological therapy',
        updated_at = NOW()
      WHERE 
        (label ILIKE '%Phycological%' OR label ILIKE '%theraphy%')
        AND (key = 'psychological-therapy' OR key ILIKE '%theraphy%' OR key ILIKE '%phycological%')
      RETURNING id, key, label;
    `);

    if (labelResult.rows.length > 0) {
      console.log(`✅ Fixed ${labelResult.rows.length} tab config(s) with label typo:`);
      labelResult.rows.forEach(row => {
        console.log(`   - ID ${row.id}: "${row.label}" (key: ${row.key})`);
      });
    } else {
      console.log('ℹ️  No tabs found with label typo');
    }

    // Fix key typo if it exists (e.g., "theraphy" -> "therapy")
    const keyResult = await pool.query(`
      UPDATE tab_configs
      SET 
        key = 'psychological-therapy',
        label = 'Psychological therapy',
        updated_at = NOW()
      WHERE 
        key ILIKE '%theraphy%' OR key ILIKE '%phycological%'
      RETURNING id, key, label;
    `);

    if (keyResult.rows.length > 0) {
      console.log(`\n✅ Fixed ${keyResult.rows.length} tab config(s) with key typo:`);
      keyResult.rows.forEach(row => {
        console.log(`   - ID ${row.id}: key="${row.key}", label="${row.label}"`);
      });
    } else {
      console.log('\nℹ️  No tabs found with key typo');
    }

    // Fix in tab_preset_items if custom_label has the typo
    const presetResult = await pool.query(`
      UPDATE tab_preset_items
      SET 
        custom_label = 'Psychological therapy',
        tab_key = 'psychological-therapy'
      WHERE 
        (custom_label ILIKE '%Phycological%' OR custom_label ILIKE '%theraphy%')
        OR (tab_key ILIKE '%theraphy%' OR tab_key ILIKE '%phycological%')
      RETURNING id, tab_key, custom_label;
    `);

    if (presetResult.rows.length > 0) {
      console.log(`\n✅ Fixed ${presetResult.rows.length} tab preset item(s):`);
      presetResult.rows.forEach(row => {
        console.log(`   - ID ${row.id}: tab_key="${row.tab_key}", custom_label="${row.custom_label}"`);
      });
    } else {
      console.log('\nℹ️  No tab preset items found with typo');
    }

    // Verify the fix
    console.log('\n📋 Verifying fix...\n');
    const verifyResult = await pool.query(`
      SELECT 
        id,
        key,
        label,
        scope,
        is_system_default
      FROM tab_configs
      WHERE 
        key = 'psychological-therapy'
        OR label ILIKE '%psychological%'
        OR label ILIKE '%therapy%'
      ORDER BY id;
    `);

    if (verifyResult.rows.length > 0) {
      console.log('✅ Found psychological therapy tab(s):');
      verifyResult.rows.forEach(row => {
        console.log(`   - ID ${row.id}: key="${row.key}", label="${row.label}", scope="${row.scope}"`);
      });
    } else {
      console.log('⚠️  No psychological therapy tab found in database');
    }

    console.log('\n✅ Typo fix completed successfully!');
    console.log('   Refresh your browser to see the corrected tab label.');

  } catch (error: any) {
    console.error('\n❌ Error fixing typo:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixTypo()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

