import { db } from './db';
import { labTests, labDepartments } from '../shared/schema';
import { eq } from 'drizzle-orm';

interface LabTestData {
  category: string;
  subCategory: string;
  testName: string;
}

// Comprehensive lab test catalog
const labTestCatalog: LabTestData[] = [
  // Hematology
  { category: "Hematology", subCategory: "General", testName: "Hemoglobin (Hb)" },
  { category: "Hematology", subCategory: "General", testName: "Hematocrit (Hct)" },
  { category: "Hematology", subCategory: "General", testName: "Red Blood Cell Count (RBC)" },
  { category: "Hematology", subCategory: "General", testName: "White Blood Cell Count (WBC)" },
  { category: "Hematology", subCategory: "General", testName: "Platelet Count" },
  { category: "Hematology", subCategory: "Indices", testName: "Mean Corpuscular Volume (MCV)" },
  { category: "Hematology", subCategory: "Indices", testName: "Mean Corpuscular Hemoglobin (MCH)" },
  { category: "Hematology", subCategory: "Indices", testName: "Mean Corpuscular Hemoglobin Concentration (MCHC)" },
  { category: "Hematology", subCategory: "Indices", testName: "Red Cell Distribution Width (RDW)" },
  { category: "Hematology", subCategory: "Inflammation", testName: "Erythrocyte Sedimentation Rate (ESR)" },
  { category: "Hematology", subCategory: "Inflammation", testName: "C-Reactive Protein (CRP)" },
  { category: "Hematology", subCategory: "Differential", testName: "Neutrophil Count" },
  { category: "Hematology", subCategory: "Differential", testName: "Lymphocyte Count" },
  { category: "Hematology", subCategory: "Differential", testName: "Monocyte Count" },
  { category: "Hematology", subCategory: "Differential", testName: "Eosinophil Count" },
  { category: "Hematology", subCategory: "Differential", testName: "Basophil Count" },
  { category: "Hematology", subCategory: "Reticulocytes", testName: "Reticulocyte Count" },
  { category: "Hematology", subCategory: "Iron Studies", testName: "Serum Iron" },
  { category: "Hematology", subCategory: "Iron Studies", testName: "Total Iron Binding Capacity (TIBC)" },
  { category: "Hematology", subCategory: "Iron Studies", testName: "Transferrin" },
  { category: "Hematology", subCategory: "Iron Studies", testName: "Transferrin Saturation" },
  { category: "Hematology", subCategory: "Iron Studies", testName: "Ferritin" },
  { category: "Hematology", subCategory: "Hemolysis", testName: "Haptoglobin" },
  { category: "Hematology", subCategory: "Hemolysis", testName: "Lactate Dehydrogenase (LDH)" },
  { category: "Hematology", subCategory: "Special", testName: "Peripheral Blood Film" },
  { category: "Hematology", subCategory: "Special", testName: "Hemoglobin Electrophoresis" },
  { category: "Hematology", subCategory: "Special", testName: "G6PD Assay" },
  { category: "Hematology", subCategory: "Special", testName: "Sickle Cell Screening Test" },
  { category: "Hematology", subCategory: "Special", testName: "Bone Marrow Examination" },
  { category: "Hematology", subCategory: "Special", testName: "Beta-2 Microglobulin" },

  // Coagulation
  { category: "Coagulation", subCategory: "Screening", testName: "Prothrombin Time (PT)" },
  { category: "Coagulation", subCategory: "Screening", testName: "International Normalized Ratio (INR)" },
  { category: "Coagulation", subCategory: "Screening", testName: "Activated Partial Thromboplastin Time (aPTT)" },
  { category: "Coagulation", subCategory: "Screening", testName: "Bleeding Time" },
  { category: "Coagulation", subCategory: "Screening", testName: "Clotting Time" },
  { category: "Coagulation", subCategory: "Factors", testName: "Fibrinogen Level" },
  { category: "Coagulation", subCategory: "Factors", testName: "Factor VIII Assay" },
  { category: "Coagulation", subCategory: "Factors", testName: "Factor IX Assay" },
  { category: "Coagulation", subCategory: "Thrombosis", testName: "D-Dimer" },
  { category: "Coagulation", subCategory: "Special", testName: "Thrombin Time" },
  { category: "Coagulation", subCategory: "Special", testName: "Mixing Studies" },

  // Biochemistry
  { category: "Biochemistry", subCategory: "Renal", testName: "Serum Urea" },
  { category: "Biochemistry", subCategory: "Renal", testName: "Serum Creatinine" },
  { category: "Biochemistry", subCategory: "Renal", testName: "Estimated GFR (eGFR)" },
  { category: "Biochemistry", subCategory: "Renal", testName: "Serum Uric Acid" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Sodium" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Potassium" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Chloride" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Bicarbonate" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Magnesium" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Phosphate" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Calcium (Total)" },
  { category: "Biochemistry", subCategory: "Electrolytes", testName: "Serum Calcium (Ionised)" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Alanine Aminotransferase (ALT)" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Aspartate Aminotransferase (AST)" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Alkaline Phosphatase (ALP)" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Gamma-Glutamyl Transferase (GGT)" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Total Bilirubin" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Direct Bilirubin" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Indirect Bilirubin" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Serum Albumin" },
  { category: "Biochemistry", subCategory: "Liver", testName: "Total Protein" },
  { category: "Biochemistry", subCategory: "Pancreas", testName: "Serum Amylase" },
  { category: "Biochemistry", subCategory: "Pancreas", testName: "Serum Lipase" },
  { category: "Biochemistry", subCategory: "Cardiac", testName: "Creatine Kinase (CK)" },
  { category: "Biochemistry", subCategory: "Cardiac", testName: "CK-MB" },
  { category: "Biochemistry", subCategory: "Cardiac", testName: "Troponin I" },
  { category: "Biochemistry", subCategory: "Cardiac", testName: "Troponin T" },
  { category: "Biochemistry", subCategory: "Cardiac", testName: "B-type Natriuretic Peptide (BNP)" },
  { category: "Biochemistry", subCategory: "Cardiac", testName: "NT-proBNP" },
  { category: "Biochemistry", subCategory: "Metabolic", testName: "Lactate" },
  { category: "Biochemistry", subCategory: "Metabolic", testName: "Serum Osmolality" },
  { category: "Biochemistry", subCategory: "Metabolic", testName: "Anion Gap" },

  // Diabetes & Glucose
  { category: "Diabetes & Glucose", subCategory: "Glucose", testName: "Random Plasma Glucose" },
  { category: "Diabetes & Glucose", subCategory: "Glucose", testName: "Fasting Plasma Glucose" },
  { category: "Diabetes & Glucose", subCategory: "Glucose", testName: "2-hour OGTT Plasma Glucose" },
  { category: "Diabetes & Glucose", subCategory: "Monitoring", testName: "Glycated Hemoglobin (HbA1c)" },
  { category: "Diabetes & Glucose", subCategory: "Monitoring", testName: "Capillary Blood Glucose (Finger-prick)" },
  { category: "Diabetes & Glucose", subCategory: "Monitoring", testName: "Continuous Glucose Monitoring (CGM) Report" },
  { category: "Diabetes & Glucose", subCategory: "Complications", testName: "Urine Microalbumin" },
  { category: "Diabetes & Glucose", subCategory: "Complications", testName: "Albumin/Creatinine Ratio (ACR)" },
  { category: "Diabetes & Glucose", subCategory: "Complications", testName: "Serum Ketones (Beta-hydroxybutyrate)" },
  { category: "Diabetes & Glucose", subCategory: "Complications", testName: "Urine Ketones" },

  // Lipid Profile
  { category: "Lipid Profile", subCategory: "Standard", testName: "Total Cholesterol" },
  { category: "Lipid Profile", subCategory: "Standard", testName: "High-Density Lipoprotein (HDL) Cholesterol" },
  { category: "Lipid Profile", subCategory: "Standard", testName: "Low-Density Lipoprotein (LDL) Cholesterol" },
  { category: "Lipid Profile", subCategory: "Standard", testName: "Triglycerides" },
  { category: "Lipid Profile", subCategory: "Advanced", testName: "Non-HDL Cholesterol" },
  { category: "Lipid Profile", subCategory: "Advanced", testName: "Cholesterol/HDL Ratio" },
  { category: "Lipid Profile", subCategory: "Advanced", testName: "Apolipoprotein A1" },
  { category: "Lipid Profile", subCategory: "Advanced", testName: "Apolipoprotein B" },
  { category: "Lipid Profile", subCategory: "Advanced", testName: "Lipoprotein(a) [Lp(a)]" },
  { category: "Lipid Profile", subCategory: "Advanced", testName: "Small Dense LDL" },

  // Endocrinology
  { category: "Endocrinology", subCategory: "Thyroid", testName: "Thyroid Stimulating Hormone (TSH)" },
  { category: "Endocrinology", subCategory: "Thyroid", testName: "Free T4" },
  { category: "Endocrinology", subCategory: "Thyroid", testName: "Free T3" },
  { category: "Endocrinology", subCategory: "Thyroid", testName: "Anti-Thyroid Peroxidase Antibody (Anti-TPO)" },
  { category: "Endocrinology", subCategory: "Thyroid", testName: "Anti-Thyroglobulin Antibody" },
  { category: "Endocrinology", subCategory: "Adrenal", testName: "Serum Cortisol (AM)" },
  { category: "Endocrinology", subCategory: "Adrenal", testName: "Serum Cortisol (PM)" },
  { category: "Endocrinology", subCategory: "Adrenal", testName: "ACTH" },
  { category: "Endocrinology", subCategory: "Adrenal", testName: "Dexamethasone Suppression Test" },
  { category: "Endocrinology", subCategory: "Adrenal", testName: "Plasma Metanephrines" },
  { category: "Endocrinology", subCategory: "Adrenal", testName: "24-hour Urine Metanephrines" },
  { category: "Endocrinology", subCategory: "Gonadal", testName: "FSH" },
  { category: "Endocrinology", subCategory: "Gonadal", testName: "LH" },
  { category: "Endocrinology", subCategory: "Gonadal", testName: "Total Testosterone" },
  { category: "Endocrinology", subCategory: "Gonadal", testName: "Free Testosterone" },
  { category: "Endocrinology", subCategory: "Gonadal", testName: "Sex Hormone-Binding Globulin (SHBG)" },
  { category: "Endocrinology", subCategory: "Gonadal", testName: "Oestradiol (E2)" },
  { category: "Endocrinology", subCategory: "Gonadal", testName: "Progesterone" },
  { category: "Endocrinology", subCategory: "Parathyroid", testName: "Parathyroid Hormone (PTH)" },
  { category: "Endocrinology", subCategory: "Parathyroid", testName: "Serum Calcium (Adjusted)" },
  { category: "Endocrinology", subCategory: "Parathyroid", testName: "Serum Phosphate" },
  { category: "Endocrinology", subCategory: "Growth", testName: "Growth Hormone" },
  { category: "Endocrinology", subCategory: "Growth", testName: "Insulin-like Growth Factor 1 (IGF-1)" },
  { category: "Endocrinology", subCategory: "Metabolic", testName: "Serum Insulin" },
  { category: "Endocrinology", subCategory: "Metabolic", testName: "C-Peptide" },

  // Immunology/Autoimmune
  { category: "Immunology/Autoimmune", subCategory: "General", testName: "Antinuclear Antibody (ANA)" },
  { category: "Immunology/Autoimmune", subCategory: "General", testName: "Extractable Nuclear Antigen Panel (ENA)" },
  { category: "Immunology/Autoimmune", subCategory: "Rheumatology", testName: "Rheumatoid Factor (RF)" },
  { category: "Immunology/Autoimmune", subCategory: "Rheumatology", testName: "Anti-Cyclic Citrullinated Peptide (Anti-CCP)" },
  { category: "Immunology/Autoimmune", subCategory: "Vasculitis", testName: "Anti-Neutrophil Cytoplasmic Antibodies (ANCA)" },
  { category: "Immunology/Autoimmune", subCategory: "Vasculitis", testName: "Anti-MPO Antibody" },
  { category: "Immunology/Autoimmune", subCategory: "Vasculitis", testName: "Anti-PR3 Antibody" },
  { category: "Immunology/Autoimmune", subCategory: "Liver", testName: "Anti-Mitochondrial Antibody (AMA)" },
  { category: "Immunology/Autoimmune", subCategory: "Liver", testName: "Anti-Smooth Muscle Antibody" },
  { category: "Immunology/Autoimmune", subCategory: "Liver", testName: "Anti-LKM Antibody" },
  { category: "Immunology/Autoimmune", subCategory: "Renal", testName: "Anti-GBM Antibody" },
  { category: "Immunology/Autoimmune", subCategory: "Thyroid", testName: "Thyroid Autoantibody Panel" },
  { category: "Immunology/Autoimmune", subCategory: "Connective Tissue", testName: "Anti-dsDNA Antibody" },
  { category: "Immunology/Autoimmune", subCategory: "Connective Tissue", testName: "Complement C3" },
  { category: "Immunology/Autoimmune", subCategory: "Connective Tissue", testName: "Complement C4" },
  { category: "Immunology/Autoimmune", subCategory: "Allergy", testName: "Total IgE" },
  { category: "Immunology/Autoimmune", subCategory: "Allergy", testName: "Specific IgE (Inhalant Panel)" },
  { category: "Immunology/Autoimmune", subCategory: "Allergy", testName: "Specific IgE (Food Panel)" },
  { category: "Immunology/Autoimmune", subCategory: "Immunoglobulins", testName: "IgG" },
  { category: "Immunology/Autoimmune", subCategory: "Immunoglobulins", testName: "IgA" },
  { category: "Immunology/Autoimmune", subCategory: "Immunoglobulins", testName: "IgM" },
  { category: "Immunology/Autoimmune", subCategory: "Immunoglobulins", testName: "IgG Subclasses" },
  { category: "Immunology/Autoimmune", subCategory: "Immunodeficiency", testName: "Lymphocyte Subset Panel (CD3/CD4/CD8)" },
  { category: "Immunology/Autoimmune", subCategory: "Immunodeficiency", testName: "CD4 Count" },
  { category: "Immunology/Autoimmune", subCategory: "Immunodeficiency", testName: "CD8 Count" },

  // Infectious Disease
  { category: "Infectious Disease", subCategory: "Viral", testName: "HIV Ag/Ab Screen" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "HIV Viral Load" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis B Surface Antigen (HBsAg)" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis B Surface Antibody (Anti-HBs)" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis B Core Antibody (Anti-HBc)" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis B Viral DNA (HBV DNA)" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis C Antibody" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis C Viral RNA (HCV RNA)" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis A IgM Antibody" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Hepatitis E IgM Antibody" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "EBV Serology Panel" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "CMV Serology Panel" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Varicella-Zoster IgG" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Measles IgG" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Rubella IgG" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Rubella IgM" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "COVID-19 PCR" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "COVID-19 Antigen Test" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "Influenza A/B PCR" },
  { category: "Infectious Disease", subCategory: "Viral", testName: "RSV PCR" },
  { category: "Infectious Disease", subCategory: "Bacterial", testName: "Blood Culture" },
  { category: "Infectious Disease", subCategory: "Bacterial", testName: "Urine Culture and Sensitivity" },
  { category: "Infectious Disease", subCategory: "Bacterial", testName: "Stool Culture" },
  { category: "Infectious Disease", subCategory: "Bacterial", testName: "Sputum Culture and Sensitivity" },
  { category: "Infectious Disease", subCategory: "Bacterial", testName: "Wound Swab Culture" },

  // Microbiology/Parasitology
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Stool Ova and Parasites" },
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Malaria Thick and Thin Film" },
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Malaria Rapid Diagnostic Test" },
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Giardia Antigen (Stool)" },
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Entamoeba Histolytica Antigen (Stool)" },
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Dengue NS1 Antigen" },
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Dengue IgM Antibody" },
  { category: "Microbiology/Parasitology", subCategory: "Parasitology", testName: "Typhoid Widal Test" },
  { category: "Microbiology/Parasitology", subCategory: "Bacterial", testName: "Helicobacter pylori Stool Antigen" },
  { category: "Microbiology/Parasitology", subCategory: "Bacterial", testName: "Helicobacter pylori Urea Breath Test" },
  { category: "Microbiology/Parasitology", subCategory: "STI", testName: "Chlamydia NAAT (Urine/Swab)" },
  { category: "Microbiology/Parasitology", subCategory: "STI", testName: "Gonorrhoea NAAT (Urine/Swab)" },
  { category: "Microbiology/Parasitology", subCategory: "STI", testName: "Syphilis RPR" },
  { category: "Microbiology/Parasitology", subCategory: "STI", testName: "Syphilis TPHA" },
  { category: "Microbiology/Parasitology", subCategory: "STI", testName: "Trichomonas Vaginalis NAAT" },
  { category: "Microbiology/Parasitology", subCategory: "STI", testName: "HSV-1 IgG" },
  { category: "Microbiology/Parasitology", subCategory: "STI", testName: "HSV-2 IgG" },
  { category: "Microbiology/Parasitology", subCategory: "Tuberculosis", testName: "TB Quantiferon Gold" },
  { category: "Microbiology/Parasitology", subCategory: "Tuberculosis", testName: "TB Skin Test (Mantoux)" },
  { category: "Microbiology/Parasitology", subCategory: "Tuberculosis", testName: "Sputum AFB Smear" },
  { category: "Microbiology/Parasitology", subCategory: "Tuberculosis", testName: "Sputum GeneXpert MTB/RIF" },

  // Renal/Urine
  { category: "Renal/Urine", subCategory: "Urinalysis", testName: "Urine Dipstick (Multistix)" },
  { category: "Renal/Urine", subCategory: "Urinalysis", testName: "Urine Microscopy" },
  { category: "Renal/Urine", subCategory: "Urinalysis", testName: "Urine pH" },
  { category: "Renal/Urine", subCategory: "Protein", testName: "24-hour Urine Protein" },
  { category: "Renal/Urine", subCategory: "Protein", testName: "Protein/Creatinine Ratio (PCR)" },
  { category: "Renal/Urine", subCategory: "Protein", testName: "Albumin/Creatinine Ratio (ACR)" },
  { category: "Renal/Urine", subCategory: "Electrolytes", testName: "Urine Sodium" },
  { category: "Renal/Urine", subCategory: "Electrolytes", testName: "Urine Potassium" },
  { category: "Renal/Urine", subCategory: "Electrolytes", testName: "Urine Chloride" },
  { category: "Renal/Urine", subCategory: "Electrolytes", testName: "Urine Osmolality" },
  { category: "Renal/Urine", subCategory: "Stones", testName: "Urine Calcium" },
  { category: "Renal/Urine", subCategory: "Stones", testName: "Urine Oxalate" },
  { category: "Renal/Urine", subCategory: "Stones", testName: "Urine Uric Acid" },
  { category: "Renal/Urine", subCategory: "Stones", testName: "Stone Analysis" },
  { category: "Renal/Urine", subCategory: "Infection", testName: "Urine Culture" },
  { category: "Renal/Urine", subCategory: "Infection", testName: "Urine Microscopy for Casts" },
  { category: "Renal/Urine", subCategory: "Drugs", testName: "Urine Drug Screen (Basic)" },
  { category: "Renal/Urine", subCategory: "Drugs", testName: "Urine Drug Screen (Expanded)" },
  { category: "Renal/Urine", subCategory: "Special", testName: "Bence Jones Protein (Urine)" },
  { category: "Renal/Urine", subCategory: "Special", testName: "Creatinine Clearance (24-hour)" },

  // Liver/GI
  { category: "Liver/GI", subCategory: "Function", testName: "Liver Function Test Panel (LFT)" },
  { category: "Liver/GI", subCategory: "Function", testName: "Serum Bile Acids" },
  { category: "Liver/GI", subCategory: "Function", testName: "Prothrombin Time (Liver-related)" },
  { category: "Liver/GI", subCategory: "Autoimmune", testName: "Autoimmune Hepatitis Panel" },
  { category: "Liver/GI", subCategory: "Viral", testName: "Hepatitis Screening Panel" },
  { category: "Liver/GI", subCategory: "Pancreas", testName: "Pancreatic Enzyme Panel" },
  { category: "Liver/GI", subCategory: "Malabsorption", testName: "Faecal Elastase" },
  { category: "Liver/GI", subCategory: "Malabsorption", testName: "Faecal Fat Quantitation" },
  { category: "Liver/GI", subCategory: "Malabsorption", testName: "Coeliac Serology (Anti-tTG)" },
  { category: "Liver/GI", subCategory: "Malabsorption", testName: "Endomysial Antibody" },

  // Vitamins/Trace Elements
  { category: "Vitamins/Trace Elements", subCategory: "Vitamins", testName: "Vitamin D (25-OH)" },
  { category: "Vitamins/Trace Elements", subCategory: "Vitamins", testName: "Vitamin B12" },
  { category: "Vitamins/Trace Elements", subCategory: "Vitamins", testName: "Folate (Serum)" },
  { category: "Vitamins/Trace Elements", subCategory: "Vitamins", testName: "Red Cell Folate" },
  { category: "Vitamins/Trace Elements", subCategory: "Vitamins", testName: "Vitamin B1 (Thiamine)" },
  { category: "Vitamins/Trace Elements", subCategory: "Vitamins", testName: "Vitamin B6 (Pyridoxine)" },
  { category: "Vitamins/Trace Elements", subCategory: "Trace Elements", testName: "Serum Zinc" },
  { category: "Vitamins/Trace Elements", subCategory: "Trace Elements", testName: "Serum Copper" },
  { category: "Vitamins/Trace Elements", subCategory: "Trace Elements", testName: "Serum Selenium" },
  { category: "Vitamins/Trace Elements", subCategory: "Trace Elements", testName: "Serum Iodine" },

  // Reproductive/Fertility
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "Anti-Müllerian Hormone (AMH)" },
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "Day 2 FSH" },
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "Day 2 LH" },
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "Day 2 Oestradiol" },
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "Mid-Luteal Progesterone" },
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "Prolactin" },
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "Androstenedione" },
  { category: "Reproductive/Fertility", subCategory: "Female", testName: "DHEA-S" },
  { category: "Reproductive/Fertility", subCategory: "Male", testName: "Semen Analysis (Basic)" },
  { category: "Reproductive/Fertility", subCategory: "Male", testName: "Semen Morphology (Kruger)" },
  { category: "Reproductive/Fertility", subCategory: "Male", testName: "Total Testosterone (Male Fertility)" },
  { category: "Reproductive/Fertility", subCategory: "PCOS", testName: "PCOS Hormonal Panel" },
  { category: "Reproductive/Fertility", subCategory: "Assisted Conception", testName: "IVF Baseline Hormonal Panel" },

  // Pregnancy/Antenatal
  { category: "Pregnancy/Antenatal", subCategory: "Screening", testName: "Serum hCG (Qualitative)" },
  { category: "Pregnancy/Antenatal", subCategory: "Screening", testName: "Serum hCG (Quantitative)" },
  { category: "Pregnancy/Antenatal", subCategory: "Screening", testName: "Urine Pregnancy Test" },
  { category: "Pregnancy/Antenatal", subCategory: "Infection", testName: "Antenatal Infection Screen (HIV/Hep B/Hep C/Syphilis)" },
  { category: "Pregnancy/Antenatal", subCategory: "Immunity", testName: "Rubella IgG (Antenatal)" },
  { category: "Pregnancy/Antenatal", subCategory: "Blood Grouping", testName: "Maternal ABO and Rh Group" },
  { category: "Pregnancy/Antenatal", subCategory: "Blood Grouping", testName: "Antibody Screen (Indirect Coombs)" },
  { category: "Pregnancy/Antenatal", subCategory: "Diabetes", testName: "Gestational Diabetes OGTT" },
  { category: "Pregnancy/Antenatal", subCategory: "Foetal", testName: "Non-Invasive Prenatal Testing (NIPT)" },
  { category: "Pregnancy/Antenatal", subCategory: "Foetal", testName: "First Trimester Combined Screening" },

  // Oncology/Tumour Markers
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Alpha-Fetoprotein (AFP)" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Carcinoembryonic Antigen (CEA)" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Cancer Antigen 125 (CA-125)" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Cancer Antigen 19-9 (CA 19-9)" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Cancer Antigen 15-3 (CA 15-3)" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Prostate Specific Antigen (Total PSA)" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Free PSA" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Calcitonin (Medullary Thyroid Ca)" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Thyroglobulin" },
  { category: "Oncology/Tumour Markers", subCategory: "General", testName: "Beta-2 Microglobulin (Oncology)" },

  // Toxicology/Drugs
  { category: "Toxicology/Drugs", subCategory: "Therapeutic", testName: "Serum Paracetamol Level" },
  { category: "Toxicology/Drugs", subCategory: "Therapeutic", testName: "Serum Salicylate Level" },
  { category: "Toxicology/Drugs", subCategory: "Therapeutic", testName: "Serum Digoxin Level" },
  { category: "Toxicology/Drugs", subCategory: "Therapeutic", testName: "Serum Lithium Level" },
  { category: "Toxicology/Drugs", subCategory: "Therapeutic", testName: "Serum Valproate Level" },
  { category: "Toxicology/Drugs", subCategory: "Therapeutic", testName: "Serum Phenytoin Level" },
  { category: "Toxicology/Drugs", subCategory: "Abuse", testName: "Urine Cannabis Screen" },
  { category: "Toxicology/Drugs", subCategory: "Abuse", testName: "Urine Opiate Screen" },
  { category: "Toxicology/Drugs", subCategory: "Abuse", testName: "Urine Cocaine Screen" },
  { category: "Toxicology/Drugs", subCategory: "Abuse", testName: "Urine Amphetamine Screen" },

  // Respiratory
  { category: "Respiratory", subCategory: "Pulmonary Function", testName: "Spirometry (FEV1/FVC)" },
  { category: "Respiratory", subCategory: "Pulmonary Function", testName: "Full Lung Function Test" },
  { category: "Respiratory", subCategory: "Gas Exchange", testName: "Arterial Blood Gas (ABG)" },
  { category: "Respiratory", subCategory: "Gas Exchange", testName: "Capillary Blood Gas" },
  { category: "Respiratory", subCategory: "Allergy", testName: "Allergen Skin Prick Test Panel" },
  { category: "Respiratory", subCategory: "Infection", testName: "Sputum Culture" },
  { category: "Respiratory", subCategory: "Infection", testName: "COVID-19 PCR" },
  { category: "Respiratory", subCategory: "Imaging", testName: "Chest X-ray" },
  { category: "Respiratory", subCategory: "Imaging", testName: "CT Pulmonary Angiogram (CTPA)" },
  { category: "Respiratory", subCategory: "Sleep", testName: "Overnight Oximetry Study" },

  // Neurology/CSF
  { category: "Neurology/CSF", subCategory: "CSF", testName: "CSF Cell Count and Differential" },
  { category: "Neurology/CSF", subCategory: "CSF", testName: "CSF Protein" },
  { category: "Neurology/CSF", subCategory: "CSF", testName: "CSF Glucose" },
  { category: "Neurology/CSF", subCategory: "CSF", testName: "CSF Culture" },
  { category: "Neurology/CSF", subCategory: "Infection", testName: "CSF Viral PCR Panel" },
  { category: "Neurology/CSF", subCategory: "Inflammation", testName: "CSF Oligoclonal Bands" },
  { category: "Neurology/CSF", subCategory: "Inflammation", testName: "CSF IgG Index" },
  { category: "Neurology/CSF", subCategory: "Autoimmune", testName: "Anti-NMDA Receptor Antibody" },
  { category: "Neurology/CSF", subCategory: "Autoimmune", testName: "Paraneoplastic Antibody Panel" },
  { category: "Neurology/CSF", subCategory: "Infection", testName: "CSF Cryptococcal Antigen" },

  // Bone/Mineral
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Serum Calcium" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Serum Phosphate" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Bone Alkaline Phosphatase" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Serum PTH" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "25-OH Vitamin D" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Osteoporosis Risk Panel" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "DEXA Scan (Bone Density)" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Serum Magnesium" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Serum Albumin (for corrected Ca)" },
  { category: "Bone/Mineral", subCategory: "Bone", testName: "Urine Calcium Excretion" },

  // ========================================
  // CARDIOLOGY
  // ========================================
  // Cardiology - ECG
  { category: "Cardiology", subCategory: "ECG", testName: "Resting 12-lead ECG" },
  { category: "Cardiology", subCategory: "ECG", testName: "Exercise/Stress ECG" },
  { category: "Cardiology", subCategory: "ECG", testName: "Holter Monitor 24h" },
  { category: "Cardiology", subCategory: "ECG", testName: "Holter Monitor 48h" },
  { category: "Cardiology", subCategory: "ECG", testName: "Event Recorder" },
  
  // Cardiology - Echo
  { category: "Cardiology", subCategory: "Echo", testName: "Transthoracic Echocardiogram" },
  { category: "Cardiology", subCategory: "Echo", testName: "Transesophageal Echocardiogram" },
  { category: "Cardiology", subCategory: "Echo", testName: "Stress Echocardiogram" },
  
  // Cardiology - Vascular
  { category: "Cardiology", subCategory: "Vascular", testName: "Carotid Doppler Ultrasound" },
  { category: "Cardiology", subCategory: "Vascular", testName: "Ankle-Brachial Index (ABI)" },
  { category: "Cardiology", subCategory: "Vascular", testName: "Aortic Aneurysm Ultrasound" },
  { category: "Cardiology", subCategory: "Vascular", testName: "Lower Limb Venous Duplex" },
  { category: "Cardiology", subCategory: "Vascular", testName: "Renal Artery Doppler" },
  
  // Cardiology - Blood Tests
  { category: "Cardiology", subCategory: "Blood Tests", testName: "Lipoprotein Fractionation" },
  { category: "Cardiology", subCategory: "Blood Tests", testName: "High-sensitivity CRP (hs-CRP)" },
  { category: "Cardiology", subCategory: "Blood Tests", testName: "NT-proBNP" },
  { category: "Cardiology", subCategory: "Blood Tests", testName: "BNP" },
  { category: "Cardiology", subCategory: "Blood Tests", testName: "Troponin T (high sensitivity)" },
  { category: "Cardiology", subCategory: "Blood Tests", testName: "Troponin I (high sensitivity)" },
  
  // Cardiology - Stress Tests
  { category: "Cardiology", subCategory: "Stress Tests", testName: "Nuclear Stress Test (SPECT)" },
  { category: "Cardiology", subCategory: "Stress Tests", testName: "Stress MRI" },
  { category: "Cardiology", subCategory: "Stress Tests", testName: "Stress PET" },
  
  // Cardiology - Imaging
  { category: "Cardiology", subCategory: "Imaging", testName: "Cardiac MRI" },
  { category: "Cardiology", subCategory: "Imaging", testName: "Cardiac CT Angiography" },
  { category: "Cardiology", subCategory: "Imaging", testName: "Calcium Score CT" },
  
  // Cardiology - Invasive
  { category: "Cardiology", subCategory: "Invasive", testName: "Coronary Angiography" },
  { category: "Cardiology", subCategory: "Invasive", testName: "Right Heart Catheterisation" },
  { category: "Cardiology", subCategory: "Invasive", testName: "Electrophysiology Study" },

  // ========================================
  // PULMONOLOGY
  // ========================================
  // Pulmonology - Tests
  { category: "Pulmonology", subCategory: "Tests", testName: "Spirometry (Basic)" },
  { category: "Pulmonology", subCategory: "Tests", testName: "Full Pulmonary Function Test (PFT)" },
  { category: "Pulmonology", subCategory: "Tests", testName: "DLCO" },
  { category: "Pulmonology", subCategory: "Tests", testName: "Bronchial Challenge Test" },
  { category: "Pulmonology", subCategory: "Tests", testName: "Peak Expiratory Flow (PEF)" },
  
  // Pulmonology - Gas Exchange
  { category: "Pulmonology", subCategory: "Gas Exchange", testName: "Arterial Blood Gas (ABG)" },
  { category: "Pulmonology", subCategory: "Gas Exchange", testName: "Capillary Blood Gas" },
  
  // Pulmonology - Imaging
  { category: "Pulmonology", subCategory: "Imaging", testName: "Chest X-ray (PA/Lateral)" },
  { category: "Pulmonology", subCategory: "Imaging", testName: "High-Resolution CT Chest (HRCT)" },
  { category: "Pulmonology", subCategory: "Imaging", testName: "CT Pulmonary Angiogram (CTPA)" },
  
  // Pulmonology - Sleep
  { category: "Pulmonology", subCategory: "Sleep", testName: "Home Sleep Study" },
  { category: "Pulmonology", subCategory: "Sleep", testName: "Overnight Oximetry" },
  { category: "Pulmonology", subCategory: "Sleep", testName: "In-lab Polysomnography" },
  
  // Pulmonology - Allergy
  { category: "Pulmonology", subCategory: "Allergy", testName: "Allergen Inhalant Panel (RAST)" },
  
  // Pulmonology - Infection
  { category: "Pulmonology", subCategory: "Infection", testName: "Sputum AFB Smear" },
  { category: "Pulmonology", subCategory: "Infection", testName: "Sputum GeneXpert MTB/RIF" },
  { category: "Pulmonology", subCategory: "Infection", testName: "Sputum Cytology" },
  { category: "Pulmonology", subCategory: "Infection", testName: "Sputum Culture" },
  { category: "Pulmonology", subCategory: "Infection", testName: "Pneumococcal Urinary Antigen" },
  { category: "Pulmonology", subCategory: "Infection", testName: "Legionella Urinary Antigen" },

  // ========================================
  // GASTROENTEROLOGY
  // ========================================
  // Gastroenterology - Enzymes
  { category: "Gastroenterology", subCategory: "Enzymes", testName: "Amylase" },
  { category: "Gastroenterology", subCategory: "Enzymes", testName: "Lipase" },
  
  // Gastroenterology - LFT Panel
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "ALT" },
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "AST" },
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "ALP" },
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "GGT" },
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "Albumin" },
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "Bilirubin Total" },
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "Bilirubin Direct" },
  { category: "Gastroenterology", subCategory: "LFT Panel", testName: "Bilirubin Indirect" },
  
  // Gastroenterology - Coeliac
  { category: "Gastroenterology", subCategory: "Coeliac", testName: "Anti-tTG IgA" },
  { category: "Gastroenterology", subCategory: "Coeliac", testName: "Anti-tTG IgG" },
  { category: "Gastroenterology", subCategory: "Coeliac", testName: "Endomysial Antibodies (EMA)" },
  { category: "Gastroenterology", subCategory: "Coeliac", testName: "Deamidated Gliadin Peptide (DGP)" },
  
  // Gastroenterology - Bowel Inflammation
  { category: "Gastroenterology", subCategory: "Bowel Inflammation", testName: "Faecal Calprotectin" },
  { category: "Gastroenterology", subCategory: "Bowel Inflammation", testName: "Faecal Lactoferrin" },
  
  // Gastroenterology - Pancreas
  { category: "Gastroenterology", subCategory: "Pancreas", testName: "Faecal Elastase" },
  { category: "Gastroenterology", subCategory: "Pancreas", testName: "Secretin Stimulation Test" },
  
  // Gastroenterology - Ulcers
  { category: "Gastroenterology", subCategory: "Ulcers", testName: "H. Pylori Breath Test" },
  { category: "Gastroenterology", subCategory: "Ulcers", testName: "H. Pylori Stool Antigen" },
  { category: "Gastroenterology", subCategory: "Ulcers", testName: "H. Pylori IgG Serum" },
  
  // Gastroenterology - Bile
  { category: "Gastroenterology", subCategory: "Bile", testName: "Bile Acids" },
  { category: "Gastroenterology", subCategory: "Bile", testName: "Serum Ammonia" },
  
  // Gastroenterology - Malabsorption
  { category: "Gastroenterology", subCategory: "Malabsorption", testName: "72-hour Faecal Fat" },
  { category: "Gastroenterology", subCategory: "Malabsorption", testName: "Schilling Test" },
  
  // Gastroenterology - Liver Fibrosis
  { category: "Gastroenterology", subCategory: "Liver Fibrosis", testName: "FibroScan" },
  { category: "Gastroenterology", subCategory: "Liver Fibrosis", testName: "FibroTest" },
  { category: "Gastroenterology", subCategory: "Liver Fibrosis", testName: "NAFLD Score" },
  
  // Gastroenterology - Imaging
  { category: "Gastroenterology", subCategory: "Imaging", testName: "Abdominal Ultrasound" },
  { category: "Gastroenterology", subCategory: "Imaging", testName: "CT Abdomen/Pelvis" },
  { category: "Gastroenterology", subCategory: "Imaging", testName: "MRI Abdomen" },
  { category: "Gastroenterology", subCategory: "Imaging", testName: "ERCP" },
  { category: "Gastroenterology", subCategory: "Imaging", testName: "MRCP" },
  
  // Gastroenterology - Endoscopy
  { category: "Gastroenterology", subCategory: "Endoscopy", testName: "OGD (Upper GI Endoscopy)" },
  { category: "Gastroenterology", subCategory: "Endoscopy", testName: "Colonoscopy" },
  { category: "Gastroenterology", subCategory: "Endoscopy", testName: "Flexible Sigmoidoscopy" },

  // ========================================
  // HEPATOLOGY
  // ========================================
  // Hepatology - Viral
  { category: "Hepatology", subCategory: "Viral", testName: "Hepatitis B Quant DNA" },
  { category: "Hepatology", subCategory: "Viral", testName: "Hepatitis C RNA Quant" },
  { category: "Hepatology", subCategory: "Viral", testName: "Hepatitis A IgM" },
  { category: "Hepatology", subCategory: "Viral", testName: "Hepatitis E IgM" },
  
  // Hepatology - Autoimmune
  { category: "Hepatology", subCategory: "Autoimmune", testName: "AMA" },
  { category: "Hepatology", subCategory: "Autoimmune", testName: "ASMA" },
  { category: "Hepatology", subCategory: "Autoimmune", testName: "LKM Antibody" },
  { category: "Hepatology", subCategory: "Autoimmune", testName: "ANA (Hepatic)" },
  
  // Hepatology - Fibrosis
  { category: "Hepatology", subCategory: "Fibrosis", testName: "Fibrosis-4 Score (FIB-4)" },
  { category: "Hepatology", subCategory: "Fibrosis", testName: "APRI Score" },
  
  // Hepatology - Enzymes
  { category: "Hepatology", subCategory: "Enzymes", testName: "GGT" },
  { category: "Hepatology", subCategory: "Enzymes", testName: "ALP" },
  
  // Hepatology - Synthetic
  { category: "Hepatology", subCategory: "Synthetic", testName: "Albumin" },
  { category: "Hepatology", subCategory: "Synthetic", testName: "PT/INR" },
  
  // Hepatology - Metabolic
  { category: "Hepatology", subCategory: "Metabolic", testName: "Ceruloplasmin" },
  { category: "Hepatology", subCategory: "Metabolic", testName: "Serum Copper" },
  { category: "Hepatology", subCategory: "Metabolic", testName: "Alpha-1 Antitrypsin" },
  
  // Hepatology - Cancer
  { category: "Hepatology", subCategory: "Cancer", testName: "AFP" },
  
  // Hepatology - Imaging
  { category: "Hepatology", subCategory: "Imaging", testName: "Liver Elastography" },
  { category: "Hepatology", subCategory: "Imaging", testName: "Triphasic Liver CT" },

  // ========================================
  // ENDOCRINOLOGY - ADVANCED
  // ========================================
  // Endocrinology-Advanced - Adrenal
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "11-Deoxycortisol" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Catecholamines Plasma" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Catecholamines Urine" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Vanillylmandelic Acid (VMA)" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Metanephrines Plasma" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Metanephrines Urine" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Aldosterone" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Renin Activity" },
  { category: "Endocrinology-Advanced", subCategory: "Adrenal", testName: "Aldosterone/Renin Ratio" },
  
  // Endocrinology-Advanced - Thyroid
  { category: "Endocrinology-Advanced", subCategory: "Thyroid", testName: "Reverse T3" },
  { category: "Endocrinology-Advanced", subCategory: "Thyroid", testName: "TSH-Receptor Antibodies" },
  
  // Endocrinology-Advanced - Gonadal
  { category: "Endocrinology-Advanced", subCategory: "Gonadal", testName: "SHBG" },
  { category: "Endocrinology-Advanced", subCategory: "Gonadal", testName: "DHT (Dihydrotestosterone)" },
  { category: "Endocrinology-Advanced", subCategory: "Gonadal", testName: "17-Hydroxyprogesterone" },
  
  // Endocrinology-Advanced - Metabolic
  { category: "Endocrinology-Advanced", subCategory: "Metabolic", testName: "Leptin" },
  { category: "Endocrinology-Advanced", subCategory: "Metabolic", testName: "Adiponectin" },
  { category: "Endocrinology-Advanced", subCategory: "Metabolic", testName: "Insulin Autoantibodies" },
  
  // Endocrinology-Advanced - Pituitary
  { category: "Endocrinology-Advanced", subCategory: "Pituitary", testName: "Prolactin Dilution Study" },
  { category: "Endocrinology-Advanced", subCategory: "Pituitary", testName: "ACTH Stimulation Test" },
  { category: "Endocrinology-Advanced", subCategory: "Pituitary", testName: "Cosyntropin Test" },
  
  // Endocrinology-Advanced - Calcium
  { category: "Endocrinology-Advanced", subCategory: "Calcium", testName: "PTH-related Peptide (PTHrP)" },
  
  // Endocrinology-Advanced - Bone
  { category: "Endocrinology-Advanced", subCategory: "Bone", testName: "CTX (C-terminal telopeptide)" },
  { category: "Endocrinology-Advanced", subCategory: "Bone", testName: "P1NP (Procollagen type 1 N-terminal)" },
  { category: "Endocrinology-Advanced", subCategory: "Bone", testName: "Osteocalcin" },

  // ========================================
  // ORTHOPAEDICS & RHEUMATOLOGY
  // ========================================
  // Orthopaedics & Rheumatology - Inflammation
  { category: "Orthopaedics & Rheumatology", subCategory: "Inflammation", testName: "ESR" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Inflammation", testName: "CRP" },
  
  // Orthopaedics & Rheumatology - Autoimmune
  { category: "Orthopaedics & Rheumatology", subCategory: "Autoimmune", testName: "ANA" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Autoimmune", testName: "Anti-CCP" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Autoimmune", testName: "ENA Panel" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Autoimmune", testName: "ANCA" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Autoimmune", testName: "RF" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Autoimmune", testName: "HLA-B27" },
  
  // Orthopaedics & Rheumatology - Markers
  { category: "Orthopaedics & Rheumatology", subCategory: "Markers", testName: "Uric Acid" },
  
  // Orthopaedics & Rheumatology - Bone
  { category: "Orthopaedics & Rheumatology", subCategory: "Bone", testName: "Vitamin D" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Bone", testName: "X-ray (Joint)" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Bone", testName: "DEXA Scan" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Bone", testName: "MRI Joint" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Bone", testName: "Joint Aspiration Microscopy" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Bone", testName: "Joint Aspiration Culture" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Bone", testName: "Joint Aspiration Crystals (Gout/Pseudogout)" },
  
  // Orthopaedics & Rheumatology - Muscle
  { category: "Orthopaedics & Rheumatology", subCategory: "Muscle", testName: "CK" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Muscle", testName: "Aldolase" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Muscle", testName: "EMG" },
  { category: "Orthopaedics & Rheumatology", subCategory: "Muscle", testName: "Nerve Conduction Studies" },
];

// Generate a code from test name
function generateTestCode(testName: string): string {
  // Remove common words and parentheses content
  const cleaned = testName
    .replace(/\([^)]*\)/g, '') // Remove parentheses and content
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .trim()
    .toUpperCase();
  
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  
  if (words.length === 1) {
    return words[0].substring(0, 6);
  } else if (words.length === 2) {
    return words[0].substring(0, 3) + words[1].substring(0, 3);
  } else {
    return words.slice(0, 4).map(w => w[0]).join('') + words[words.length - 1].substring(0, 2);
  }
}

