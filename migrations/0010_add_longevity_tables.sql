-- Migration: Add Longevity Assessment Tables
-- Evidence-based data points for comprehensive health & longevity tracking

-- =====================
-- LIFESTYLE ASSESSMENTS
-- Exercise, Sleep, Smoking, Alcohol, Diet
-- =====================
CREATE TABLE IF NOT EXISTS lifestyle_assessments (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  organization_id INTEGER REFERENCES organizations(id),
  
  -- Exercise & Physical Activity
  exercise_frequency VARCHAR(50), -- none, 1-2x/week, 3-4x/week, 5+/week
  exercise_type VARCHAR(100), -- cardio, strength, mixed, flexibility
  exercise_duration_minutes INTEGER, -- average per session
  daily_steps INTEGER, -- average daily steps
  vo2_max_estimate DECIMAL(5,2), -- ml/kg/min
  
  -- Sleep Quality
  sleep_duration_hours DECIMAL(3,1), -- average hours
  sleep_quality VARCHAR(50), -- poor, fair, good, excellent
  sleep_latency_minutes INTEGER, -- time to fall asleep
  sleep_disturbances INTEGER, -- times waking per night
  using_sleep_aids BOOLEAN DEFAULT FALSE,
  
  -- Smoking Status
  smoking_status VARCHAR(50), -- never, former, current
  cigarettes_per_day INTEGER,
  years_smoked INTEGER,
  years_since_quit INTEGER,
  pack_years DECIMAL(5,2), -- calculated: (cigs/day * years) / 20
  
  -- Alcohol Consumption
  alcohol_status VARCHAR(50), -- none, occasional, moderate, heavy
  drinks_per_week INTEGER,
  binge_episodes_per_month INTEGER,
  
  -- Diet & Nutrition
  diet_type VARCHAR(100), -- omnivore, vegetarian, vegan, mediterranean, keto
  vegetable_servings_per_day INTEGER,
  fruit_servings_per_day INTEGER,
  processed_food_frequency VARCHAR(50), -- rarely, sometimes, often, daily
  sugar_intake VARCHAR(50), -- low, moderate, high
  water_intake_liters DECIMAL(3,1),
  caffeine_intake_mg INTEGER,
  
  -- Fasting & Meal Patterns
  intermittent_fasting BOOLEAN DEFAULT FALSE,
  fasting_window_hours INTEGER,
  meals_per_day INTEGER,
  
  -- Supplements
  taking_supplements BOOLEAN DEFAULT FALSE,
  supplements_list TEXT, -- JSON array of supplements
  
  -- Assessment metadata
  assessment_date TIMESTAMP DEFAULT NOW() NOT NULL,
  assessed_by VARCHAR(100),
  notes TEXT
);

CREATE INDEX idx_lifestyle_patient ON lifestyle_assessments(patient_id);
CREATE INDEX idx_lifestyle_org ON lifestyle_assessments(organization_id);
CREATE INDEX idx_lifestyle_date ON lifestyle_assessments(assessment_date);

-- =====================
-- BODY COMPOSITION
-- Detailed body measurements beyond basic vitals
-- =====================
CREATE TABLE IF NOT EXISTS body_composition (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  organization_id INTEGER REFERENCES organizations(id),
  
  -- Core Measurements
  weight DECIMAL(5,2), -- kg
  height DECIMAL(5,2), -- cm
  bmi DECIMAL(4,1), -- calculated
  
  -- Body Composition
  body_fat_percentage DECIMAL(4,1),
  visceral_fat_level INTEGER, -- 1-59 scale
  muscle_mass_kg DECIMAL(5,2),
  bone_mass_kg DECIMAL(4,2),
  water_percentage DECIMAL(4,1),
  metabolic_age INTEGER,
  basal_metabolic_rate INTEGER, -- calories/day
  
  -- Circumference Measurements
  waist_circumference_cm DECIMAL(5,1),
  hip_circumference_cm DECIMAL(5,1),
  waist_to_hip_ratio DECIMAL(3,2),
  neck_circumference_cm DECIMAL(4,1),
  
  -- Fitness Metrics
  grip_strength_kg DECIMAL(4,1), -- dominant hand
  sit_to_stand_seconds DECIMAL(4,1), -- 5 reps
  balance_test_seconds INTEGER, -- single leg stand
  flexibility_reach_cm DECIMAL(4,1), -- sit-and-reach
  
  -- Measurement metadata
  measurement_method VARCHAR(100), -- DEXA, BIA, skinfold, etc.
  measured_at TIMESTAMP DEFAULT NOW() NOT NULL,
  measured_by VARCHAR(100),
  notes TEXT
);

