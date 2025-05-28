import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertVisitSchema, insertLabResultSchema, insertMedicineSchema, insertPrescriptionSchema, insertUserSchema, insertReferralSchema, insertLabTestSchema, insertConsultationFormSchema, insertConsultationRecordSchema, insertVaccinationSchema, insertAllergySchema, insertMedicalHistorySchema, users, auditLogs, labTests, medications, labOrders, labOrderItems, consultationForms, consultationRecords } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, desc, or, ilike } from "drizzle-orm";
import { authenticateToken, requireRole, requireAnyRole, hashPassword, comparePassword, generateToken, type AuthRequest } from "./middleware/auth";
import { initializeFirebase, sendNotificationToRole, sendUrgentNotification, NotificationTypes } from "./notifications";
import { AuditLogger, AuditActions } from "./audit";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Firebase for push notifications
  initializeFirebase();

  // Smart Suggestion Endpoints for Auto-complete
  app.get("/api/suggestions/medicines", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Query the comprehensive medications database
      const searchTerm = `%${q.toLowerCase()}%`;
      const result = await db.select()
        .from(medications)
        .where(
          or(
            ilike(medications.name, searchTerm),
            ilike(medications.genericName, searchTerm),
            ilike(medications.brandName, searchTerm),
            ilike(medications.category, searchTerm),
            ilike(medications.activeIngredient, searchTerm)
          )
        )
        .limit(10)
        .orderBy(medications.name);

      res.json(result.map(med => ({
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        brandName: med.brandName,
        category: med.category,
        dosageForm: med.dosageForm,
        strength: med.strength,
        dosageAdult: med.dosageAdult,
        dosageChild: med.dosageChild,
        frequency: med.frequency,
        indications: med.indications,
        contraindications: med.contraindications,
        sideEffects: med.sideEffects,
        routeOfAdministration: med.routeOfAdministration,
        costPerUnit: med.costPerUnit
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medicine suggestions" });
    }
  });

  // Comprehensive Medications Database API
  app.get('/api/suggestions/medications', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      const searchTerm = `%${q.toLowerCase()}%`;
      const result = await db.select().from(medications)
        .where(
          or(
            ilike(medications.name, searchTerm),
            ilike(medications.genericName, searchTerm),
            ilike(medications.brandName, searchTerm),
            ilike(medications.category, searchTerm)
          )
        )
        .limit(10)
        .orderBy(medications.name);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch medication suggestions" });
    }
  });

  app.get("/api/suggestions/diagnoses", authenticateToken, async (req: AuthRequest, res) => {
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

  app.get("/api/suggestions/symptoms", authenticateToken, async (req: AuthRequest, res) => {
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

  app.get('/api/suggestions/lab-tests', authenticateToken, async (req: AuthRequest, res) => {
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

  // Original endpoint for compatibility
  app.get('/api/lab-tests-old', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.json([]);
      }

      // Query the comprehensive lab tests database
      const searchTerm = `%${q.toLowerCase()}%`;
      const result = await db.select()
        .from(labTests)
        .where(
          or(
            ilike(labTests.name, searchTerm),
            ilike(labTests.category, searchTerm),
            ilike(labTests.description, searchTerm)
          )
        )
        .limit(10)
        .orderBy(labTests.name);

      res.json(result.map(test => ({
        name: test.name,
        category: test.category,
        referenceRange: test.referenceRange,
        units: test.units,
        description: test.description
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lab test suggestions" });
    }
  });

  app.get("/api/suggestions/allergies", authenticateToken, async (req: AuthRequest, res) => {
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

  app.get("/api/suggestions/medical-conditions", authenticateToken, async (req: AuthRequest, res) => {
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
  
  // Patients routes - Medical staff only
  app.post("/api/patients", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientData = insertPatientSchema.parse(req.body);
      const patient = await storage.createPatient(patientData);
      res.json(patient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid patient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create patient" });
      }
    }
  });

  app.get("/api/patients", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const search = req.query.search as string | undefined;
      const patients = await storage.getPatients(search);
      res.json(patients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patients" });
    }
  });

  app.get("/api/patients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const patient = await storage.getPatient(id);
      if (!patient) {
        res.status(404).json({ message: "Patient not found" });
        return;
      }

      // Calculate age safely with proper null/undefined handling
      const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
      let age = null;
      
      if (dob && !isNaN(dob.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        // Ensure age is reasonable (0-150)
        if (age < 0 || age > 150) {
          age = null;
        }
      }

      res.json({
        ...patient,
        age: age
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Visits routes - Only doctors can create visits
  app.post("/api/patients/:id/visits", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      console.log('=== VISIT CREATION DEBUG ===');
      console.log('Patient ID:', patientId);
      console.log('Raw request body:', JSON.stringify(req.body, null, 2));
      
      // Clean up empty strings to undefined for optional fields and fix field mapping
      const cleanedData = { ...req.body };
      if (cleanedData.heartRate === '') cleanedData.heartRate = undefined;
      if (cleanedData.temperature === '') cleanedData.temperature = undefined;
      if (cleanedData.weight === '') cleanedData.weight = undefined;
      if (cleanedData.followUpDate === '') cleanedData.followUpDate = undefined;
      
      // Fix field name mapping - frontend sends chiefComplaint, backend expects complaint
      if (cleanedData.chiefComplaint !== undefined) {
        cleanedData.complaint = cleanedData.chiefComplaint;
        delete cleanedData.chiefComplaint;
      }
      
      // Fix field name mapping - frontend sends treatmentPlan, backend expects treatment
      if (cleanedData.treatmentPlan !== undefined) {
        cleanedData.treatment = cleanedData.treatmentPlan;
        delete cleanedData.treatmentPlan;
      }
      
      console.log('Cleaned data:', JSON.stringify(cleanedData, null, 2));
      
      const visitData = insertVisitSchema.parse({ ...cleanedData, patientId });
      console.log('Parsed visit data:', JSON.stringify(visitData, null, 2));
      
      const visit = await storage.createVisit(visitData);
      console.log('Visit created successfully:', visit);
      res.json(visit);
    } catch (error: any) {
      console.error('=== VISIT CREATION ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error instance:', error.constructor.name);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
        res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      } else {
        console.error('Non-Zod error:', error);
        res.status(500).json({ message: "Failed to create visit", error: error.message });
      }
    }
  });

  app.get("/api/patients/:id/visits", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const visits = await storage.getVisitsByPatient(patientId);
      res.json(visits);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visits" });
    }
  });

  // Lab results routes
  app.post("/api/patients/:id/labs", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const labData = insertLabResultSchema.parse({ ...req.body, patientId });
      const labResult = await storage.createLabResult(labData);
      res.json(labResult);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid lab result data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create lab result" });
      }
    }
  });

  app.get("/api/patients/:id/labs", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const labResults = await storage.getLabResultsByPatient(patientId);
      res.json(labResults);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab results" });
    }
  });

  // Medicines routes - Pharmacist and Admin only
  app.post("/api/medicines", authenticateToken, requireAnyRole(['pharmacist', 'admin']), async (req: AuthRequest, res) => {
    try {
      const medicineData = insertMedicineSchema.parse(req.body);
      const medicine = await storage.createMedicine(medicineData);
      res.json(medicine);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid medicine data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create medicine" });
      }
    }
  });

  app.get("/api/medicines", authenticateToken, requireAnyRole(['pharmacist', 'doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const medicines = await storage.getMedicines();
      res.json(medicines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch medicines" });
    }
  });

  app.patch("/api/medicines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { quantity } = req.body;
      
      if (typeof quantity !== "number" || quantity < 0) {
        res.status(400).json({ message: "Invalid quantity" });
        return;
      }
      
      const medicine = await storage.updateMedicineQuantity(id, quantity);
      res.json(medicine);
    } catch (error) {
      res.status(500).json({ message: "Failed to update medicine quantity" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Low stock medicines with automatic notifications
  app.get("/api/medicines/low-stock", async (req, res) => {
    try {
      const lowStockMedicines = await storage.getLowStockMedicines();
      
      // Send notifications for critically low stock items
      for (const medicine of lowStockMedicines) {
        if (medicine.quantity === 0) {
          // Out of stock - urgent notification
          await sendNotificationToRole('pharmacist', 
            NotificationTypes.MEDICATION_OUT_OF_STOCK(medicine.name)
          );
          await sendNotificationToRole('admin', 
            NotificationTypes.MEDICATION_OUT_OF_STOCK(medicine.name)
          );
        } else if (medicine.quantity <= 10) {
          // Low stock warning
          await sendNotificationToRole('pharmacist', 
            NotificationTypes.MEDICATION_LOW_STOCK(medicine.name, medicine.quantity)
          );
        }
      }
      
      res.json(lowStockMedicines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock medicines" });
    }
  });

  // Recent patients for dashboard
  app.get("/api/patients/recent", async (req, res) => {
    try {
      const patients = await storage.getPatients();
      const recentPatients = patients.slice(0, 5);
      res.json(recentPatients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent patients" });
    }
  });

  // Prescription routes
  app.post("/api/patients/:id/prescriptions", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const prescriptionData = insertPrescriptionSchema.parse({ ...req.body, patientId });
      const prescription = await storage.createPrescription(prescriptionData);
      res.json(prescription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid prescription data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create prescription" });
      }
    }
  });

  app.get("/api/patients/:id/prescriptions", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const prescriptions = await storage.getPrescriptionsByPatient(patientId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch prescriptions" });
    }
  });

  app.get("/api/patients/:id/prescriptions/active", async (req, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const activePrescriptions = await storage.getActivePrescriptionsByPatient(patientId);
      res.json(activePrescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active prescriptions" });
    }
  });

  app.get("/api/visits/:id/prescriptions", async (req, res) => {
    try {
      const visitId = parseInt(req.params.id);
      const prescriptions = await storage.getPrescriptionsByVisit(visitId);
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch visit prescriptions" });
    }
  });

  app.patch("/api/prescriptions/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || typeof status !== "string") {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      
      const prescription = await storage.updatePrescriptionStatus(id, status);
      res.json(prescription);
    } catch (error) {
      res.status(500).json({ message: "Failed to update prescription status" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || !(await comparePassword(password, user.password))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken({ id: user.id, username: user.username, role: user.role });
      
      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const allUsers = await db.select().from(users);
      // Don't return passwords
      const usersWithoutPasswords = allUsers.map(user => ({ ...user, password: undefined }));
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      userData.password = await hashPassword(userData.password);
      const user = await storage.createUser(userData);
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction(AuditActions.USER_CREATED, user.id, {
        newUserRole: user.role,
        newUserUsername: user.username
      });
      
      res.json({ ...user, password: undefined }); // Don't return password
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  app.patch('/api/users/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, password, role, email, phone, photoUrl } = req.body;
      
      const updateData: Record<string, any> = { username, role, email, phone, photoUrl };
      
      // Hash password if provided
      if (password) {
        updateData.password = await hashPassword(password);
      }
      
      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction(AuditActions.USER_UPDATED, userId, {
        updatedFields: Object.keys(updateData),
        newRole: role
      });
      
      res.json({ ...updatedUser, password: undefined }); // Don't return password
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/users/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Prevent admin from deleting themselves
      if (req.user?.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const [deletedUser] = await db.delete(users)
        .where(eq(users.id, userId))
        .returning();
      
      if (!deletedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction(AuditActions.USER_UPDATED, userId, {
        action: "deleted",
        deletedUserRole: deletedUser.role,
        deletedUsername: deletedUser.username
      });
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Audit logs endpoint (Admin only)
  app.get('/api/audit-logs', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const logs = await db.select().from(auditLogs).orderBy(auditLogs.timestamp);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Lab Tests endpoints
  app.get('/api/lab-tests', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const tests = await db.select().from(labTests).orderBy(labTests.name);
      res.json(tests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lab tests" });
    }
  });

  app.post('/api/lab-tests', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const validatedData = insertLabTestSchema.parse(req.body);
      
      const [labTest] = await db.insert(labTests)
        .values(validatedData)
        .returning();
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction("Lab Test Created", {
        labTestId: labTest.id,
        labTestName: labTest.name,
        category: labTest.category
      });
      
      res.status(201).json(labTest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lab test data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lab test" });
    }
  });

  app.get("/api/users/:username", authenticateToken, requireAnyRole(['admin', 'doctor']), async (req, res) => {
    try {
      const username = req.params.username;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json({ ...user, password: undefined }); // Don't return password
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile management routes
  app.get("/api/users/:id/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only access their own profile unless they're admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction(AuditActions.USER_PROFILE_VIEWED, userId);
      
      res.json({ ...user, password: undefined }); // Don't return password
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.patch("/api/users/:id/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile unless they're admin
      if (req.user?.id !== userId && req.user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const { email, phone, photoUrl } = req.body;
      
      // Validate the update data
      const updateData: Record<string, any> = { email, phone, photoUrl };
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });
      
      // Update the user profile
      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logUserAction(AuditActions.USER_PROFILE_UPDATED, userId, {
        updatedFields: Object.keys(updateData)
      });
      
      res.json({ ...updatedUser, password: undefined }); // Don't return password
    } catch (error) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Referrals routes - Medical staff only
  app.post("/api/referrals", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const referralData = insertReferralSchema.parse(req.body);
      const referral = await storage.createReferral(referralData);
      res.json(referral);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid referral data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create referral" });
      }
    }
  });

  app.get("/api/referrals", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { toRole, fromUserId, status } = req.query;
      const filters: any = {};
      
      if (toRole) filters.toRole = toRole as string;
      if (fromUserId) filters.fromUserId = parseInt(fromUserId as string);
      if (status) filters.status = status as string;

      const referrals = await storage.getReferrals(filters);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  app.patch("/api/referrals/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
        res.status(400).json({ message: "Invalid status. Must be 'pending', 'accepted', or 'rejected'" });
        return;
      }

      const referral = await storage.updateReferralStatus(id, status);
      res.json(referral);
    } catch (error) {
      res.status(500).json({ message: "Failed to update referral status" });
    }
  });

  // Consultation Forms API - Specialist form creation and management
  app.post("/api/consultation-forms", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const formData = insertConsultationFormSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });
      
      const form = await storage.createConsultationForm(formData);
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction(AuditActions.SYSTEM_BACKUP, {
        action: 'consultation_form_created',
        formId: form.id,
        formName: form.name
      });
      
      res.json(form);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid form data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create consultation form" });
      }
    }
  });

  app.get("/api/consultation-forms", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { specialistRole } = req.query;
      const forms = await storage.getConsultationForms({
        specialistRole: specialistRole as string,
        isActive: true
      });
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultation forms" });
    }
  });

  app.get("/api/consultation-forms/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const form = await storage.getConsultationForm(id);
      
      if (!form) {
        return res.status(404).json({ message: "Consultation form not found" });
      }
      
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultation form" });
    }
  });

  app.patch("/api/consultation-forms/:id", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      const form = await storage.updateConsultationForm(id, updateData);
      
      if (!form) {
        return res.status(404).json({ message: "Consultation form not found" });
      }
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logSystemAction(AuditActions.SYSTEM_BACKUP, {
        action: 'consultation_form_updated',
        formId: form.id,
        formName: form.name
      });
      
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to update consultation form" });
    }
  });

  // Consultation Records API - Fill and save form responses
  app.post("/api/consultation-records", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const recordData = insertConsultationRecordSchema.parse({
        ...req.body,
        filledBy: req.user!.id
      });
      
      const record = await storage.createConsultationRecord(recordData);
      
      // Create audit log
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction(AuditActions.PATIENT_UPDATED, recordData.patientId, {
        action: 'consultation_record_created',
        recordId: record.id,
        formId: recordData.formId
      });
      
      res.json(record);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid consultation data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save consultation record" });
      }
    }
  });

  app.get("/api/patients/:patientId/consultation-records", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const records = await storage.getConsultationRecordsByPatient(patientId);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch consultation records" });
    }
  });

  // Get patient consultations with form details
  app.get("/api/patients/:id/consultations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      
      const consultations = await db
        .select({
          id: consultationRecords.id,
          patientId: consultationRecords.patientId,
          formId: consultationRecords.formId,
          filledBy: consultationRecords.filledBy,
          formData: consultationRecords.formData,
          createdAt: consultationRecords.createdAt,
          formName: consultationForms.name,
          specialistRole: consultationForms.specialistRole,
          formDescription: consultationForms.description
        })
        .from(consultationRecords)
        .leftJoin(consultationForms, eq(consultationRecords.formId, consultationForms.id))
        .where(eq(consultationRecords.patientId, patientId))
        .orderBy(desc(consultationRecords.createdAt));
      
      res.json(consultations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient consultations" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
