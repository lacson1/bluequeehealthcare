import { Router } from "express";
import { authenticateToken, type AuthRequest } from "../middleware/auth";
import { medications, labTests, pharmacies } from "@shared/schema";
import { db } from "../db";
import { eq, and, or, ilike, isNotNull, sql } from "drizzle-orm";

const router = Router();

/**
 * Autocomplete and suggestion routes
 * Handles: medicine, medication, diagnosis, symptom, and other autocomplete endpoints
 */
export function setupSuggestionRoutes(): Router {
  
  // Medicine suggestions with fuzzy matching
  router.get("/suggestions/medicines", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const searchQuery = q.toLowerCase().trim();
      
      // Use raw SQL for fuzzy matching with pg_trgm extension
      // Combines exact/partial matches (ILIKE) with typo-tolerant similarity search
      const result = await db.execute(sql`
        SELECT DISTINCT ON (id)
          id, name, generic_name, brand_name, category, dosage_form, 
          strength, dosage_adult, dosage_child, frequency, indications,
          contraindications, side_effects, route_of_administration, cost_per_unit,
          GREATEST(
            SIMILARITY(name, ${searchQuery}),
            COALESCE(SIMILARITY(generic_name, ${searchQuery}), 0),
            COALESCE(SIMILARITY(brand_name, ${searchQuery}), 0)
          ) as similarity_score
        FROM medications
        WHERE 
          name ILIKE ${`%${searchQuery}%`}
          OR generic_name ILIKE ${`%${searchQuery}%`}
          OR brand_name ILIKE ${`%${searchQuery}%`}
          OR category ILIKE ${`%${searchQuery}%`}
          OR active_ingredient ILIKE ${`%${searchQuery}%`}
          OR SIMILARITY(name, ${searchQuery}) > 0.3
          OR SIMILARITY(generic_name, ${searchQuery}) > 0.3
          OR SIMILARITY(brand_name, ${searchQuery}) > 0.3
        ORDER BY id, similarity_score DESC
        LIMIT 10
      `);

      res.json(result.rows.map((med: any) => ({
        id: med.id,
        name: med.name,
        genericName: med.generic_name,
        brandName: med.brand_name,
        category: med.category,
        dosageForm: med.dosage_form,
        strength: med.strength,
        dosageAdult: med.dosage_adult,
        dosageChild: med.dosage_child,
        frequency: med.frequency,
        indications: med.indications,
        contraindications: med.contraindications,
        sideEffects: med.side_effects,
        routeOfAdministration: med.route_of_administration,
        costPerUnit: med.cost_per_unit
      })));
    } catch (error) {
      console.error('Medicine suggestions error:', error);
      res.status(500).json({ error: "Failed to fetch medicine suggestions" });
    }
  });

  // Comprehensive Medications Database API with fuzzy matching
  router.get('/suggestions/medications', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const searchQuery = q.toLowerCase().trim();
      
      // Use raw SQL for fuzzy matching with pg_trgm extension
      const result = await db.execute(sql`
        SELECT DISTINCT ON (id)
          id, name, generic_name, brand_name, category, dosage_form, 
          strength, dosage_adult, dosage_child, frequency, indications,
          contraindications, side_effects, route_of_administration, cost_per_unit,
          GREATEST(
            SIMILARITY(name, ${searchQuery}),
            COALESCE(SIMILARITY(generic_name, ${searchQuery}), 0),
            COALESCE(SIMILARITY(brand_name, ${searchQuery}), 0)
          ) as similarity_score
        FROM medications
        WHERE 
          name ILIKE ${`%${searchQuery}%`}
          OR generic_name ILIKE ${`%${searchQuery}%`}
          OR brand_name ILIKE ${`%${searchQuery}%`}
          OR category ILIKE ${`%${searchQuery}%`}
          OR active_ingredient ILIKE ${`%${searchQuery}%`}
          OR SIMILARITY(name, ${searchQuery}) > 0.3
          OR SIMILARITY(generic_name, ${searchQuery}) > 0.3
          OR SIMILARITY(brand_name, ${searchQuery}) > 0.3
        ORDER BY id, similarity_score DESC
        LIMIT 10
      `);

      res.json(result.rows.map((med: any) => ({
        id: med.id,
        name: med.name,
        genericName: med.generic_name,
        brandName: med.brand_name,
        category: med.category,
        dosageForm: med.dosage_form,
        strength: med.strength,
        dosageAdult: med.dosage_adult,
        dosageChild: med.dosage_child,
        frequency: med.frequency,
        indications: med.indications,
        contraindications: med.contraindications,
        sideEffects: med.side_effects,
        routeOfAdministration: med.route_of_administration,
        costPerUnit: med.cost_per_unit
      })));
    } catch (error) {
      console.error('Medication suggestions error:', error);
      res.status(500).json({ error: "Failed to fetch medication suggestions" });
    }
  });

  // Diagnosis suggestions (static list for autocomplete)
  router.get("/suggestions/diagnoses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Common diagnoses for Southwest Nigeria clinics
      const commonDiagnoses = [
        "Malaria", "Typhoid Fever", "Hypertension", "Diabetes Mellitus",
        "Upper Respiratory Tract Infection", "Gastroenteritis", "Pneumonia",
        "Urinary Tract Infection", "Bronchitis", "Skin Infection",
        "Peptic Ulcer Disease", "Migraine", "Arthritis", "Anemia", "Asthma",
        "Tuberculosis", "Hepatitis", "Cholera", "Dengue Fever", "Meningitis"
      ];

      const searchTerm = q.toLowerCase();
      const filteredDiagnoses = commonDiagnoses
        .filter(diagnosis => diagnosis.toLowerCase().includes(searchTerm))
        .slice(0, 10);

      res.json(filteredDiagnoses.map(name => ({ name })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch diagnosis suggestions" });
    }
  });

  // AI-Powered Diagnostic Suggestions
  router.post("/suggestions/ai-diagnostics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { suggestDiagnoses } = await import("../openai");
      const { isAIAvailable, AINotConfiguredError } = await import("../openai");

      if (!isAIAvailable()) {
        return res.status(503).json({ 
          error: "AI diagnostics not available",
          message: "OpenAI API key not configured. Please set OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY environment variable."
        });
      }

      const context = req.body;
      
      // Validate required fields
      if (!context.chiefComplaint && !context.symptoms) {
        return res.status(400).json({ 
          error: "Missing required fields",
          message: "Either 'chiefComplaint' or 'symptoms' is required"
        });
      }

      const suggestions = await suggestDiagnoses(context);
      
      res.json({
        suggestions,
        timestamp: new Date().toISOString(),
        aiModel: "gpt-4o"
      });
    } catch (error: any) {
      console.error('AI diagnostic suggestions error:', error);
      
      if (error.name === 'AINotConfiguredError') {
        return res.status(503).json({ 
          error: "AI diagnostics not available",
          message: error.message
        });
      }
      
      res.status(500).json({ 
        error: "Failed to generate diagnostic suggestions",
        message: error.message || "An error occurred while generating diagnostic suggestions"
      });
    }
  });

  // Symptom suggestions
  router.get("/suggestions/symptoms", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Common symptoms for quick input
      const commonSymptoms = [
        "Fever", "Headache", "Cough", "Abdominal pain", "Nausea and vomiting",
        "Diarrhea", "Body aches", "Fatigue", "Shortness of breath", "Chest pain",
        "Dizziness", "Loss of appetite", "Joint pain", "Skin rash", "Sore throat",
        "Runny nose", "Muscle weakness", "Back pain", "Constipation", "Insomnia"
      ];

      const searchTerm = q.toLowerCase();
      const filteredSymptoms = commonSymptoms
        .filter(symptom => symptom.toLowerCase().includes(searchTerm))
        .slice(0, 10);

      res.json(filteredSymptoms.map(name => ({ name })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch symptom suggestions" });
    }
  });

  // Lab test suggestions
  router.get('/suggestions/lab-tests', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      const searchTerm = q ? String(q).toLowerCase() : '';
      
      const testResults = await db.select().from(labTests).where(
        searchTerm
          ? or(
              ilike(labTests.name, `%${searchTerm}%`),
              ilike(labTests.category, `%${searchTerm}%`)
            )
          : undefined
      ).limit(20);
      
      res.json(testResults);
    } catch (error) {
      console.error('Error fetching lab test suggestions:', error);
      res.status(500).json({ message: 'Failed to fetch lab test suggestions' });
    }
  });

  // Allergy suggestions
  router.get("/suggestions/allergies", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Common allergies database for Nigerian clinics
      const commonAllergies = [
        { name: "Penicillin", category: "Antibiotics", severity: "High" },
        { name: "Amoxicillin", category: "Antibiotics", severity: "High" },
        { name: "Sulfa drugs", category: "Antibiotics", severity: "High" },
        { name: "Aspirin", category: "Pain relievers", severity: "Medium" },
        { name: "Ibuprofen", category: "Pain relievers", severity: "Medium" },
        { name: "Paracetamol", category: "Pain relievers", severity: "Low" },
        { name: "Peanuts", category: "Food", severity: "High" },
        { name: "Tree nuts", category: "Food", severity: "High" },
        { name: "Shellfish", category: "Food", severity: "High" },
        { name: "Fish", category: "Food", severity: "Medium" },
        { name: "Eggs", category: "Food", severity: "Medium" },
        { name: "Milk/Dairy", category: "Food", severity: "Medium" },
        { name: "Wheat/Gluten", category: "Food", severity: "Medium" },
        { name: "Soy", category: "Food", severity: "Low" },
        { name: "Latex", category: "Environmental", severity: "Medium" },
        { name: "Dust mites", category: "Environmental", severity: "Low" },
        { name: "Pollen", category: "Environmental", severity: "Low" },
        { name: "Pet dander", category: "Environmental", severity: "Low" },
        { name: "Insect stings", category: "Environmental", severity: "High" },
        { name: "Contrast dye", category: "Medical", severity: "High" }
      ];

      const searchTerm = q.toLowerCase();
      const filteredAllergies = commonAllergies
        .filter(allergy => allergy.name.toLowerCase().includes(searchTerm) || 
                          allergy.category.toLowerCase().includes(searchTerm))
        .slice(0, 10);

      res.json(filteredAllergies.map(allergy => ({
        name: allergy.name,
        category: allergy.category,
        severity: allergy.severity
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch allergy suggestions" });
    }
  });

  // Medical condition suggestions
  router.get("/suggestions/medical-conditions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Common medical conditions in Nigerian clinics
      const commonConditions = [
        { name: "Hypertension", category: "Cardiovascular", chronic: true },
        { name: "Diabetes mellitus", category: "Endocrine", chronic: true },
        { name: "Asthma", category: "Respiratory", chronic: true },
        { name: "Epilepsy", category: "Neurological", chronic: true },
        { name: "Heart disease", category: "Cardiovascular", chronic: true },
        { name: "Kidney disease", category: "Renal", chronic: true },
        { name: "Liver disease", category: "Hepatic", chronic: true },
        { name: "Stroke", category: "Neurological", chronic: true },
        { name: "Arthritis", category: "Musculoskeletal", chronic: true },
        { name: "Depression", category: "Mental Health", chronic: true },
        { name: "Anxiety disorder", category: "Mental Health", chronic: true },
        { name: "Migraine", category: "Neurological", chronic: true },
        { name: "Peptic ulcer", category: "Gastrointestinal", chronic: false },
        { name: "Gastritis", category: "Gastrointestinal", chronic: false },
        { name: "Anemia", category: "Hematological", chronic: false },
        { name: "Thyroid disorder", category: "Endocrine", chronic: true },
        { name: "Tuberculosis", category: "Infectious", chronic: false },
        { name: "HIV/AIDS", category: "Immunological", chronic: true },
        { name: "Hepatitis B", category: "Infectious", chronic: true },
        { name: "Sickle cell disease", category: "Hematological", chronic: true },
        { name: "Glaucoma", category: "Ophthalmological", chronic: true },
        { name: "Cataracts", category: "Ophthalmological", chronic: false }
      ];

      const searchTerm = q.toLowerCase();
      const filteredConditions = commonConditions
        .filter(condition => condition.name.toLowerCase().includes(searchTerm) || 
                            condition.category.toLowerCase().includes(searchTerm))
        .slice(0, 10);

      res.json(filteredConditions.map(condition => ({
        name: condition.name,
        category: condition.category,
        chronic: condition.chronic
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medical condition suggestions" });
    }
  });

  // Pharmacy API routes
  router.get('/pharmacies', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userOrgId = req.user?.organizationId;
      
      const result = await db.select()
        .from(pharmacies)
        .where(
          and(
            eq(pharmacies.isActive, true),
            userOrgId ? eq(pharmacies.organizationId, userOrgId) : isNotNull(pharmacies.organizationId)
          )
        )
        .orderBy(pharmacies.name);

      res.json(result);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      res.status(500).json({ error: "Failed to fetch pharmacies" });
    }
  });

  // =====================
  // SEARCH ROUTES (Diagnoses and Symptoms)
  // =====================

  // Search diagnoses for autocomplete
  router.get("/diagnoses/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const search = req.query.search as string || "";

      // Common medical diagnoses for healthcare system
      const commonDiagnoses = [
        { id: 1, code: "J00", name: "Acute nasopharyngitis (common cold)", category: "Respiratory" },
        { id: 2, code: "K59.1", name: "Diarrhea", category: "Digestive" },
        { id: 3, code: "M79.3", name: "Panniculitis", category: "Musculoskeletal" },
        { id: 4, code: "R50.9", name: "Fever", category: "General" },
        { id: 5, code: "M25.50", name: "Pain in joint", category: "Musculoskeletal" },
        { id: 6, code: "R51", name: "Headache", category: "Neurological" },
        { id: 7, code: "J06.9", name: "Acute upper respiratory infection", category: "Respiratory" },
        { id: 8, code: "K29.90", name: "Gastritis", category: "Digestive" },
        { id: 9, code: "N39.0", name: "Urinary tract infection", category: "Urological" },
        { id: 10, code: "I10", name: "Essential hypertension", category: "Cardiovascular" },
        { id: 11, code: "E11.9", name: "Type 2 diabetes mellitus", category: "Endocrine" },
        { id: 12, code: "M54.5", name: "Low back pain", category: "Musculoskeletal" },
        { id: 13, code: "J44.1", name: "Chronic obstructive pulmonary disease", category: "Respiratory" },
        { id: 14, code: "I25.9", name: "Chronic ischemic heart disease", category: "Cardiovascular" },
        { id: 15, code: "K21.9", name: "Gastroesophageal reflux disease", category: "Digestive" }
      ];

      const filteredDiagnoses = search
        ? commonDiagnoses.filter(diagnosis =>
          diagnosis.name.toLowerCase().includes(search.toLowerCase()) ||
          diagnosis.code.toLowerCase().includes(search.toLowerCase()) ||
          diagnosis.category.toLowerCase().includes(search.toLowerCase())
        )
        : commonDiagnoses;

      return res.json(filteredDiagnoses.slice(0, 20));
    } catch (error) {
      console.error("Error searching diagnoses:", error);
      return res.status(500).json({ message: "Failed to search diagnoses" });
    }
  });

  // Search symptoms for autocomplete
  router.get("/symptoms/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const search = req.query.search as string || "";

      // Common medical symptoms for healthcare system
      const commonSymptoms = [
        { id: 1, name: "Fever", category: "General" },
        { id: 2, name: "Headache", category: "Neurological" },
        { id: 3, name: "Cough", category: "Respiratory" },
        { id: 4, name: "Sore throat", category: "Respiratory" },
        { id: 5, name: "Nausea", category: "Digestive" },
        { id: 6, name: "Vomiting", category: "Digestive" },
        { id: 7, name: "Diarrhea", category: "Digestive" },
        { id: 8, name: "Chest pain", category: "Cardiovascular" },
        { id: 9, name: "Shortness of breath", category: "Respiratory" },
        { id: 10, name: "Fatigue", category: "General" },
        { id: 11, name: "Dizziness", category: "Neurological" },
        { id: 12, name: "Joint pain", category: "Musculoskeletal" },
        { id: 13, name: "Back pain", category: "Musculoskeletal" },
        { id: 14, name: "Abdominal pain", category: "Digestive" },
        { id: 15, name: "Rash", category: "Dermatological" }
      ];

      const filteredSymptoms = search
        ? commonSymptoms.filter(symptom =>
          symptom.name.toLowerCase().includes(search.toLowerCase()) ||
          symptom.category.toLowerCase().includes(search.toLowerCase())
        )
        : commonSymptoms;

      return res.json(filteredSymptoms.slice(0, 20));
    } catch (error) {
      console.error("Error searching symptoms:", error);
      return res.status(500).json({ message: "Failed to search symptoms" });
    }
  });

  return router;
}
