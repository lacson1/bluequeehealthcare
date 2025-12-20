#!/usr/bin/env tsx
/**
 * Seed Lab Tests Script
 * Populates the lab_tests table with comprehensive laboratory test catalog
 */

import { db } from '../server/db';
import { labTests } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface LabTestData {
  name: string;
  code?: string;
  loincCode?: string;
  category: string;
  description?: string;
  units?: string;
  referenceRange?: string;
  sampleType?: string;
  methodOfCollection?: string;
  preparationInstructions?: string;
  estimatedTime?: string;
  cost?: string;
  priority?: string;
}

const LAB_TESTS: LabTestData[] = [
  // ========== HEMATOLOGY ==========
  { name: 'Complete Blood Count (CBC)', code: 'CBC', loincCode: '58410-2', category: 'Hematology', description: 'Complete blood count with differential', units: '', referenceRange: 'See individual components', sampleType: 'Blood', methodOfCollection: 'Venipuncture', estimatedTime: '1-2 hours', cost: '25.00' },
  { name: 'Hemoglobin (HGB)', code: 'HGB', loincCode: '718-7', category: 'Hematology', description: 'Hemoglobin concentration', units: 'g/dL', referenceRange: 'Male: 13.5-17.5, Female: 12.0-15.5', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Hematocrit (HCT)', code: 'HCT', loincCode: '4544-3', category: 'Hematology', description: 'Hematocrit percentage', units: '%', referenceRange: 'Male: 40-50, Female: 36-46', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'White Blood Cell Count (WBC)', code: 'WBC', loincCode: '6690-2', category: 'Hematology', description: 'Total white blood cell count', units: 'cells/μL', referenceRange: '4,500-11,000', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Platelet Count (PLT)', code: 'PLT', loincCode: '777-3', category: 'Hematology', description: 'Platelet count', units: 'cells/μL', referenceRange: '150,000-450,000', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Red Blood Cell Count (RBC)', code: 'RBC', loincCode: '789-8', category: 'Hematology', description: 'Red blood cell count', units: 'million/μL', referenceRange: 'Male: 4.5-5.9, Female: 4.0-5.2', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Mean Corpuscular Volume (MCV)', code: 'MCV', loincCode: '787-2', category: 'Hematology', description: 'Mean corpuscular volume', units: 'fL', referenceRange: '80-100', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Mean Corpuscular Hemoglobin (MCH)', code: 'MCH', loincCode: '785-6', category: 'Hematology', description: 'Mean corpuscular hemoglobin', units: 'pg', referenceRange: '27-31', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Mean Corpuscular Hemoglobin Concentration (MCHC)', code: 'MCHC', loincCode: '786-4', category: 'Hematology', description: 'Mean corpuscular hemoglobin concentration', units: 'g/dL', referenceRange: '32-36', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Red Cell Distribution Width (RDW)', code: 'RDW', loincCode: '788-0', category: 'Hematology', description: 'Red cell distribution width', units: '%', referenceRange: '11.5-14.5', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Differential Count', code: 'DIFF', loincCode: '6690-2', category: 'Hematology', description: 'White blood cell differential', units: '%', referenceRange: 'See individual cell types', sampleType: 'Blood', estimatedTime: '1-2 hours', cost: '15.00' },
  { name: 'Erythrocyte Sedimentation Rate (ESR)', code: 'ESR', loincCode: '4537-7', category: 'Hematology', description: 'Erythrocyte sedimentation rate', units: 'mm/hr', referenceRange: 'Male: 0-15, Female: 0-20', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Reticulocyte Count', code: 'RETIC', loincCode: '789-8', category: 'Hematology', description: 'Reticulocyte count', units: '%', referenceRange: '0.5-2.0', sampleType: 'Blood', estimatedTime: '2-4 hours', cost: '12.00' },

  // ========== CLINICAL CHEMISTRY ==========
  { name: 'Glucose (Fasting)', code: 'GLU', loincCode: '2339-0', category: 'Clinical Chemistry', description: 'Fasting blood glucose', units: 'mg/dL', referenceRange: '70-100', sampleType: 'Blood', preparationInstructions: 'Fasting 8-12 hours', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Glucose (Random)', code: 'GLU-R', loincCode: '2339-0', category: 'Clinical Chemistry', description: 'Random blood glucose', units: 'mg/dL', referenceRange: '<140', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Hemoglobin A1C (HbA1c)', code: 'HBA1C', loincCode: '4548-4', category: 'Clinical Chemistry', description: 'Hemoglobin A1C for diabetes monitoring', units: '%', referenceRange: '<5.7 (normal), 5.7-6.4 (prediabetes), ≥6.5 (diabetes)', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Urea Nitrogen (BUN)', code: 'BUN', loincCode: '3094-0', category: 'Clinical Chemistry', description: 'Blood urea nitrogen', units: 'mg/dL', referenceRange: '7-20', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Creatinine', code: 'CREAT', loincCode: '2160-0', category: 'Clinical Chemistry', description: 'Serum creatinine', units: 'mg/dL', referenceRange: 'Male: 0.7-1.3, Female: 0.6-1.1', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Estimated GFR', code: 'EGFR', loincCode: '33914-3', category: 'Clinical Chemistry', description: 'Estimated glomerular filtration rate', units: 'mL/min/1.73m²', referenceRange: '≥60 (normal)', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Uric Acid', code: 'UA', loincCode: '3084-1', category: 'Clinical Chemistry', description: 'Serum uric acid', units: 'mg/dL', referenceRange: 'Male: 3.5-7.2, Female: 2.6-6.0', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Total Protein', code: 'TP', loincCode: '2885-2', category: 'Clinical Chemistry', description: 'Total serum protein', units: 'g/dL', referenceRange: '6.0-8.3', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Albumin', code: 'ALB', loincCode: '1751-7', category: 'Clinical Chemistry', description: 'Serum albumin', units: 'g/dL', referenceRange: '3.5-5.0', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Globulin', code: 'GLOB', loincCode: '2335-8', category: 'Clinical Chemistry', description: 'Serum globulin', units: 'g/dL', referenceRange: '2.0-3.5', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Albumin/Globulin Ratio', code: 'A/G', loincCode: '1751-7', category: 'Clinical Chemistry', description: 'Albumin to globulin ratio', units: 'ratio', referenceRange: '1.0-2.0', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },

  // ========== LIVER FUNCTION ==========
  { name: 'Alanine Aminotransferase (ALT)', code: 'ALT', loincCode: '1742-6', category: 'Liver Function', description: 'ALT (SGPT)', units: 'U/L', referenceRange: 'Male: 10-40, Female: 7-35', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Aspartate Aminotransferase (AST)', code: 'AST', loincCode: '1920-8', category: 'Liver Function', description: 'AST (SGOT)', units: 'U/L', referenceRange: 'Male: 10-40, Female: 9-32', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Alkaline Phosphatase (ALP)', code: 'ALP', loincCode: '6768-6', category: 'Liver Function', description: 'Alkaline phosphatase', units: 'U/L', referenceRange: 'Adult: 44-147', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Total Bilirubin', code: 'TBIL', loincCode: '1975-2', category: 'Liver Function', description: 'Total bilirubin', units: 'mg/dL', referenceRange: '0.2-1.2', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Direct Bilirubin', code: 'DBIL', loincCode: '1968-7', category: 'Liver Function', description: 'Direct (conjugated) bilirubin', units: 'mg/dL', referenceRange: '0.0-0.3', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Indirect Bilirubin', code: 'IBIL', loincCode: '1975-2', category: 'Liver Function', description: 'Indirect (unconjugated) bilirubin', units: 'mg/dL', referenceRange: '0.2-0.9', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Gamma-Glutamyl Transferase (GGT)', code: 'GGT', loincCode: '2324-2', category: 'Liver Function', description: 'Gamma-glutamyl transferase', units: 'U/L', referenceRange: 'Male: 8-61, Female: 5-36', sampleType: 'Blood', estimatedTime: '1 hour', cost: '12.00' },
  { name: 'Lactate Dehydrogenase (LDH)', code: 'LDH', loincCode: '2532-0', category: 'Liver Function', description: 'Lactate dehydrogenase', units: 'U/L', referenceRange: '140-280', sampleType: 'Blood', estimatedTime: '1 hour', cost: '12.00' },

  // ========== LIPID PANEL ==========
  { name: 'Total Cholesterol', code: 'CHOL', loincCode: '2093-3', category: 'Lipid Panel', description: 'Total cholesterol', units: 'mg/dL', referenceRange: '<200 (desirable)', sampleType: 'Blood', preparationInstructions: 'Fasting 12-14 hours', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'High-Density Lipoprotein (HDL)', code: 'HDL', loincCode: '2085-9', category: 'Lipid Panel', description: 'HDL cholesterol', units: 'mg/dL', referenceRange: 'Male: >40, Female: >50', sampleType: 'Blood', preparationInstructions: 'Fasting 12-14 hours', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Low-Density Lipoprotein (LDL)', code: 'LDL', loincCode: '2089-1', category: 'Lipid Panel', description: 'LDL cholesterol', units: 'mg/dL', referenceRange: '<100 (optimal)', sampleType: 'Blood', preparationInstructions: 'Fasting 12-14 hours', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Triglycerides', code: 'TRIG', loincCode: '2571-8', category: 'Lipid Panel', description: 'Triglycerides', units: 'mg/dL', referenceRange: '<150 (normal)', sampleType: 'Blood', preparationInstructions: 'Fasting 12-14 hours', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Non-HDL Cholesterol', code: 'NONHDL', loincCode: '2085-9', category: 'Lipid Panel', description: 'Non-HDL cholesterol', units: 'mg/dL', referenceRange: '<130', sampleType: 'Blood', preparationInstructions: 'Fasting 12-14 hours', estimatedTime: '1 hour', cost: '10.00' },
  { name: 'Cholesterol/HDL Ratio', code: 'CHOL/HDL', loincCode: '2093-3', category: 'Lipid Panel', description: 'Total cholesterol to HDL ratio', units: 'ratio', referenceRange: '<5.0', sampleType: 'Blood', preparationInstructions: 'Fasting 12-14 hours', estimatedTime: '1 hour', cost: '10.00' },

  // ========== ELECTROLYTES ==========
  { name: 'Sodium (Na)', code: 'NA', loincCode: '2951-2', category: 'Electrolytes', description: 'Serum sodium', units: 'mEq/L', referenceRange: '136-145', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Potassium (K)', code: 'K', loincCode: '2823-3', category: 'Electrolytes', description: 'Serum potassium', units: 'mEq/L', referenceRange: '3.5-5.0', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Chloride (Cl)', code: 'CL', loincCode: '2075-0', category: 'Electrolytes', description: 'Serum chloride', units: 'mEq/L', referenceRange: '98-107', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Carbon Dioxide (CO2)', code: 'CO2', loincCode: '2028-9', category: 'Electrolytes', description: 'Total CO2 (bicarbonate)', units: 'mEq/L', referenceRange: '22-28', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Anion Gap', code: 'AGAP', loincCode: '33037-3', category: 'Electrolytes', description: 'Anion gap', units: 'mEq/L', referenceRange: '8-12', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Calcium (Ca)', code: 'CA', loincCode: '17861-6', category: 'Electrolytes', description: 'Total serum calcium', units: 'mg/dL', referenceRange: '8.5-10.5', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Ionized Calcium', code: 'ICA', loincCode: '2000-8', category: 'Electrolytes', description: 'Ionized calcium', units: 'mg/dL', referenceRange: '4.5-5.3', sampleType: 'Blood', estimatedTime: '1 hour', cost: '12.00' },
  { name: 'Phosphorus (P)', code: 'PHOS', loincCode: '2777-1', category: 'Electrolytes', description: 'Serum phosphorus', units: 'mg/dL', referenceRange: '2.5-4.5', sampleType: 'Blood', estimatedTime: '1 hour', cost: '8.00' },
  { name: 'Magnesium (Mg)', code: 'MG', loincCode: '2594-7', category: 'Electrolytes', description: 'Serum magnesium', units: 'mg/dL', referenceRange: '1.7-2.2', sampleType: 'Blood', estimatedTime: '1 hour', cost: '10.00' },

  // ========== THYROID FUNCTION ==========
  { name: 'Thyroid Stimulating Hormone (TSH)', code: 'TSH', loincCode: '3016-3', category: 'Endocrinology', description: 'TSH', units: 'mIU/L', referenceRange: '0.4-4.0', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Free T4', code: 'FT4', loincCode: '3024-7', category: 'Endocrinology', description: 'Free thyroxine', units: 'ng/dL', referenceRange: '0.8-1.8', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Free T3', code: 'FT3', loincCode: '3053-6', category: 'Endocrinology', description: 'Free triiodothyronine', units: 'pg/mL', referenceRange: '2.3-4.2', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Total T4', code: 'TT4', loincCode: '3026-2', category: 'Endocrinology', description: 'Total thyroxine', units: 'μg/dL', referenceRange: '4.5-12.0', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Total T3', code: 'TT3', loincCode: '3051-0', category: 'Endocrinology', description: 'Total triiodothyronine', units: 'ng/dL', referenceRange: '80-200', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Reverse T3', code: 'RT3', loincCode: '3054-4', category: 'Endocrinology', description: 'Reverse T3', units: 'ng/dL', referenceRange: '9.2-24.1', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '35.00' },
  { name: 'Thyroglobulin', code: 'TG', loincCode: '3013-0', category: 'Endocrinology', description: 'Thyroglobulin', units: 'ng/mL', referenceRange: '<40', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '45.00' },
  { name: 'Thyroid Peroxidase Antibodies (TPO)', code: 'TPO', loincCode: '5596-7', category: 'Endocrinology', description: 'Anti-TPO antibodies', units: 'IU/mL', referenceRange: '<9', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Thyroglobulin Antibodies', code: 'TGAB', loincCode: '5595-9', category: 'Endocrinology', description: 'Anti-thyroglobulin antibodies', units: 'IU/mL', referenceRange: '<4', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },

  // ========== CARDIAC MARKERS ==========
  { name: 'Troponin I', code: 'TNI', loincCode: '6598-7', category: 'Cardiac Panel', description: 'Cardiac troponin I', units: 'ng/mL', referenceRange: '<0.04', sampleType: 'Blood', priority: 'stat', estimatedTime: '1 hour', cost: '50.00' },
  { name: 'Troponin T', code: 'TNT', loincCode: '6597-9', category: 'Cardiac Panel', description: 'Cardiac troponin T', units: 'ng/mL', referenceRange: '<0.01', sampleType: 'Blood', priority: 'stat', estimatedTime: '1 hour', cost: '50.00' },
  { name: 'Creatine Kinase-MB (CK-MB)', code: 'CKMB', loincCode: '2157-6', category: 'Cardiac Panel', description: 'CK-MB isoenzyme', units: 'ng/mL', referenceRange: '<5', sampleType: 'Blood', priority: 'stat', estimatedTime: '1 hour', cost: '40.00' },
  { name: 'Brain Natriuretic Peptide (BNP)', code: 'BNP', loincCode: '33747-0', category: 'Cardiac Panel', description: 'B-type natriuretic peptide', units: 'pg/mL', referenceRange: '<100', sampleType: 'Blood', estimatedTime: '2-4 hours', cost: '60.00' },
  { name: 'NT-proBNP', code: 'NTBNP', loincCode: '33762-9', category: 'Cardiac Panel', description: 'N-terminal pro-BNP', units: 'pg/mL', referenceRange: '<125 (age <75), <450 (age ≥75)', sampleType: 'Blood', estimatedTime: '2-4 hours', cost: '60.00' },
  { name: 'Myoglobin', code: 'MYO', loincCode: '2324-2', category: 'Cardiac Panel', description: 'Myoglobin', units: 'ng/mL', referenceRange: 'Male: 17-106, Female: 12-76', sampleType: 'Blood', priority: 'stat', estimatedTime: '1 hour', cost: '35.00' },
  { name: 'Homocysteine', code: 'HOMO', loincCode: '33763-7', category: 'Cardiac Panel', description: 'Homocysteine', units: 'μmol/L', referenceRange: '<15', sampleType: 'Blood', preparationInstructions: 'Fasting', estimatedTime: '2-3 days', cost: '45.00' },

  // ========== COAGULATION ==========
  { name: 'Prothrombin Time (PT)', code: 'PT', loincCode: '5902-2', category: 'Coagulation', description: 'Prothrombin time', units: 'seconds', referenceRange: '11-13', sampleType: 'Blood', estimatedTime: '1 hour', cost: '15.00' },
  { name: 'International Normalized Ratio (INR)', code: 'INR', loincCode: '6301-6', category: 'Coagulation', description: 'INR', units: 'ratio', referenceRange: '0.9-1.1 (normal), 2.0-3.0 (anticoagulated)', sampleType: 'Blood', estimatedTime: '1 hour', cost: '15.00' },
  { name: 'Partial Thromboplastin Time (PTT)', code: 'PTT', loincCode: '5902-2', category: 'Coagulation', description: 'Activated partial thromboplastin time', units: 'seconds', referenceRange: '25-35', sampleType: 'Blood', estimatedTime: '1 hour', cost: '15.00' },
  { name: 'Activated Partial Thromboplastin Time (APTT)', code: 'APTT', loincCode: '3173-2', category: 'Coagulation', description: 'APTT', units: 'seconds', referenceRange: '25-35', sampleType: 'Blood', estimatedTime: '1 hour', cost: '15.00' },
  { name: 'Fibrinogen', code: 'FIB', loincCode: '3255-7', category: 'Coagulation', description: 'Fibrinogen', units: 'mg/dL', referenceRange: '200-400', sampleType: 'Blood', estimatedTime: '1-2 hours', cost: '25.00' },
  { name: 'D-Dimer', code: 'DDIM', loincCode: '48065-7', category: 'Coagulation', description: 'D-dimer', units: 'μg/mL', referenceRange: '<0.5', sampleType: 'Blood', estimatedTime: '1-2 hours', cost: '35.00' },
  { name: 'Antithrombin III', code: 'AT3', loincCode: '3377-1', category: 'Coagulation', description: 'Antithrombin III', units: '%', referenceRange: '80-120', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '45.00' },

  // ========== INFLAMMATORY MARKERS ==========
  { name: 'C-Reactive Protein (CRP)', code: 'CRP', loincCode: '1988-5', category: 'Inflammatory Markers', description: 'C-reactive protein', units: 'mg/L', referenceRange: '<3.0', sampleType: 'Blood', estimatedTime: '1-2 hours', cost: '20.00' },
  { name: 'High-Sensitivity CRP (hs-CRP)', code: 'HSCRP', loincCode: '30522-7', category: 'Inflammatory Markers', description: 'High-sensitivity CRP', units: 'mg/L', referenceRange: '<1.0 (low risk), 1.0-3.0 (moderate), >3.0 (high)', sampleType: 'Blood', estimatedTime: '1-2 hours', cost: '25.00' },
  { name: 'Procalcitonin', code: 'PCT', loincCode: '33959-8', category: 'Inflammatory Markers', description: 'Procalcitonin', units: 'ng/mL', referenceRange: '<0.25', sampleType: 'Blood', priority: 'stat', estimatedTime: '2-4 hours', cost: '60.00' },
  { name: 'Interleukin-6 (IL-6)', code: 'IL6', loincCode: '26881-3', category: 'Inflammatory Markers', description: 'Interleukin-6', units: 'pg/mL', referenceRange: '<3', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '70.00' },

  // ========== VITAMINS & MINERALS ==========
  { name: 'Vitamin D (25-OH)', code: 'VITD', loincCode: '14637-3', category: 'Vitamins', description: '25-hydroxyvitamin D', units: 'ng/mL', referenceRange: '30-100 (sufficient)', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Vitamin B12', code: 'B12', loincCode: '2132-9', category: 'Vitamins', description: 'Vitamin B12 (cobalamin)', units: 'pg/mL', referenceRange: '200-900', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Folate (Folic Acid)', code: 'FOL', loincCode: '2284-8', category: 'Vitamins', description: 'Folate', units: 'ng/mL', referenceRange: '>4', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Vitamin A', code: 'VITA', loincCode: '2926-1', category: 'Vitamins', description: 'Vitamin A (retinol)', units: 'μg/dL', referenceRange: '30-95', sampleType: 'Blood', estimatedTime: '3-5 days', cost: '60.00' },
  { name: 'Vitamin E', code: 'VITE', loincCode: '3016-3', category: 'Vitamins', description: 'Vitamin E (alpha-tocopherol)', units: 'mg/L', referenceRange: '5.5-17', sampleType: 'Blood', estimatedTime: '3-5 days', cost: '60.00' },
  { name: 'Iron', code: 'IRON', loincCode: '2498-4', category: 'Vitamins', description: 'Serum iron', units: 'μg/dL', referenceRange: 'Male: 65-175, Female: 50-170', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '20.00' },
  { name: 'Total Iron Binding Capacity (TIBC)', code: 'TIBC', loincCode: '2502-3', category: 'Vitamins', description: 'TIBC', units: 'μg/dL', referenceRange: '250-450', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '20.00' },
  { name: 'Transferrin Saturation', code: 'TSAT', loincCode: '2501-5', category: 'Vitamins', description: 'Transferrin saturation', units: '%', referenceRange: '20-50', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '20.00' },
  { name: 'Ferritin', code: 'FERR', loincCode: '2276-4', category: 'Vitamins', description: 'Ferritin', units: 'ng/mL', referenceRange: 'Male: 20-300, Female: 10-150', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Zinc', code: 'ZN', loincCode: '5671-3', category: 'Vitamins', description: 'Serum zinc', units: 'μg/dL', referenceRange: '70-120', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '35.00' },

  // ========== HORMONES ==========
  { name: 'Testosterone (Total)', code: 'TESTO', loincCode: '2986-8', category: 'Endocrinology', description: 'Total testosterone', units: 'ng/dL', referenceRange: 'Male: 300-1000, Female: 15-70', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '45.00' },
  { name: 'Testosterone (Free)', code: 'FTESTO', loincCode: '2989-2', category: 'Endocrinology', description: 'Free testosterone', units: 'pg/mL', referenceRange: 'Male: 9-30, Female: 0.3-1.9', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'Estradiol (E2)', code: 'E2', loincCode: '2019-8', category: 'Endocrinology', description: 'Estradiol', units: 'pg/mL', referenceRange: 'Male: 7.6-42.6, Female: varies by cycle', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '45.00' },
  { name: 'Progesterone', code: 'PROG', loincCode: '3374-8', category: 'Endocrinology', description: 'Progesterone', units: 'ng/mL', referenceRange: 'Female: varies by cycle', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '45.00' },
  { name: 'Follicle Stimulating Hormone (FSH)', code: 'FSH', loincCode: '3377-1', category: 'Endocrinology', description: 'FSH', units: 'mIU/mL', referenceRange: 'Male: 1.5-12.4, Female: varies by cycle', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Luteinizing Hormone (LH)', code: 'LH', loincCode: '26881-3', category: 'Endocrinology', description: 'LH', units: 'mIU/mL', referenceRange: 'Male: 1.7-8.6, Female: varies by cycle', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Prolactin', code: 'PRL', loincCode: '20465-8', category: 'Endocrinology', description: 'Prolactin', units: 'ng/mL', referenceRange: 'Male: 2-18, Female: 3-30', sampleType: 'Blood', preparationInstructions: 'Fasting, morning sample', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Cortisol (AM)', code: 'CORT', loincCode: '2157-6', category: 'Endocrinology', description: 'Morning cortisol', units: 'μg/dL', referenceRange: '5-25', sampleType: 'Blood', preparationInstructions: 'Morning sample (8 AM)', estimatedTime: '2-3 days', cost: '45.00' },
  { name: 'Adrenocorticotropic Hormone (ACTH)', code: 'ACTH', loincCode: '33747-0', category: 'Endocrinology', description: 'ACTH', units: 'pg/mL', referenceRange: '7.2-63.3', sampleType: 'Blood', preparationInstructions: 'Morning sample, ice immediately', estimatedTime: '2-3 days', cost: '60.00' },
  { name: 'Insulin (Fasting)', code: 'INS', loincCode: '3016-3', category: 'Endocrinology', description: 'Fasting insulin', units: 'μIU/mL', referenceRange: '2-25', sampleType: 'Blood', preparationInstructions: 'Fasting 8-12 hours', estimatedTime: '2-3 days', cost: '45.00' },
  { name: 'C-Peptide', code: 'CPEP', loincCode: '3053-6', category: 'Endocrinology', description: 'C-peptide', units: 'ng/mL', referenceRange: '0.9-7.1', sampleType: 'Blood', preparationInstructions: 'Fasting', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Growth Hormone (GH)', code: 'GH', loincCode: '2324-2', category: 'Endocrinology', description: 'Growth hormone', units: 'ng/mL', referenceRange: '<5', sampleType: 'Blood', preparationInstructions: 'Fasting', estimatedTime: '2-3 days', cost: '60.00' },
  { name: 'Insulin-like Growth Factor-1 (IGF-1)', code: 'IGF1', loincCode: '2532-0', category: 'Endocrinology', description: 'IGF-1', units: 'ng/mL', referenceRange: 'Age-dependent', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '60.00' },

  // ========== TUMOR MARKERS ==========
  { name: 'Prostate-Specific Antigen (PSA)', code: 'PSA', loincCode: '2857-1', category: 'Tumor Markers', description: 'PSA', units: 'ng/mL', referenceRange: '<4.0', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Carcinoembryonic Antigen (CEA)', code: 'CEA', loincCode: '14631-6', category: 'Tumor Markers', description: 'CEA', units: 'ng/mL', referenceRange: '<3.0 (non-smoker), <5.0 (smoker)', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'CA 19-9', code: 'CA199', loincCode: '2324-2', category: 'Tumor Markers', description: 'CA 19-9', units: 'U/mL', referenceRange: '<37', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'CA 125', code: 'CA125', loincCode: '2532-0', category: 'Tumor Markers', description: 'CA 125', units: 'U/mL', referenceRange: '<35', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'CA 15-3', code: 'CA153', loincCode: '2324-2', category: 'Tumor Markers', description: 'CA 15-3', units: 'U/mL', referenceRange: '<30', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'Alpha-Fetoprotein (AFP)', code: 'AFP', loincCode: '2532-0', category: 'Tumor Markers', description: 'AFP', units: 'ng/mL', referenceRange: '<10', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'Beta-2 Microglobulin', code: 'B2M', loincCode: '2324-2', category: 'Tumor Markers', description: 'Beta-2 microglobulin', units: 'mg/L', referenceRange: '0.8-2.4', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },

  // ========== PANCREATIC FUNCTION ==========
  { name: 'Amylase', code: 'AMYL', loincCode: '1798-8', category: 'Pancreatic Panel', description: 'Amylase', units: 'U/L', referenceRange: '30-110', sampleType: 'Blood', estimatedTime: '1-2 hours', cost: '20.00' },
  { name: 'Lipase', code: 'LIP', loincCode: '3040-3', category: 'Pancreatic Panel', description: 'Lipase', units: 'U/L', referenceRange: '7-60', sampleType: 'Blood', estimatedTime: '1-2 hours', cost: '20.00' },

  // ========== URINE ANALYSIS ==========
  { name: 'Urinalysis (Complete)', code: 'UA', loincCode: '24356-8', category: 'Urine Analysis', description: 'Complete urinalysis', units: '', referenceRange: 'See individual components', sampleType: 'Urine', methodOfCollection: 'Midstream clean catch', estimatedTime: '1 hour', cost: '15.00' },
  { name: 'Urine Culture', code: 'UCULT', loincCode: '630-4', category: 'Urine Analysis', description: 'Urine culture and sensitivity', units: '', referenceRange: 'No growth', sampleType: 'Urine', methodOfCollection: 'Midstream clean catch', estimatedTime: '2-3 days', cost: '35.00' },
  { name: 'Urine Microalbumin', code: 'UALB', loincCode: '14959-1', category: 'Urine Analysis', description: 'Microalbumin in urine', units: 'mg/L', referenceRange: '<30', sampleType: 'Urine', estimatedTime: '1-2 days', cost: '30.00' },
  { name: 'Urine Protein/Creatinine Ratio', code: 'UPCR', loincCode: '33914-3', category: 'Urine Analysis', description: 'Urine protein to creatinine ratio', units: 'mg/g', referenceRange: '<150', sampleType: 'Urine', estimatedTime: '1-2 days', cost: '25.00' },
  { name: '24-Hour Urine Protein', code: 'U24PRO', loincCode: '2888-6', category: 'Urine Analysis', description: '24-hour urine protein', units: 'mg/24h', referenceRange: '<150', sampleType: 'Urine', methodOfCollection: '24-hour collection', estimatedTime: '1-2 days', cost: '30.00' },
  { name: '24-Hour Urine Creatinine', code: 'U24CRE', loincCode: '2160-0', category: 'Urine Analysis', description: '24-hour urine creatinine', units: 'g/24h', referenceRange: 'Male: 1.0-2.0, Female: 0.8-1.8', sampleType: 'Urine', methodOfCollection: '24-hour collection', estimatedTime: '1-2 days', cost: '25.00' },

  // ========== STOOL ANALYSIS ==========
  { name: 'Stool Occult Blood', code: 'FOBT', loincCode: '14563-1', category: 'Stool Analysis', description: 'Fecal occult blood test', units: '', referenceRange: 'Negative', sampleType: 'Stool', estimatedTime: '1-2 days', cost: '20.00' },
  { name: 'Stool Culture', code: 'SCULT', loincCode: '630-4', category: 'Stool Analysis', description: 'Stool culture', units: '', referenceRange: 'No pathogens', sampleType: 'Stool', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Ova and Parasites', code: 'O&P', loincCode: '10702-4', category: 'Stool Analysis', description: 'Ova and parasites', units: '', referenceRange: 'Negative', sampleType: 'Stool', estimatedTime: '2-3 days', cost: '35.00' },
  { name: 'Clostridium difficile Toxin', code: 'CDIFF', loincCode: '10702-4', category: 'Stool Analysis', description: 'C. diff toxin', units: '', referenceRange: 'Negative', sampleType: 'Stool', estimatedTime: '1-2 days', cost: '45.00' },

  // ========== INFECTIOUS DISEASE ==========
  { name: 'Hepatitis B Surface Antigen (HBsAg)', code: 'HBSAG', loincCode: '5196-1', category: 'Serology', description: 'HBsAg', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Hepatitis B Surface Antibody (Anti-HBs)', code: 'HBSAB', loincCode: '22321-1', category: 'Serology', description: 'Anti-HBs', units: '', referenceRange: 'Positive (immune)', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Hepatitis B Core Antibody (Anti-HBc)', code: 'HBCAB', loincCode: '22322-9', category: 'Serology', description: 'Anti-HBc', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Hepatitis C Antibody (Anti-HCV)', code: 'HCVAB', loincCode: '22321-1', category: 'Serology', description: 'Anti-HCV', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Hepatitis A Antibody (Anti-HAV)', code: 'HAVAB', loincCode: '22321-1', category: 'Serology', description: 'Anti-HAV', units: '', referenceRange: 'Negative (non-immune)', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'HIV 1/2 Antibody', code: 'HIV', loincCode: '75622-1', category: 'Serology', description: 'HIV antibody screen', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '50.00' },
  { name: 'Syphilis (RPR/VDRL)', code: 'RPR', loincCode: '20507-0', category: 'Serology', description: 'Rapid plasma reagin', units: '', referenceRange: 'Non-reactive', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '25.00' },
  { name: 'Syphilis (TPPA/FTA-ABS)', code: 'TPPA', loincCode: '20507-0', category: 'Serology', description: 'Treponema pallidum antibody', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '35.00' },
  { name: 'Epstein-Barr Virus (EBV) Panel', code: 'EBV', loincCode: '24321-8', category: 'Serology', description: 'EBV serology', units: '', referenceRange: 'See individual components', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '60.00' },
  { name: 'Cytomegalovirus (CMV) IgG/IgM', code: 'CMV', loincCode: '24321-8', category: 'Serology', description: 'CMV antibodies', units: '', referenceRange: 'See individual components', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Toxoplasma IgG/IgM', code: 'TOXO', loincCode: '24321-8', category: 'Serology', description: 'Toxoplasma antibodies', units: '', referenceRange: 'See individual components', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Rubella IgG', code: 'RUB', loincCode: '24321-8', category: 'Serology', description: 'Rubella antibody', units: '', referenceRange: 'Positive (immune)', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Varicella Zoster IgG', code: 'VZV', loincCode: '24321-8', category: 'Serology', description: 'Varicella zoster antibody', units: '', referenceRange: 'Positive (immune)', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },

  // ========== AUTOIMMUNE ==========
  { name: 'Antinuclear Antibody (ANA)', code: 'ANA', loincCode: '5048-9', category: 'Autoimmune', description: 'ANA screen', units: 'titer', referenceRange: '<1:80', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Rheumatoid Factor (RF)', code: 'RF', loincCode: '26881-3', category: 'Autoimmune', description: 'Rheumatoid factor', units: 'IU/mL', referenceRange: '<15', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '40.00' },
  { name: 'Anti-CCP Antibody', code: 'CCP', loincCode: '26881-3', category: 'Autoimmune', description: 'Anti-cyclic citrullinated peptide', units: 'U/mL', referenceRange: '<20', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'Anti-dsDNA', code: 'DSDNA', loincCode: '5048-9', category: 'Autoimmune', description: 'Anti-double stranded DNA', units: 'IU/mL', referenceRange: '<30', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '60.00' },
  { name: 'Anti-SSA (Ro)', code: 'SSA', loincCode: '5048-9', category: 'Autoimmune', description: 'Anti-SSA/Ro antibody', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Anti-SSB (La)', code: 'SSB', loincCode: '5048-9', category: 'Autoimmune', description: 'Anti-SSB/La antibody', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Anti-Sm', code: 'SM', loincCode: '5048-9', category: 'Autoimmune', description: 'Anti-Smith antibody', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Anti-RNP', code: 'RNP', loincCode: '5048-9', category: 'Autoimmune', description: 'Anti-RNP antibody', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Anti-Jo-1', code: 'JO1', loincCode: '5048-9', category: 'Autoimmune', description: 'Anti-Jo-1 antibody', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'Anti-Scl-70', code: 'SCL70', loincCode: '5048-9', category: 'Autoimmune', description: 'Anti-Scl-70 antibody', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },

  // ========== PREGNANCY ==========
  { name: 'Beta-HCG (Quantitative)', code: 'BHCG', loincCode: '21198-7', category: 'Pregnancy', description: 'Beta human chorionic gonadotropin', units: 'mIU/mL', referenceRange: 'Non-pregnant: <5', sampleType: 'Blood', estimatedTime: '2-4 hours', cost: '30.00' },
  { name: 'Beta-HCG (Qualitative)', code: 'HCGQ', loincCode: '2106-3', category: 'Pregnancy', description: 'Pregnancy test', units: '', referenceRange: 'Negative', sampleType: 'Blood', estimatedTime: '1 hour', cost: '20.00' },
  { name: 'Prenatal Screen (Quad Screen)', code: 'QUAD', loincCode: '24321-8', category: 'Pregnancy', description: 'Quadruple marker screen', units: '', referenceRange: 'See individual components', sampleType: 'Blood', estimatedTime: '3-5 days', cost: '150.00' },

  // ========== DRUG MONITORING ==========
  { name: 'Lithium Level', code: 'LITH', loincCode: '33914-3', category: 'Drug Monitoring', description: 'Lithium therapeutic level', units: 'mEq/L', referenceRange: '0.6-1.2', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Digoxin Level', code: 'DIG', loincCode: '33914-3', category: 'Drug Monitoring', description: 'Digoxin level', units: 'ng/mL', referenceRange: '0.8-2.0', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Phenytoin Level', code: 'PHEN', loincCode: '33914-3', category: 'Drug Monitoring', description: 'Phenytoin level', units: 'μg/mL', referenceRange: '10-20', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Valproic Acid Level', code: 'VALP', loincCode: '33914-3', category: 'Drug Monitoring', description: 'Valproic acid level', units: 'μg/mL', referenceRange: '50-100', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Carbamazepine Level', code: 'CARB', loincCode: '33914-3', category: 'Drug Monitoring', description: 'Carbamazepine level', units: 'μg/mL', referenceRange: '4-12', sampleType: 'Blood', estimatedTime: '1-2 days', cost: '40.00' },
  { name: 'Vancomycin Trough', code: 'VANC', loincCode: '33914-3', category: 'Drug Monitoring', description: 'Vancomycin trough level', units: 'μg/mL', referenceRange: '10-20', sampleType: 'Blood', priority: 'stat', estimatedTime: '2-4 hours', cost: '45.00' },
  { name: 'Gentamicin Trough', code: 'GENT', loincCode: '33914-3', category: 'Drug Monitoring', description: 'Gentamicin trough level', units: 'μg/mL', referenceRange: '<1', sampleType: 'Blood', priority: 'stat', estimatedTime: '2-4 hours', cost: '45.00' },

  // ========== TOXICOLOGY ==========
  { name: 'Drug Screen (Urine)', code: 'UDS', loincCode: '11041-1', category: 'Toxicology', description: 'Urine drug screen', units: '', referenceRange: 'Negative', sampleType: 'Urine', estimatedTime: '1-2 hours', cost: '50.00' },
  { name: 'Ethanol (Blood)', code: 'ETOH', loincCode: '5640-8', category: 'Toxicology', description: 'Blood alcohol level', units: 'mg/dL', referenceRange: '<10', sampleType: 'Blood', priority: 'stat', estimatedTime: '1 hour', cost: '30.00' },
  { name: 'Salicylate Level', code: 'SAL', loincCode: '33914-3', category: 'Toxicology', description: 'Salicylate (aspirin) level', units: 'mg/dL', referenceRange: '<30', sampleType: 'Blood', priority: 'stat', estimatedTime: '1-2 hours', cost: '35.00' },
  { name: 'Acetaminophen Level', code: 'ACET', loincCode: '33914-3', category: 'Toxicology', description: 'Acetaminophen level', units: 'μg/mL', referenceRange: '<10', sampleType: 'Blood', priority: 'stat', estimatedTime: '1-2 hours', cost: '35.00' },
  { name: 'Lead Level', code: 'PB', loincCode: '5671-3', category: 'Toxicology', description: 'Blood lead level', units: 'μg/dL', referenceRange: '<5 (adult), <3.5 (child)', sampleType: 'Blood', estimatedTime: '3-5 days', cost: '45.00' },
  { name: 'Mercury Level', code: 'HG', loincCode: '5671-3', category: 'Toxicology', description: 'Blood mercury level', units: 'μg/L', referenceRange: '<10', sampleType: 'Blood', estimatedTime: '3-5 days', cost: '50.00' },

  // ========== BONE METABOLISM ==========
  { name: 'Parathyroid Hormone (PTH)', code: 'PTH', loincCode: '3377-1', category: 'Bone Panel', description: 'Intact PTH', units: 'pg/mL', referenceRange: '10-65', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '50.00' },
  { name: 'Bone-Specific Alkaline Phosphatase', code: 'BAP', loincCode: '6768-6', category: 'Bone Panel', description: 'Bone-specific ALP', units: 'U/L', referenceRange: 'Age and gender dependent', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '55.00' },
  { name: 'Osteocalcin', code: 'OC', loincCode: '2324-2', category: 'Bone Panel', description: 'Osteocalcin', units: 'ng/mL', referenceRange: 'Age and gender dependent', sampleType: 'Blood', estimatedTime: '2-3 days', cost: '60.00' },

  // ========== CEREBROSPINAL FLUID ==========
  { name: 'CSF Analysis', code: 'CSF', loincCode: '24356-8', category: 'Body Fluids', description: 'Cerebrospinal fluid analysis', units: '', referenceRange: 'See individual components', sampleType: 'CSF', methodOfCollection: 'Lumbar puncture', estimatedTime: '1-2 hours', cost: '60.00' },
  { name: 'CSF Culture', code: 'CSFCULT', loincCode: '630-4', category: 'Body Fluids', description: 'CSF culture', units: '', referenceRange: 'No growth', sampleType: 'CSF', estimatedTime: '2-3 days', cost: '70.00' },
  { name: 'CSF Protein', code: 'CSFPRO', loincCode: '2885-2', category: 'Body Fluids', description: 'CSF total protein', units: 'mg/dL', referenceRange: '15-60', sampleType: 'CSF', estimatedTime: '1-2 hours', cost: '25.00' },
  { name: 'CSF Glucose', code: 'CSFGLU', loincCode: '2339-0', category: 'Body Fluids', description: 'CSF glucose', units: 'mg/dL', referenceRange: '40-70 (60% of serum)', sampleType: 'CSF', estimatedTime: '1 hour', cost: '15.00' },
  { name: 'CSF Cell Count', code: 'CSFCELL', loincCode: '6690-2', category: 'Body Fluids', description: 'CSF cell count', units: 'cells/μL', referenceRange: '0-5 (lymphocytes)', sampleType: 'CSF', estimatedTime: '1 hour', cost: '20.00' },
];

async function seedLabTests() {
  try {
    console.log('🧪 Starting lab tests seeding...');

    // Check if tests already exist
    const existingTests = await db.select().from(labTests).limit(1);
    if (existingTests.length > 0) {
      console.log('⚠️  Lab tests already exist. Skipping seed.');
      console.log('   To re-seed, delete existing tests first or use --force flag');
      return;
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const test of LAB_TESTS) {
      try {
        // Check if test with same name already exists
        const existing = await db.select()
          .from(labTests)
          .where(eq(labTests.name, test.name))
          .limit(1);

        if (existing.length > 0) {
          skippedCount++;
          continue;
        }

        await db.insert(labTests).values({
          name: test.name,
          code: test.code || null,
          loincCode: test.loincCode || null,
          category: test.category,
          description: test.description || null,
          units: test.units || null,
          referenceRange: test.referenceRange || null,
          sampleType: test.sampleType || null,
          methodOfCollection: test.methodOfCollection || null,
          preparationInstructions: test.preparationInstructions || null,
          estimatedTime: test.estimatedTime || null,
          cost: test.cost ? test.cost : null,
          priority: (test.priority as 'routine' | 'urgent' | 'stat') || 'routine',
          isActive: true,
        });

        insertedCount++;
      } catch (error) {
        console.error(`❌ Error inserting test "${test.name}":`, error);
        skippedCount++;
      }
    }

    console.log(`✅ Lab tests seeding completed!`);
    console.log(`   ✅ Inserted: ${insertedCount} tests`);
    console.log(`   ⏭️  Skipped: ${skippedCount} tests`);
    console.log(`   📊 Total: ${LAB_TESTS.length} tests processed`);
  } catch (error) {
    console.error('❌ Error seeding lab tests:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedLabTests()
    .then(() => {
      console.log('✅ Seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export { seedLabTests, LAB_TESTS };