// Get sample type based on category
function getSampleType(category: string, subCategory: string, testName: string): string {
  const lowerName = testName.toLowerCase();
  const lowerCat = category.toLowerCase();
  const lowerSub = subCategory.toLowerCase();

  // Urine samples
  if (lowerName.includes('urine') || lowerCat.includes('urine')) return 'Urine';
  if (lowerName.includes('urinary antigen')) return 'Urine';
  
  // Stool samples
  if (lowerName.includes('stool') || lowerName.includes('faec')) return 'Stool';
  if (lowerName.includes('h. pylori stool')) return 'Stool';
  
  // CSF samples
  if (lowerName.includes('csf') || lowerCat.includes('csf')) return 'CSF';
  
  // Sputum samples
  if (lowerName.includes('sputum')) return 'Sputum';
  
  // Swab samples
  if (lowerName.includes('swab')) return 'Swab';
  
  // Semen samples
  if (lowerName.includes('semen')) return 'Semen';
  
  // Joint aspiration
  if (lowerName.includes('joint aspiration') || lowerName.includes('synovial')) return 'Synovial Fluid';
  
  // Breath tests
  if (lowerName.includes('breath test')) return 'Breath';
  
  // Imaging and procedures - no sample required
  if (lowerSub.includes('imaging')) return 'N/A (Imaging)';
  if (lowerSub.includes('invasive')) return 'N/A (Procedure)';
  if (lowerSub.includes('endoscopy')) return 'N/A (Procedure)';
  if (lowerSub.includes('echo')) return 'N/A (Imaging)';
  if (lowerSub.includes('ecg')) return 'N/A (Procedure)';
  if (lowerSub.includes('vascular')) return 'N/A (Imaging)';
  if (lowerSub.includes('stress test')) return 'N/A (Procedure)';
  if (lowerSub.includes('pulmonary function') || lowerSub.includes('tests')) {
    if (lowerCat.includes('pulmonology') && !lowerName.includes('blood')) return 'N/A (Procedure)';
  }
  if (lowerSub.includes('sleep')) return 'N/A (Study)';
  if (lowerSub.includes('liver fibrosis') && lowerName.includes('fibroscan')) return 'N/A (Imaging)';
  
  // Bone imaging
  if (lowerName.includes('x-ray') || lowerName.includes('xray')) return 'N/A (Imaging)';
  if (lowerName.includes('dexa')) return 'N/A (Imaging)';
  if (lowerName.includes('mri')) return 'N/A (Imaging)';
  if (lowerName.includes('ct ')) return 'N/A (Imaging)';
  if (lowerName.includes('ultrasound')) return 'N/A (Imaging)';
  
  // EMG and nerve studies
  if (lowerName.includes('emg') || lowerName.includes('nerve conduction')) return 'N/A (Procedure)';
  
  // ABG/CBG
  if (lowerName.includes('arterial blood gas') || lowerName.includes('abg')) return 'Arterial Blood';
  if (lowerName.includes('capillary blood gas')) return 'Capillary Blood';
  
  // Default to blood
  return 'Blood';
}