CREATE INDEX idx_body_comp_patient ON body_composition(patient_id);
CREATE INDEX idx_body_comp_org ON body_composition(organization_id);
CREATE INDEX idx_body_comp_date ON body_composition(measured_at);

-- =====================
-- MENTAL HEALTH SCREENINGS
-- Depression, Anxiety, Stress, Cognition
-- =====================
CREATE TABLE IF NOT EXISTS mental_health_screenings (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  organization_id INTEGER REFERENCES organizations(id),
  
  -- Depression Screening (PHQ-9)
  phq9_score INTEGER, -- 0-27
  phq9_severity VARCHAR(50), -- minimal, mild, moderate, moderately_severe, severe
  phq9_responses TEXT, -- JSON array of 9 responses (0-3 each)
  
  -- Anxiety Screening (GAD-7)
  gad7_score INTEGER, -- 0-21
  gad7_severity VARCHAR(50), -- minimal, mild, moderate, severe
  gad7_responses TEXT, -- JSON array of 7 responses (0-3 each)
  
  -- Perceived Stress Scale (PSS-10)
  pss_score INTEGER, -- 0-40
  pss_category VARCHAR(50), -- low, moderate, high
  
  -- Sleep & Fatigue
  insomnia_score INTEGER, -- ISI 0-28
  fatigue_score INTEGER, -- FSS 9-63
  
  -- Cognitive Assessment
  cognitive_screen_type VARCHAR(50), -- MMSE, MoCA, Mini-Cog
  cognitive_score INTEGER,
  cognitive_max_score INTEGER,
  memory_complaint BOOLEAN DEFAULT FALSE,
  
  -- Wellbeing & Life Satisfaction
  wellbeing_score INTEGER, -- WHO-5 0-25
  life_satisfaction_score INTEGER, -- 1-10
  purpose_score INTEGER, -- 1-10
  
  -- Resilience & Coping
  resilience_score INTEGER, -- Brief Resilience Scale
  coping_style VARCHAR(100), -- adaptive, maladaptive, mixed
  
  -- Risk Factors
  suicidal_ideation BOOLEAN DEFAULT FALSE,
  substance_use_risk VARCHAR(50), -- none, low, moderate, high
  social_isolation_risk VARCHAR(50), -- none, low, moderate, high
  
  -- Screening metadata
  screening_date TIMESTAMP DEFAULT NOW() NOT NULL,
  screened_by VARCHAR(100),
  referral_made BOOLEAN DEFAULT FALSE,
  notes TEXT
);

CREATE INDEX idx_mental_health_patient ON mental_health_screenings(patient_id);
CREATE INDEX idx_mental_health_org ON mental_health_screenings(organization_id);
CREATE INDEX idx_mental_health_date ON mental_health_screenings(screening_date);

