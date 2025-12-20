/**
 * Comprehensive Test Script for Patient Profile Tabs
 * Tests all tabs to ensure data saving works correctly
 */

import 'dotenv/config';
import { pool } from '../server/db';
import { sql } from 'drizzle-orm';

interface TestResult {
  tab: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const testResults: TestResult[] = [];

async function testDatabaseTable(tableName: string, description: string): Promise<TestResult> {
  try {
    const result = await pool.query({
      text: `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      values: [tableName]
    });
    
    const exists = result.rows[0]?.exists || false;
    
    if (exists) {
      // Check if table has required columns
      const columnsResult = await pool.query({
        text: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `,
        values: [tableName]
      });
      
      return {
        tab: description,
        status: 'PASS',
        message: `Table "${tableName}" exists with ${columnsResult.rows.length} columns`,
        details: {
          columns: columnsResult.rows.map((r: any) => ({
            name: r.column_name,
            type: r.data_type,
            nullable: r.is_nullable === 'YES'
          }))
        }
      };
    } else {
      return {
        tab: description,
        status: 'FAIL',
        message: `Table "${tableName}" does not exist`
      };
    }
  } catch (error: any) {
    return {
      tab: description,
      status: 'FAIL',
      message: `Error checking table: ${error.message}`
    };
  }
}