export async function seedComprehensiveLabTests() {
  console.log('🧪 Starting comprehensive lab test catalog seeding...');

  try {
    // Get or create departments
    const existingDepts = await db.select().from(labDepartments);
    
    // Map categories to department IDs
    const categoryToDeptMap: Record<string, number> = {};
    
    // Create departments for each unique category if they don't exist
    const uniqueCategories = [...new Set(labTestCatalog.map(t => t.category))];
    
    for (const category of uniqueCategories) {
      const existingDept = existingDepts.find(d => 
        d.name.toLowerCase() === category.toLowerCase() ||
        d.name.toLowerCase().includes(category.toLowerCase().split('/')[0])
      );
      
      if (existingDept) {
        categoryToDeptMap[category] = existingDept.id;
      } else {
        // Create new department
        const code = category.replace(/[^a-zA-Z]/g, '').substring(0, 5).toUpperCase();
        const [newDept] = await db.insert(labDepartments).values({
          name: category,
          code: code,
          description: `${category} laboratory tests`,
          isActive: true
        }).returning();
        categoryToDeptMap[category] = newDept.id;
        console.log(`  ✅ Created department: ${category}`);
      }
    }

    // Check existing tests to avoid duplicates
    const existingTests = await db.select({ name: labTests.name }).from(labTests);
    const existingTestNames = new Set(existingTests.map(t => t.name.toLowerCase()));

    // Prepare new tests
    const newTests = labTestCatalog.filter(t => !existingTestNames.has(t.testName.toLowerCase()));

    if (newTests.length === 0) {
      console.log('  ℹ️  All tests already exist in the catalog');
      return { added: 0, skipped: labTestCatalog.length };
    }

    // Insert tests in batches
    const batchSize = 50;
    let insertedCount = 0;

    for (let i = 0; i < newTests.length; i += batchSize) {
      const batch = newTests.slice(i, i + batchSize);
      
      const testValues = batch.map(t => ({
        name: t.testName,
        code: generateTestCode(t.testName),
        category: t.category,
        description: `${t.subCategory} - ${t.testName}`,
        sampleType: getSampleType(t.category, t.subCategory, t.testName),
        departmentId: categoryToDeptMap[t.category],
        isActive: true,
        priority: 'routine' as const,
        estimatedTime: '24-48 hours'
      }));

      await db.insert(labTests).values(testValues);
      insertedCount += batch.length;
      console.log(`  📊 Inserted ${insertedCount}/${newTests.length} tests...`);
    }

    console.log(`\n✨ Lab test catalog seeding complete!`);
    console.log(`   ✅ Added: ${insertedCount} new tests`);
    console.log(`   ⏭️  Skipped: ${labTestCatalog.length - insertedCount} existing tests`);
    console.log(`   📁 Total categories: ${uniqueCategories.length}`);

    return { added: insertedCount, skipped: labTestCatalog.length - insertedCount };
  } catch (error) {
    console.error('❌ Error seeding lab test catalog:', error);
    throw error;
  }
}

// Run if called directly (ESM compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedComprehensiveLabTests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