-- =====================
-- SOCIAL DETERMINANTS OF HEALTH
-- Social factors affecting longevity
-- =====================
CREATE TABLE IF NOT EXISTS social_determinants (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  organization_id INTEGER REFERENCES organizations(id),
  
  -- Social Connections
  marital_status VARCHAR(50), -- single, married, divorced, widowed, partnered
  living_arrangement VARCHAR(100), -- alone, spouse, family, assisted
  close_relationships_count INTEGER, -- close friends/family
  social_interaction_frequency VARCHAR(50), -- daily, weekly, monthly, rarely
  belongs_to_groups BOOLEAN DEFAULT FALSE, -- clubs, religious, community
  loneliness_score INTEGER, -- UCLA Loneliness Scale 3-9
  
  -- Education & Cognitive Engagement
  education_level VARCHAR(100), -- primary, secondary, bachelors, masters, doctorate
  years_of_education INTEGER,
  currently_learning BOOLEAN DEFAULT FALSE, -- taking courses, reading, puzzles
  cognitive_activities TEXT, -- JSON array
  
  -- Employment & Financial
  employment_status VARCHAR(50), -- employed, unemployed, retired, disabled
  occupation_type VARCHAR(100), -- sedentary, active, manual
  financial_stress VARCHAR(50), -- none, low, moderate, high
  has_health_insurance BOOLEAN DEFAULT FALSE,
  
  -- Living Environment
  housing_type VARCHAR(100), -- house, apartment, nursing_home
  housing_stability VARCHAR(50), -- stable, at_risk, unstable
  access_to_healthcare VARCHAR(50), -- easy, moderate, difficult
  access_to_healthy_food VARCHAR(50), -- easy, moderate, difficult
  neighborhood_safety VARCHAR(50), -- safe, somewhat_safe, unsafe
  
  -- Purpose & Meaning
  sense_of_purpose INTEGER, -- 1-10 scale
  life_goals TEXT, -- free text or JSON
  volunteer_work BOOLEAN DEFAULT FALSE,
  religious_or_spiritual BOOLEAN DEFAULT FALSE,
  
  -- Adverse Experiences
  childhood_adverse_experiences INTEGER, -- ACE score 0-10
  recent_major_life_events INTEGER, -- count in past year
  chronic_stressors TEXT, -- JSON array
  
  -- Assessment metadata
  assessment_date TIMESTAMP DEFAULT NOW() NOT NULL,
  assessed_by VARCHAR(100),
  notes TEXT
);

CREATE INDEX idx_social_det_patient ON social_determinants(patient_id);
CREATE INDEX idx_social_det_org ON social_determinants(organization_id);
CREATE INDEX idx_social_det_date ON social_determinants(assessment_date);

-- =====================
-- ADVANCED BIOMARKERS
-- Specialized longevity markers
-- =====================
CREATE TABLE IF NOT EXISTS advanced_biomarkers (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  organization_id INTEGER REFERENCES organizations(id),
  
  -- Hormonal Panel
  tsh_miu_l DECIMAL(6,3), -- Thyroid
  free_t3_pg_ml DECIMAL(5,2),
  free_t4_ng_dl DECIMAL(4,2),
  testosterone_ng_dl DECIMAL(6,1), -- Total testosterone
  free_testosterone_pg_ml DECIMAL(5,2),
  estradiol_pg_ml DECIMAL(6,1),
  dhea_s_ug_dl DECIMAL(6,1), -- DHEA-Sulfate
  cortisol_ug_dl DECIMAL(5,2), -- AM cortisol
  igf1_ng_ml DECIMAL(6,1), -- Insulin-like Growth Factor
  insulin_miu_l DECIMAL(6,2), -- Fasting insulin
  homa_ir DECIMAL(5,2), -- Insulin resistance
  
  -- Cardiovascular Risk Markers
  apo_b_mg_dl DECIMAL(5,1), -- Apolipoprotein B
  lp_a_nmol_l DECIMAL(6,1), -- Lipoprotein(a)
  homocysteine_mmol_l DECIMAL(5,2),
  fibrinogen_mg_dl DECIMAL(6,1),
  d_dimer_ng_ml DECIMAL(6,1),
  bnp_pg_ml DECIMAL(6,1), -- Brain Natriuretic Peptide
  coronary_calcium_score INTEGER, -- Agatston score
  
  -- Inflammatory Markers
  hscrp_mg_l DECIMAL(5,2), -- High-sensitivity CRP
  il6_pg_ml DECIMAL(5,2), -- Interleukin-6
  tnf_alpha_pg_ml DECIMAL(5,2), -- TNF-alpha
  ferritin_ng_ml DECIMAL(6,1),
  
  -- Kidney Function
  cystatin_c_mg_l DECIMAL(4,2),
  uric_acid_mg_dl DECIMAL(4,1),
  microalbumin_mg_l DECIMAL(5,1),
  
  -- Liver Function Extended
  ggt_u_l INTEGER, -- Gamma-glutamyl transferase
  albumin_g_dl DECIMAL(3,1),
  
  -- Nutritional Markers
  vitamin_d_ng_ml DECIMAL(5,1), -- 25-OH Vitamin D
  vitamin_b12_pg_ml DECIMAL(6,1),
  folate_ng_ml DECIMAL(5,1),
  magnesium_mg_dl DECIMAL(3,1),
  zinc_ug_dl DECIMAL(5,1),
  omega3_index DECIMAL(4,1), -- % of fatty acids
  
  -- Epigenetic / Advanced Aging Markers
  telomere_length DECIMAL(6,2), -- T/S ratio or kb
  dna_meth_age DECIMAL(5,1), -- Horvath clock
  pheno_age DECIMAL(5,1), -- Levine PhenoAge
  grim_age DECIMAL(5,1), -- GrimAge clock
  
  -- Test metadata
  test_date TIMESTAMP DEFAULT NOW() NOT NULL,
  lab_name VARCHAR(200),
  notes TEXT
);