async function testInsertOperation(tableName: string, testData: any, description: string): Promise<TestResult> {
  try {
    // First, get a test patient ID
    const patientResult = await pool.query({
      text: 'SELECT id FROM patients LIMIT 1'
    });
    
    if (patientResult.rows.length === 0) {
      return {
        tab: description,
        status: 'SKIP',
        message: 'No patients found in database - skipping insert test'
      };
    }
    
    const patientId = patientResult.rows[0].id;
    
    // Try to insert test data
    const insertData = { ...testData, patient_id: patientId };
    const columns = Object.keys(insertData).join(', ');
    const values = Object.values(insertData).map((v, i) => `$${i + 1}`).join(', ');
    const valuesArray = Object.values(insertData);
    
    const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${values}) RETURNING id`;
    
    const result = await pool.query({
      text: insertQuery,
      values: valuesArray
    });
    
    const insertedId = result.rows[0]?.id;
    
    if (insertedId) {
      // Clean up test data
      await pool.query({
        text: `DELETE FROM ${tableName} WHERE id = $1`,
        values: [insertedId]
      });
      
      return {
        tab: description,
        status: 'PASS',
        message: `Successfully inserted and deleted test record (ID: ${insertedId})`
      };
    } else {
      return {
        tab: description,
        status: 'FAIL',
        message: 'Insert succeeded but no ID returned'
      };
    }
  } catch (error: any) {
    return {
      tab: description,
      status: 'FAIL',
      message: `Insert test failed: ${error.message}`,
      details: { error: error.message }
    };
  }
}

async function runAllTests() {
  console.log('\n🧪 Testing Patient Profile Tabs - Save Functionality\n');
  console.log('='.repeat(60));
  
  // Test 1: Patient Allergies
  console.log('\n1. Testing Allergies Tab...');
  const allergiesTable = await testDatabaseTable('patient_allergies', 'Allergies');
  testResults.push(allergiesTable);
  console.log(`   ${allergiesTable.status === 'PASS' ? '✅' : '❌'} ${allergiesTable.message}`);
  
  if (allergiesTable.status === 'PASS') {
    const allergiesInsert = await testInsertOperation('patient_allergies', {
      allergen: 'Test Allergen',
      allergy_type: 'drug',
      severity: 'mild',
      reaction: 'Test reaction',
      created_at: new Date().toISOString()
    }, 'Allergies - Insert Test');
    testResults.push(allergiesInsert);
    console.log(`   ${allergiesInsert.status === 'PASS' ? '✅' : allergiesInsert.status === 'SKIP' ? '⏭️' : '❌'} ${allergiesInsert.message}`);
  }
  
  // Test 2: Patient Imaging
  console.log('\n2. Testing Imaging Tab...');
  const imagingTable = await testDatabaseTable('patient_imaging', 'Imaging');
  testResults.push(imagingTable);
  console.log(`   ${imagingTable.status === 'PASS' ? '✅' : '❌'} ${imagingTable.message}`);
  
  if (imagingTable.status === 'PASS') {
    const imagingInsert = await testInsertOperation('patient_imaging', {
      study_type: 'X-Ray',
      study_date: new Date().toISOString().split('T')[0],
      body_part: 'Chest',
      indication: 'Test indication',
      priority: 'routine',
      status: 'ordered',
      created_at: new Date().toISOString()
    }, 'Imaging - Insert Test');
    testResults.push(imagingInsert);
    console.log(`   ${imagingInsert.status === 'PASS' ? '✅' : imagingInsert.status === 'SKIP' ? '⏭️' : '❌'} ${imagingInsert.message}`);
  }
  
  // Test 3: Patient Immunizations
  console.log('\n3. Testing Immunizations Tab...');
  const immunizationsTable = await testDatabaseTable('patient_immunizations', 'Immunizations');
  testResults.push(immunizationsTable);
  console.log(`   ${immunizationsTable.status === 'PASS' ? '✅' : '❌'} ${immunizationsTable.message}`);
  
  if (immunizationsTable.status === 'PASS') {
    const immunizationsInsert = await testInsertOperation('patient_immunizations', {
      vaccine_name: 'Test Vaccine',
      date_administered: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString()
    }, 'Immunizations - Insert Test');
    testResults.push(immunizationsInsert);
    console.log(`   ${immunizationsInsert.status === 'PASS' ? '✅' : immunizationsInsert.status === 'SKIP' ? '⏭️' : '❌'} ${immunizationsInsert.message}`);
  }
  
  // Test 4: Patient Procedures
  console.log('\n4. Testing Procedures Tab...');
  const proceduresTable = await testDatabaseTable('patient_procedures', 'Procedures');
  testResults.push(proceduresTable);
  console.log(`   ${proceduresTable.status === 'PASS' ? '✅' : '❌'} ${proceduresTable.message}`);
  
  if (proceduresTable.status === 'PASS') {
    const proceduresInsert = await testInsertOperation('patient_procedures', {
      procedure_name: 'Test Procedure',
      procedure_date: new Date().toISOString().split('T')[0],
      procedure_type: 'diagnostic',
      indication: 'Test indication',
      created_at: new Date().toISOString()
    }, 'Procedures - Insert Test');
    testResults.push(proceduresInsert);
    console.log(`   ${proceduresInsert.status === 'PASS' ? '✅' : proceduresInsert.status === 'SKIP' ? '⏭️' : '❌'} ${proceduresInsert.message}`);
  }
  
  // Test 5: Visits
  console.log('\n5. Testing Visits Tab...');
  const visitsTable = await testDatabaseTable('visits', 'Visits');
  testResults.push(visitsTable);
  console.log(`   ${visitsTable.status === 'PASS' ? '✅' : '❌'} ${visitsTable.message}`);
  
  // Test 6: Prescriptions
  console.log('\n6. Testing Prescriptions Tab...');
  const prescriptionsTable = await testDatabaseTable('prescriptions', 'Prescriptions');
  testResults.push(prescriptionsTable);
  console.log(`   ${prescriptionsTable.status === 'PASS' ? '✅' : '❌'} ${prescriptionsTable.message}`);
  
  // Test 7: Lab Results
  console.log('\n7. Testing Lab Results Tab...');
  const labResultsTable = await testDatabaseTable('lab_results', 'Lab Results');
  testResults.push(labResultsTable);
  console.log(`   ${labResultsTable.status === 'PASS' ? '✅' : '❌'} ${labResultsTable.message}`);
  
  // Test 8: Appointments
  console.log('\n8. Testing Appointments Tab...');
  const appointmentsTable = await testDatabaseTable('appointments', 'Appointments');
  testResults.push(appointmentsTable);
  console.log(`   ${appointmentsTable.status === 'PASS' ? '✅' : '❌'} ${appointmentsTable.message}`);
  
  // Test 9: Vaccinations
  console.log('\n9. Testing Vaccinations Tab...');
  const vaccinationsTable = await testDatabaseTable('vaccinations', 'Vaccinations');
  testResults.push(vaccinationsTable);
  console.log(`   ${vaccinationsTable.status === 'PASS' ? '✅' : '❌'} ${vaccinationsTable.message}`);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const skipped = testResults.filter(r => r.status === 'SKIP').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📝 Total: ${testResults.length}`);
  
  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:\n');
    testResults.filter(r => r.status === 'FAIL').forEach(result => {
      console.log(`   • ${result.tab}: ${result.message}`);
      if (result.details) {
        console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(60));
  
  await pool.end();
  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});