CREATE INDEX idx_adv_bio_patient ON advanced_biomarkers(patient_id);
CREATE INDEX idx_adv_bio_org ON advanced_biomarkers(organization_id);
CREATE INDEX idx_adv_bio_date ON advanced_biomarkers(test_date);

-- =====================
-- HEART RATE VARIABILITY
-- Important longevity & autonomic health marker
-- =====================
CREATE TABLE IF NOT EXISTS heart_rate_variability (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id),
  organization_id INTEGER REFERENCES organizations(id),
  
  -- Time Domain Measures
  sdnn_ms DECIMAL(6,2), -- Standard deviation of NN intervals
  rmssd_ms DECIMAL(6,2), -- Root mean square of successive differences
  pnn50_percent DECIMAL(5,2), -- % successive intervals > 50ms
  
  -- Frequency Domain Measures
  lf_power_ms2 DECIMAL(8,2), -- Low frequency power
  hf_power_ms2 DECIMAL(8,2), -- High frequency power
  lf_hf_ratio DECIMAL(5,2), -- LF/HF ratio
  
  -- Recovery & Readiness
  hrv_score INTEGER, -- 1-100 composite score
  readiness_score INTEGER, -- 1-100
  recovery_status VARCHAR(50), -- optimal, adequate, compromised
  
  -- Context
  measurement_context VARCHAR(100), -- morning, post_exercise, sleep
  device_used VARCHAR(100),
  measured_at TIMESTAMP DEFAULT NOW() NOT NULL,
  notes TEXT
);

CREATE INDEX idx_hrv_patient ON heart_rate_variability(patient_id);
CREATE INDEX idx_hrv_org ON heart_rate_variability(organization_id);
CREATE INDEX idx_hrv_date ON heart_rate_variability(measured_at);

-- Add comment documenting the migration
COMMENT ON TABLE lifestyle_assessments IS 'Evidence-based lifestyle factors for longevity assessment - exercise, sleep, smoking, alcohol, diet';
COMMENT ON TABLE body_composition IS 'Detailed body composition metrics including body fat, muscle mass, and fitness measures';
COMMENT ON TABLE mental_health_screenings IS 'Standardized mental health screenings (PHQ-9, GAD-7, etc.) affecting longevity';
COMMENT ON TABLE social_determinants IS 'Social determinants of health impacting longevity - connections, purpose, environment';
COMMENT ON TABLE advanced_biomarkers IS 'Advanced biomarkers for longevity including hormones, inflammation, and epigenetic markers';
COMMENT ON TABLE heart_rate_variability IS 'HRV measurements indicating autonomic health and recovery capacity';

