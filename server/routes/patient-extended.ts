import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { sql, eq, desc, and } from "drizzle-orm";
import { vitalSigns, medicalDocuments, patientInsurance, medicalHistory, patients, insertMedicalHistorySchema, safetyAlerts, dischargeLetters, users, proceduralReports, insertProceduralReportSchema, consentForms, insertConsentFormSchema, patientConsents, insertPatientConsentSchema, patientReferrals, organizations } from "@shared/schema";
import { parseAndType } from "../utils/parse-and-type";
import { EmailService } from "../services/EmailService";
import { generateReferralHTML } from "../utils/html-generators";

// Helper function to safely get error message
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

const router = Router();

export function setupPatientExtendedRoutes(): Router {

  // =====================
  // ALLERGIES ROUTES
  // =====================

  // Get patient allergies
  router.get("/patients/:id/allergies", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);

      const result = await db.execute(sql`
        SELECT 
          id,
          patient_id as "patientId",
          allergen,
          allergy_type as "allergyType",
          severity,
          reaction,
          onset_date as "onsetDate",
          notes,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM patient_allergies 
        WHERE patient_id = ${patientId} 
        ORDER BY created_at DESC
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching allergies:', error);
      res.status(500).json({ message: "Failed to fetch allergies" });
    }
  });

  // Add allergy
  router.post("/patients/:id/allergies", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const allergyData = req.body;

      // Validate required fields
      if (!allergyData.allergen || !allergyData.allergyType || !allergyData.severity || !allergyData.reaction) {
        return res.status(400).json({ 
          message: "Missing required fields: allergen, allergyType, severity, and reaction are required" 
        });
      }

      const result = await db.execute(sql`
        INSERT INTO patient_allergies 
        (patient_id, allergen, allergy_type, severity, reaction, onset_date, notes, created_at)
        VALUES (
          ${patientId}, 
          ${allergyData.allergen}, 
          ${allergyData.allergyType}, 
          ${allergyData.severity}, 
          ${allergyData.reaction},
          ${allergyData.onsetDate || null},
          ${allergyData.notes || null},
          NOW()
        )
        RETURNING *
      `);

      // Handle different result formats from Drizzle
      const insertedAllergy = Array.isArray(result) ? result[0] : (result.rows?.[0] || result);
      
      if (!insertedAllergy) {
        console.error('No data returned from INSERT:', result);
        return res.status(500).json({ message: "Failed to retrieve inserted allergy" });
      }

      res.status(201).json(insertedAllergy);
    } catch (error) {
      console.error('Error adding allergy:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check for common database errors
      if (errorMessage.includes('violates foreign key constraint')) {
        return res.status(404).json({ message: "Patient not found" });
      }
      if (errorMessage.includes('violates check constraint')) {
        return res.status(400).json({ message: "Invalid allergy type or severity value" });
      }
      
      res.status(500).json({ message: "Failed to add allergy", error: errorMessage });
    }
  });

  // Update allergy
  router.patch("/patients/:id/allergies/:allergyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const allergyId = Number.parseInt(req.params.allergyId);
      const allergyData = req.body;

      const result = await db.execute(sql`
        UPDATE patient_allergies 
        SET 
          allergen = ${allergyData.allergen},
          allergy_type = ${allergyData.allergyType},
          severity = ${allergyData.severity},
          reaction = ${allergyData.reaction},
          onset_date = ${allergyData.onsetDate || null},
          notes = ${allergyData.notes || null},
          updated_at = NOW()
        WHERE id = ${allergyId} AND patient_id = ${patientId}
        RETURNING *
      `);

      res.json(result.rows?.[0] || result);
    } catch (error) {
      console.error('Error updating allergy:', error);
      res.status(500).json({ message: "Failed to update allergy", error: getErrorMessage(error) });
    }
  });

  // Delete allergy
  router.delete("/patients/:id/allergies/:allergyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const allergyId = Number.parseInt(req.params.allergyId);

      await db.execute(sql`
        DELETE FROM patient_allergies WHERE id = ${allergyId}
      `);

      res.json({ message: "Allergy deleted successfully" });
    } catch (error) {
      console.error('Error deleting allergy:', error);
      res.status(500).json({ message: "Failed to delete allergy", error: getErrorMessage(error) });
    }
  });

  // =====================
  // IMMUNIZATIONS ROUTES
  // =====================

  // Get ALL immunizations across all patients (for dashboard/reports)
  router.get("/vaccinations/all", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const result = await db.execute(sql`
        SELECT 
          v.id,
          v.patient_id as "patientId",
          v.vaccine_name as "vaccineName",
          v.date_administered as "dateAdministered",
          v.administered_by as "administeredBy",
          v.batch_number as "batchNumber",
          v.manufacturer,
          v.next_due_date as "nextDueDate",
          v.notes,
          v.created_at as "createdAt"
        FROM vaccinations v
        ORDER BY v.date_administered DESC
        LIMIT 1000
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching all immunizations:', error);
      res.status(500).json({ message: "Failed to fetch immunizations" });
    }
  });

  // Get patient immunizations
  router.get("/patients/:id/immunizations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);

      const result = await db.execute(sql`
        SELECT 
          id,
          patient_id as "patientId",
          vaccine_name as "vaccineName",
          date_administered as "dateAdministered",
          administered_by as "administeredBy",
          batch_number as "batchNumber",
          manufacturer,
          next_due_date as "nextDueDate",
          notes,
          created_at as "createdAt"
        FROM vaccinations 
        WHERE patient_id = ${patientId} 
        ORDER BY date_administered DESC
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching immunizations:', error);
      res.status(500).json({ message: "Failed to fetch immunizations" });
    }
  });

  // Add immunization
  router.post("/patients/:id/immunizations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const immunizationData = req.body;

      console.log('Adding immunization for patient:', patientId, 'Data:', immunizationData);

      const result = await db.execute(sql`
        INSERT INTO vaccinations 
        (patient_id, vaccine_name, date_administered, administered_by, 
         batch_number, manufacturer, next_due_date, notes, created_at)
        VALUES (
          ${patientId}, 
          ${immunizationData.vaccineName}, 
          ${immunizationData.dateAdministered}, 
          ${immunizationData.administeredBy || 'Unknown'},
          ${immunizationData.batchNumber || immunizationData.lotNumber || null},
          ${immunizationData.manufacturer || null},
          ${immunizationData.nextDueDate || null},
          ${immunizationData.notes || null},
          NOW()
        )
        RETURNING 
          id,
          patient_id as "patientId",
          vaccine_name as "vaccineName",
          date_administered as "dateAdministered",
          administered_by as "administeredBy",
          batch_number as "batchNumber",
          manufacturer,
          next_due_date as "nextDueDate",
          notes,
          created_at as "createdAt"
      `);

      console.log('Immunization added successfully:', result);
      res.json(result.rows?.[0] || result);
    } catch (error) {
      console.error('Error adding immunization:', error);
      res.status(500).json({ message: "Failed to add immunization", error: getErrorMessage(error) });
    }
  });

  // Update immunization
  router.patch("/patients/:id/immunizations/:immunizationId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const immunizationId = Number.parseInt(req.params.immunizationId);
      const immunizationData = req.body;

      const result = await db.execute(sql`
        UPDATE vaccinations 
        SET 
          vaccine_name = ${immunizationData.vaccineName},
          date_administered = ${immunizationData.dateAdministered},
          administered_by = ${immunizationData.administeredBy || 'Unknown'},
          batch_number = ${immunizationData.batchNumber || immunizationData.lotNumber || null},
          manufacturer = ${immunizationData.manufacturer || null},
          next_due_date = ${immunizationData.nextDueDate || null},
          notes = ${immunizationData.notes || null}
        WHERE id = ${immunizationId} AND patient_id = ${patientId}
        RETURNING 
          id,
          patient_id as "patientId",
          vaccine_name as "vaccineName",
          date_administered as "dateAdministered",
          administered_by as "administeredBy",
          batch_number as "batchNumber",
          manufacturer,
          next_due_date as "nextDueDate",
          notes,
          created_at as "createdAt"
      `);

      res.json(result.rows?.[0] || result);
    } catch (error) {
      console.error('Error updating immunization:', error);
      res.status(500).json({ message: "Failed to update immunization", error: getErrorMessage(error) });
    }
  });

  // Delete immunization
  router.delete("/patients/:id/immunizations/:immunizationId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const immunizationId = Number.parseInt(req.params.immunizationId);

      await db.execute(sql`
        DELETE FROM vaccinations WHERE id = ${immunizationId}
      `);

      res.json({ message: "Immunization deleted successfully" });
    } catch (error) {
      console.error('Error deleting immunization:', error);
      res.status(500).json({ message: "Failed to delete immunization", error: getErrorMessage(error) });
    }
  });

  // =====================
  // IMAGING ROUTES
  // =====================

  // Get patient imaging studies
  router.get("/patients/:id/imaging", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);

      const result = await db.execute(sql`
        SELECT 
          id,
          patient_id as "patientId",
          study_type as "studyType",
          study_date as "studyDate",
          body_part as "bodyPart",
          indication,
          findings,
          impression,
          radiologist,
          referring_physician as "referringPhysician",
          modality,
          priority,
          status,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM patient_imaging 
        WHERE patient_id = ${patientId} 
        ORDER BY study_date DESC
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching imaging studies:', error);
      res.status(500).json({ message: "Failed to fetch imaging studies" });
    }
  });

  // Add imaging study
  router.post("/patients/:id/imaging", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const imagingData = req.body;

      // Validate required fields
      if (!imagingData.studyType || !imagingData.studyDate || !imagingData.bodyPart || !imagingData.indication) {
        return res.status(400).json({ 
          message: "Missing required fields: studyType, studyDate, bodyPart, and indication are required" 
        });
      }

      if (!imagingData.priority || !imagingData.status) {
        return res.status(400).json({ 
          message: "Missing required fields: priority and status are required" 
        });
      }

      const result = await db.execute(sql`
        INSERT INTO patient_imaging 
        (patient_id, study_type, study_date, body_part, indication, findings, 
         impression, radiologist, referring_physician, modality, priority, status, created_at)
        VALUES (
          ${patientId}, 
          ${imagingData.studyType}, 
          ${imagingData.studyDate}, 
          ${imagingData.bodyPart},
          ${imagingData.indication},
          ${imagingData.findings || null},
          ${imagingData.impression || null},
          ${imagingData.radiologist || null},
          ${imagingData.referringPhysician || null},
          ${imagingData.modality || null},
          ${imagingData.priority},
          ${imagingData.status},
          NOW()
        )
        RETURNING *
      `);

      // Handle different result formats from Drizzle
      const insertedStudy = Array.isArray(result) ? result[0] : (result.rows?.[0] || result);
      
      if (!insertedStudy) {
        console.error('No data returned from INSERT:', result);
        return res.status(500).json({ message: "Failed to retrieve inserted imaging study" });
      }

      res.status(201).json(insertedStudy);
    } catch (error) {
      console.error('Error adding imaging study:', error);
      const errorMessage = getErrorMessage(error);
      
      // Check for common database errors
      if (errorMessage.includes('violates foreign key constraint')) {
        return res.status(404).json({ message: "Patient not found" });
      }
      if (errorMessage.includes('violates check constraint')) {
        return res.status(400).json({ message: "Invalid priority or status value" });
      }
      
      res.status(500).json({ message: "Failed to add imaging study", error: errorMessage });
    }
  });

  // Update imaging study
  router.patch("/patients/:id/imaging/:imagingId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const imagingId = Number.parseInt(req.params.imagingId);
      const imagingData = req.body;

      const result = await db.execute(sql`
        UPDATE patient_imaging 
        SET 
          study_type = ${imagingData.studyType},
          study_date = ${imagingData.studyDate},
          body_part = ${imagingData.bodyPart},
          indication = ${imagingData.indication},
          findings = ${imagingData.findings || null},
          impression = ${imagingData.impression || null},
          radiologist = ${imagingData.radiologist || null},
          referring_physician = ${imagingData.referringPhysician || null},
          modality = ${imagingData.modality || null},
          priority = ${imagingData.priority},
          status = ${imagingData.status},
          updated_at = NOW()
        WHERE id = ${imagingId} AND patient_id = ${patientId}
        RETURNING *
      `);

      res.json(result.rows?.[0] || result);
    } catch (error) {
      console.error('Error updating imaging study:', error);
      res.status(500).json({ message: "Failed to update imaging study", error: getErrorMessage(error) });
    }
  });

  // Delete imaging study
  router.delete("/patients/:id/imaging/:imagingId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const imagingId = Number.parseInt(req.params.imagingId);

      await db.execute(sql`
        DELETE FROM patient_imaging WHERE id = ${imagingId}
      `);

      res.json({ message: "Imaging study deleted successfully" });
    } catch (error) {
      console.error('Error deleting imaging study:', error);
      res.status(500).json({ message: "Failed to delete imaging study", error: getErrorMessage(error) });
    }
  });

  // =====================
  // PROCEDURES ROUTES
  // =====================

  // Get patient procedures
  router.get("/patients/:id/procedures", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);

      const result = await db.execute(sql`
        SELECT 
          id,
          patient_id as "patientId",
          procedure_name as "procedureName",
          procedure_date as "procedureDate",
          procedure_type as "procedureType",
          performed_by as "performedBy",
          assistant,
          indication,
          description,
          outcome,
          complications,
          follow_up_required as "followUpRequired",
          follow_up_date as "followUpDate",
          location,
          anesthesia_type as "anesthesiaType",
          notes,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM patient_procedures 
        WHERE patient_id = ${patientId} 
        ORDER BY procedure_date DESC
      `);

      res.json(result.rows || []);
    } catch (error) {
      console.error('Error fetching procedures:', error);
      res.status(500).json({ message: "Failed to fetch procedures" });
    }
  });

  // Add procedure
  router.post("/patients/:id/procedures", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const procedureData = req.body;

      const result = await db.execute(sql`
        INSERT INTO patient_procedures 
        (patient_id, procedure_name, procedure_date, procedure_type, performed_by, 
         assistant, indication, description, outcome, complications, follow_up_required,
         follow_up_date, location, anesthesia_type, notes, created_at)
        VALUES (
          ${patientId}, 
          ${procedureData.procedureName}, 
          ${procedureData.procedureDate}, 
          ${procedureData.procedureType},
          ${procedureData.performedBy || null},
          ${procedureData.assistant || null},
          ${procedureData.indication},
          ${procedureData.description || null},
          ${procedureData.outcome || null},
          ${procedureData.complications || null},
          ${procedureData.followUpRequired || false},
          ${procedureData.followUpDate || null},
          ${procedureData.location || null},
          ${procedureData.anesthesiaType || null},
          ${procedureData.notes || null},
          NOW()
        )
        RETURNING *
      `);

      res.json(result.rows?.[0] || result);
    } catch (error) {
      console.error('Error adding procedure:', error);
      res.status(500).json({ message: "Failed to add procedure", error: getErrorMessage(error) });
    }
  });

  // Update procedure
  router.patch("/patients/:id/procedures/:procedureId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = Number.parseInt(req.params.id);
      const procedureId = Number.parseInt(req.params.procedureId);
      const procedureData = req.body;

      const result = await db.execute(sql`
        UPDATE patient_procedures 
        SET 
          procedure_name = ${procedureData.procedureName},
          procedure_date = ${procedureData.procedureDate},
          procedure_type = ${procedureData.procedureType},
          performed_by = ${procedureData.performedBy || null},
          assistant = ${procedureData.assistant || null},
          indication = ${procedureData.indication},
          description = ${procedureData.description || null},
          outcome = ${procedureData.outcome || null},
          complications = ${procedureData.complications || null},
          follow_up_required = ${procedureData.followUpRequired || false},
          follow_up_date = ${procedureData.followUpDate || null},
          location = ${procedureData.location || null},
          anesthesia_type = ${procedureData.anesthesiaType || null},
          notes = ${procedureData.notes || null},
          updated_at = NOW()
        WHERE id = ${procedureId} AND patient_id = ${patientId}
        RETURNING *
      `);

      res.json(result.rows?.[0] || result);
    } catch (error) {
      console.error('Error updating procedure:', error);
      res.status(500).json({ message: "Failed to update procedure", error: getErrorMessage(error) });
    }
  });

  // Delete procedure
  router.delete("/patients/:id/procedures/:procedureId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const procedureId = Number.parseInt(req.params.procedureId);

      await db.execute(sql`
        DELETE FROM patient_procedures WHERE id = ${procedureId}
      `);

      res.json({ message: "Procedure deleted successfully" });
    } catch (error) {
      console.error('Error deleting procedure:', error);
      res.status(500).json({ message: "Failed to delete procedure", error: getErrorMessage(error) });
    }
  });

  // =====================
  // VITAL SIGNS ROUTES
  // =====================

  // Get patient vital signs
  router.get("/patients/:id/vitals", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);

      const vitals = await db
        .select()
        .from(vitalSigns)
        .where(eq(vitalSigns.patientId, patientId))
        .orderBy(desc(vitalSigns.recordedAt));

      return res.json(vitals);
    } catch (error) {
      console.error('Error fetching vitals:', error);
      return res.status(500).json({ message: "Failed to fetch vital signs" });
    }
  });

  // Record patient vital signs
  router.post("/patients/:id/vitals", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const {
        bloodPressureSystolic,
        bloodPressureDiastolic,
        heartRate,
        temperature,
        respiratoryRate,
        oxygenSaturation,
        weight,
        height
      } = req.body;

      const [vital] = await db
        .insert(vitalSigns)
        .values({
          patientId,
          bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic) : null,
          bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic) : null,
          heartRate: heartRate ? parseInt(heartRate) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          respiratoryRate: respiratoryRate ? parseInt(respiratoryRate) : null,
          oxygenSaturation: oxygenSaturation ? parseInt(oxygenSaturation) : null,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
          recordedAt: new Date(),
          recordedBy: req.user?.username || 'Unknown'
        })
        .returning();

      // Create audit log
      const { AuditLogger } = await import("../audit");
      const auditLogger = new AuditLogger(req);
      await auditLogger.logPatientAction('VITALS_RECORDED', patientId, {
        vitalId: vital.id,
        bloodPressure: `${bloodPressureSystolic}/${bloodPressureDiastolic}`,
        heartRate,
        temperature
      });

      return res.json(vital);
    } catch (error) {
      console.error('Error recording vitals:', error);
      return res.status(500).json({ message: "Failed to record vital signs" });
    }
  });

  // =====================
  // PATIENT DOCUMENTS ROUTES
  // =====================

  // Get documents for specific patient
  router.get("/patients/:patientId/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { patientId } = req.params;
      const organizationId = req.user?.organizationId || 1;

      const documents = await db
        .select()
        .from(medicalDocuments)
        .where(eq(medicalDocuments.patientId, parseInt(patientId)))
        .orderBy(desc(medicalDocuments.uploadedAt));

      return res.json(documents);
    } catch (error) {
      console.error('Error fetching patient documents:', error);
      return res.status(500).json({ message: "Failed to fetch patient documents" });
    }
  });

  // Upload document for specific patient
  router.post("/patients/:patientId/documents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const multer = await import('multer');
      const upload = multer.default({
        storage: multer.default.memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 }
      });

      // This would need to be handled differently - multer middleware needs to be applied at route level
      // For now, we'll keep this route in routes.ts but mark it for future migration
      return res.status(501).json({ message: "Patient document upload route needs multer middleware - keeping in routes.ts for now" });
    } catch (error) {
      console.error('Error uploading patient document:', error);
      return res.status(500).json({ message: "Failed to upload document" });
    }
  });

  // =====================
  // PATIENT INSURANCE ROUTES
  // =====================

  // Get patient insurance records
  router.get("/patients/:id/insurance", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      const insuranceRecords = await db.select()
        .from(patientInsurance)
        .where(and(
          eq(patientInsurance.patientId, patientId),
          eq(patientInsurance.organizationId, userOrgId!)
        ))
        .orderBy(desc(patientInsurance.createdAt));

      return res.json(insuranceRecords);
    } catch (error) {
      console.error('Error fetching patient insurance:', error);
      return res.status(500).json({ message: "Failed to fetch insurance records" });
    }
  });

  // Create patient insurance record
  router.post("/patients/:id/insurance", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      // Helper function to sanitize numeric fields
      const sanitizeNumeric = (value: any): string | null => {
        if (value === '' || value === undefined || value === null) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : String(num);
      };

      // Helper function to sanitize optional date fields
      const sanitizeDate = (value: any): string | null => {
        if (value === '' || value === undefined || value === null) return null;
        return value;
      };

      // Build sanitized data object, explicitly handling all fields
      const sanitizedData = {
        provider: req.body.provider,
        policyNumber: req.body.policyNumber,
        groupNumber: req.body.groupNumber || null,
        membershipNumber: req.body.membershipNumber || null,
        coverageType: req.body.coverageType,
        policyStatus: req.body.policyStatus,
        effectiveDate: req.body.effectiveDate,
        expirationDate: sanitizeDate(req.body.expirationDate),
        deductible: sanitizeNumeric(req.body.deductible),
        copay: sanitizeNumeric(req.body.copay),
        coinsurance: sanitizeNumeric(req.body.coinsurance),
        maximumBenefit: sanitizeNumeric(req.body.maximumBenefit),
        notes: req.body.notes || null,
        providerPhone: req.body.providerPhone || null,
        providerEmail: req.body.providerEmail || null,
        providerAddress: req.body.providerAddress || null,
        coverageDetails: req.body.coverageDetails || null,
        preAuthRequired: req.body.preAuthRequired ?? false,
        referralRequired: req.body.referralRequired ?? false,
        patientId,
        organizationId: userOrgId!
      };

      const [newInsurance] = await db.insert(patientInsurance).values(sanitizedData).returning();

      res.status(201).json(newInsurance);
    } catch (error) {
      console.error('Error creating insurance record:', error);
      return res.status(500).json({ message: "Failed to create insurance record" });
    }
  });

  // Update patient insurance record
  router.patch("/patients/:id/insurance/:insuranceId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const insuranceId = parseInt(req.params.insuranceId);
      const userOrgId = req.user?.organizationId;

      // Helper function to sanitize numeric fields
      const sanitizeNumeric = (value: any): string | null => {
        if (value === '' || value === undefined || value === null) return null;
        const num = parseFloat(value);
        return isNaN(num) ? null : String(num);
      };

      // Helper function to sanitize optional date fields
      const sanitizeDate = (value: any): string | null => {
        if (value === '' || value === undefined || value === null) return null;
        return value;
      };

      // Build sanitized update data
      const sanitizedData: Record<string, any> = {
        updatedAt: new Date()
      };

      // Only include fields that are present in the request
      if ('provider' in req.body) sanitizedData.provider = req.body.provider;
      if ('policyNumber' in req.body) sanitizedData.policyNumber = req.body.policyNumber;
      if ('groupNumber' in req.body) sanitizedData.groupNumber = req.body.groupNumber || null;
      if ('membershipNumber' in req.body) sanitizedData.membershipNumber = req.body.membershipNumber || null;
      if ('coverageType' in req.body) sanitizedData.coverageType = req.body.coverageType;
      if ('policyStatus' in req.body) sanitizedData.policyStatus = req.body.policyStatus;
      if ('effectiveDate' in req.body) sanitizedData.effectiveDate = req.body.effectiveDate;
      if ('expirationDate' in req.body) sanitizedData.expirationDate = sanitizeDate(req.body.expirationDate);
      if ('deductible' in req.body) sanitizedData.deductible = sanitizeNumeric(req.body.deductible);
      if ('copay' in req.body) sanitizedData.copay = sanitizeNumeric(req.body.copay);
      if ('coinsurance' in req.body) sanitizedData.coinsurance = sanitizeNumeric(req.body.coinsurance);
      if ('maximumBenefit' in req.body) sanitizedData.maximumBenefit = sanitizeNumeric(req.body.maximumBenefit);
      if ('notes' in req.body) sanitizedData.notes = req.body.notes || null;
      if ('providerPhone' in req.body) sanitizedData.providerPhone = req.body.providerPhone || null;
      if ('providerEmail' in req.body) sanitizedData.providerEmail = req.body.providerEmail || null;
      if ('providerAddress' in req.body) sanitizedData.providerAddress = req.body.providerAddress || null;
      if ('coverageDetails' in req.body) sanitizedData.coverageDetails = req.body.coverageDetails || null;
      if ('preAuthRequired' in req.body) sanitizedData.preAuthRequired = req.body.preAuthRequired ?? false;
      if ('referralRequired' in req.body) sanitizedData.referralRequired = req.body.referralRequired ?? false;

      const [updated] = await db.update(patientInsurance)
        .set(sanitizedData)
        .where(and(
          eq(patientInsurance.id, insuranceId),
          eq(patientInsurance.patientId, patientId),
          eq(patientInsurance.organizationId, userOrgId!)
        ))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Insurance record not found" });
      }

      return res.json(updated);
    } catch (error) {
      console.error('Error updating insurance record:', error);
      return res.status(500).json({ message: "Failed to update insurance record" });
    }
  });

  // Delete patient insurance record
  router.delete("/patients/:id/insurance/:insuranceId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const insuranceId = parseInt(req.params.insuranceId);
      const userOrgId = req.user?.organizationId;

      const [deleted] = await db.delete(patientInsurance)
        .where(and(
          eq(patientInsurance.id, insuranceId),
          eq(patientInsurance.patientId, patientId),
          eq(patientInsurance.organizationId, userOrgId!)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Insurance record not found" });
      }

      return res.json({ message: "Insurance record deleted successfully" });
    } catch (error) {
      console.error('Error deleting insurance record:', error);
      return res.status(500).json({ message: "Failed to delete insurance record" });
    }
  });

  // =====================
  // PATIENT MEDICAL HISTORY ROUTES
  // =====================

  // Get patient medical history
  router.get("/patients/:id/medical-history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId!)))
        .limit(1);

      if (!patient) {
        return res.status(403).json({ message: "Access denied - patient not in your organization" });
      }

      const historyRecords = await db.select()
        .from(medicalHistory)
        .where(eq(medicalHistory.patientId, patientId))
        .orderBy(desc(medicalHistory.dateOccurred));

      return res.json(historyRecords);
    } catch (error) {
      console.error('Error fetching patient medical history:', error);
      return res.status(500).json({ message: "Failed to fetch medical history records" });
    }
  });

  // Create patient medical history entry
  router.post("/patients/:id/medical-history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId!)))
        .limit(1);

      if (!patient) {
        return res.status(403).json({ message: "Access denied - patient not in your organization" });
      }

      // Validate required fields
      const requiredFields = ['condition', 'type', 'dateOccurred', 'status', 'description'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          return res.status(400).json({ message: `Missing required field: ${field}` });
        }
      }

      // Sanitize allowed fields only
      const allowedFields = ['condition', 'type', 'dateOccurred', 'status', 'description', 'treatment', 'notes'];
      const validatedData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in req.body) {
          validatedData[key] = req.body[key];
        }
      }

      const historyData = parseAndType(insertMedicalHistorySchema, {
        ...validatedData,
        patientId
      }) as any;
      const [newHistory] = await db.insert(medicalHistory).values(historyData).returning();

      res.status(201).json(newHistory);
    } catch (error) {
      console.error('Error creating medical history entry:', error);
      return res.status(500).json({ message: "Failed to create medical history entry" });
    }
  });

  // Update patient medical history entry
  router.patch("/patients/:id/medical-history/:historyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const historyId = parseInt(req.params.historyId);
      const userOrgId = req.user?.organizationId;

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId!)))
        .limit(1);

      if (!patient) {
        return res.status(403).json({ message: "Access denied - patient not in your organization" });
      }

      // Validate and sanitize update fields
      const allowedFields = ['condition', 'type', 'dateOccurred', 'status', 'description', 'treatment', 'notes'];
      const sanitizedData: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in req.body) {
          sanitizedData[key] = req.body[key];
        }
      }

      const [updated] = await db.update(medicalHistory)
        .set(sanitizedData)
        .where(and(
          eq(medicalHistory.id, historyId),
          eq(medicalHistory.patientId, patientId)
        ))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Medical history entry not found" });
      }

      return res.json(updated);
    } catch (error) {
      console.error('Error updating medical history entry:', error);
      return res.status(500).json({ message: "Failed to update medical history entry" });
    }
  });

  // Delete patient medical history entry
  router.delete("/patients/:id/medical-history/:historyId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const historyId = parseInt(req.params.historyId);
      const userOrgId = req.user?.organizationId;

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId!)))
        .limit(1);

      if (!patient) {
        return res.status(403).json({ message: "Access denied - patient not in your organization" });
      }

      const [deleted] = await db.delete(medicalHistory)
        .where(and(
          eq(medicalHistory.id, historyId),
          eq(medicalHistory.patientId, patientId)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Medical history entry not found" });
      }

      return res.json({ message: "Medical history entry deleted successfully" });
    } catch (error) {
      console.error('Error deleting medical history entry:', error);
      return res.status(500).json({ message: "Failed to delete medical history entry" });
    }
  });

  // =====================
  // PATIENT SAFETY ALERTS ROUTES
  // =====================

  // Get patient safety alerts (dynamic generation based on patient data)
  router.get("/patients/:patientId/safety-alerts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);

      // Verify patient exists and belongs to user's organization (if organizationId is set)
      const whereConditions = [eq(patients.id, patientId)];
      if (req.user?.organizationId) {
        whereConditions.push(eq(patients.organizationId, req.user.organizationId));
      }

      const patient = await db.select()
        .from(patients)
        .where(and(...whereConditions))
        .limit(1);

      if (patient.length === 0) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Generate dynamic safety alerts based on patient data
      const safetyAlertsList = [];
      const patientData = patient[0];

      // Check for allergies
      if (patientData.allergies && patientData.allergies.trim() !== '') {
        safetyAlertsList.push({
          id: `allergy-${patientId}`,
          type: 'critical',
          title: 'Known Allergies',
          description: `Patient has documented allergies: ${patientData.allergies}`,
          category: 'allergy',
          priority: 'high',
          dateAdded: new Date().toISOString(),
          isActive: true,
          metadata: { autoGenerated: true }
        });
      }

      // Check for medical history concerns
      if (patientData.medicalHistory && patientData.medicalHistory.trim() !== '') {
        const criticalConditions = ['diabetes', 'hypertension', 'heart', 'kidney', 'liver'];
        const hasCriticalCondition = criticalConditions.some(condition =>
          patientData.medicalHistory?.toLowerCase().includes(condition)
        );

        if (hasCriticalCondition) {
          safetyAlertsList.push({
            id: `medical-history-${patientId}`,
            type: 'warning',
            title: 'Significant Medical History',
            description: `Patient has significant medical history requiring attention: ${patientData.medicalHistory}`,
            category: 'condition',
            priority: 'medium',
            dateAdded: new Date().toISOString(),
            isActive: true,
            metadata: { autoGenerated: true }
          });
        }
      }

      // Age-based alerts
      if (patientData.dateOfBirth) {
        const age = new Date().getFullYear() - new Date(patientData.dateOfBirth).getFullYear();
        if (age >= 65) {
          safetyAlertsList.push({
            id: `age-alert-${patientId}`,
            type: 'info',
            title: 'Elderly Patient',
            description: `Patient is ${age} years old. Consider age-appropriate dosing and monitoring.`,
            category: 'note',
            priority: 'low',
            dateAdded: new Date().toISOString(),
            isActive: true,
            metadata: { autoGenerated: true, age }
          });
        }
      }

      return res.json(safetyAlertsList);
    } catch (error) {
      console.error("Error fetching patient safety alerts:", error);
      return res.status(500).json({ message: "Failed to fetch safety alerts" });
    }
  });

  // Resolve safety alert
  router.patch("/safety-alerts/:id/resolve", authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id);

      const [resolvedAlert] = await db
        .update(safetyAlerts)
        .set({
          isActive: false,
          dateResolved: new Date(),
          resolvedBy: req.user!.id
        })
        .where(eq(safetyAlerts.id, id))
        .returning();

      if (!resolvedAlert) {
        return res.status(404).json({ error: 'Safety alert not found' });
      }

      // Log audit event if auditLogger is available
      if (req.auditLogger) {
        await req.auditLogger.logPatientAction('RESOLVE_SAFETY_ALERT', resolvedAlert.patientId, {
          alertId: id,
          alertType: resolvedAlert.type
        });
      }

      return res.json(resolvedAlert);
    } catch (error) {
      console.error('Error resolving safety alert:', error);
      return res.status(500).json({ error: 'Failed to resolve safety alert' });
    }
  });

  // =====================
  // DISCHARGE LETTERS ROUTES
  // =====================

  // Get patient discharge letters
  router.get("/patients/:id/discharge-letters", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;

      const letters = await db.select({
        id: dischargeLetters.id,
        patientId: dischargeLetters.patientId,
        visitId: dischargeLetters.visitId,
        admissionDate: dischargeLetters.admissionDate,
        dischargeDate: dischargeLetters.dischargeDate,
        diagnosis: dischargeLetters.diagnosis,
        treatmentSummary: dischargeLetters.treatmentSummary,
        medicationsOnDischarge: dischargeLetters.medicationsOnDischarge,
        followUpInstructions: dischargeLetters.followUpInstructions,
        followUpDate: dischargeLetters.followUpDate,
        dischargeCondition: dischargeLetters.dischargeCondition,
        specialInstructions: dischargeLetters.specialInstructions,
        restrictions: dischargeLetters.restrictions,
        dietaryAdvice: dischargeLetters.dietaryAdvice,
        warningSymptoms: dischargeLetters.warningSymptoms,
        emergencyContact: dischargeLetters.emergencyContact,
        status: dischargeLetters.status,
        createdAt: dischargeLetters.createdAt,
        updatedAt: dischargeLetters.updatedAt,
        attendingPhysician: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        }
      })
        .from(dischargeLetters)
        .leftJoin(users, eq(dischargeLetters.attendingPhysicianId, users.id))
        .where(and(
          eq(dischargeLetters.patientId, patientId),
          eq(dischargeLetters.organizationId, userOrgId!)
        ))
        .orderBy(desc(dischargeLetters.dischargeDate));

      return res.json(letters);
    } catch (error) {
      console.error('Error fetching discharge letters:', error);
      return res.status(500).json({ message: "Failed to fetch discharge letters" });
    }
  });

  // Create discharge letter
  router.post("/patients/:id/discharge-letters", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId;
      const userId = req.user?.id;

      // Verify patient belongs to user's organization
      const [patient] = await db.select().from(patients)
        .where(and(eq(patients.id, patientId), eq(patients.organizationId, userOrgId!)))
        .limit(1);

      if (!patient) {
        return res.status(403).json({ message: "Access denied - patient not in your organization" });
      }

      const dischargeData = {
        patientId,
        visitId: req.body.visitId || null,
        organizationId: userOrgId!,
        admissionDate: req.body.admissionDate || new Date(),
        dischargeDate: req.body.dischargeDate || new Date(),
        diagnosis: req.body.diagnosis,
        treatmentSummary: req.body.treatmentSummary || null,
        medicationsOnDischarge: req.body.medicationsOnDischarge || null,
        followUpInstructions: req.body.followUpInstructions || null,
        followUpDate: req.body.followUpDate || null,
        dischargeCondition: req.body.dischargeCondition || 'stable',
        specialInstructions: req.body.specialInstructions || null,
        restrictions: req.body.restrictions || null,
        dietaryAdvice: req.body.dietaryAdvice || null,
        warningSymptoms: req.body.warningSymptoms || null,
        emergencyContact: req.body.emergencyContact || null,
        status: req.body.status || 'draft',
        attendingPhysicianId: req.body.attendingPhysicianId || userId,
        createdBy: userId
      };

      const [newLetter] = await db.insert(dischargeLetters).values(dischargeData).returning();

      res.status(201).json(newLetter);
    } catch (error) {
      console.error('Error creating discharge letter:', error);
      return res.status(500).json({ message: "Failed to create discharge letter" });
    }
  });

  // =====================
  // PROCEDURAL REPORTS ROUTES
  // =====================

  // Get all procedural reports
  router.get("/procedural-reports", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const result = await db
        .select({
          id: proceduralReports.id,
          patientId: proceduralReports.patientId,
          patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
          performedBy: proceduralReports.performedBy,
          performerName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          procedureType: proceduralReports.procedureType,
          procedureName: proceduralReports.procedureName,
          indication: proceduralReports.indication,
          preOpDiagnosis: proceduralReports.preOpDiagnosis,
          postOpDiagnosis: proceduralReports.postOpDiagnosis,
          procedureDetails: proceduralReports.procedureDetails,
          findings: proceduralReports.findings,
          complications: proceduralReports.complications,
          specimens: proceduralReports.specimens,
          anesthesia: proceduralReports.anesthesia,
          duration: proceduralReports.duration,
          bloodLoss: proceduralReports.bloodLoss,
          status: proceduralReports.status,
          scheduledDate: proceduralReports.scheduledDate,
          startTime: proceduralReports.startTime,
          endTime: proceduralReports.endTime,
          postOpInstructions: proceduralReports.postOpInstructions,
          followUpRequired: proceduralReports.followUpRequired,
          followUpDate: proceduralReports.followUpDate,
          createdAt: proceduralReports.createdAt,
          updatedAt: proceduralReports.updatedAt
        })
        .from(proceduralReports)
        .leftJoin(patients, eq(proceduralReports.patientId, patients.id))
        .leftJoin(users, eq(proceduralReports.performedBy, users.id))
        .where(eq(proceduralReports.organizationId, req.user!.organizationId))
        .orderBy(desc(proceduralReports.createdAt));

      return res.json(result);
    } catch (error) {
      console.error('Error fetching procedural reports:', error);
      return res.status(500).json({ message: "Failed to fetch procedural reports" });
    }
  });

  // Create procedural report
  router.post("/procedural-reports", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertProceduralReportSchema.parse(req.body);

      const [newReport] = await db
        .insert(proceduralReports)
        .values({
          ...validatedData,
          organizationId: req.user!.organizationId,
        })
        .returning();

      res.json(newReport);
    } catch (error) {
      console.error('Error creating procedural report:', error);
      return res.status(500).json({ message: "Failed to create procedural report" });
    }
  });

  // Get procedural report by ID
  router.get("/procedural-reports/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const reportId = parseInt(req.params.id);

      const result = await db
        .select()
        .from(proceduralReports)
        .where(and(
          eq(proceduralReports.id, reportId),
          eq(proceduralReports.organizationId, req.user!.organizationId)
        ))
        .limit(1);

      if (result.length === 0) {
        return res.status(404).json({ message: "Procedural report not found" });
      }

      return res.json(result[0]);
    } catch (error) {
      console.error('Error fetching procedural report:', error);
      return res.status(500).json({ message: "Failed to fetch procedural report" });
    }
  });

  // =====================
  // CONSENT FORMS ROUTES
  // =====================

  // Get all consent forms
  router.get("/consent-forms", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const result = await db
        .select()
        .from(consentForms)
        .where(eq(consentForms.organizationId, req.user!.organizationId))
        .orderBy(desc(consentForms.createdAt));

      return res.json(result);
    } catch (error) {
      console.error('Error fetching consent forms:', error);
      return res.status(500).json({ message: "Failed to fetch consent forms" });
    }
  });

  // Create consent form
  router.post("/consent-forms", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertConsentFormSchema.parse(req.body);

      const [newForm] = await db
        .insert(consentForms)
        .values({
          ...validatedData,
          organizationId: req.user!.organizationId,
        })
        .returning();

      res.json(newForm);
    } catch (error) {
      console.error('Error creating consent form:', error);
      return res.status(500).json({ message: "Failed to create consent form" });
    }
  });

  // =====================
  // PATIENT CONSENTS ROUTES
  // =====================

  // Get all patient consents
  router.get("/patient-consents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const result = await db
        .select({
          id: patientConsents.id,
          patientId: patientConsents.patientId,
          patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
          consentFormId: patientConsents.consentFormId,
          consentFormTitle: consentForms.title,
          proceduralReportId: patientConsents.proceduralReportId,
          consentGivenBy: patientConsents.consentGivenBy,
          guardianName: patientConsents.guardianName,
          guardianRelationship: patientConsents.guardianRelationship,
          witnessId: patientConsents.witnessId,
          witnessName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          interpreterUsed: patientConsents.interpreterUsed,
          interpreterName: patientConsents.interpreterName,
          consentData: patientConsents.consentData,
          digitalSignature: patientConsents.digitalSignature,
          signatureDate: patientConsents.signatureDate,
          expiryDate: patientConsents.expiryDate,
          status: patientConsents.status,
          withdrawnDate: patientConsents.withdrawnDate,
          withdrawnReason: patientConsents.withdrawnReason,
          createdAt: patientConsents.createdAt,
          updatedAt: patientConsents.updatedAt
        })
        .from(patientConsents)
        .leftJoin(patients, eq(patientConsents.patientId, patients.id))
        .leftJoin(consentForms, eq(patientConsents.consentFormId, consentForms.id))
        .leftJoin(users, eq(patientConsents.witnessId, users.id))
        .where(eq(patientConsents.organizationId, req.user!.organizationId))
        .orderBy(desc(patientConsents.createdAt));

      return res.json(result);
    } catch (error) {
      console.error('Error fetching patient consents:', error);
      return res.status(500).json({ message: "Failed to fetch patient consents" });
    }
  });

  // Create patient consent
  router.post("/patient-consents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPatientConsentSchema.parse(req.body);

      const [newConsent] = await db
        .insert(patientConsents)
        .values({
          ...validatedData,
          organizationId: req.user!.organizationId,
        })
        .returning();

      res.json(newConsent);
    } catch (error) {
      console.error('Error capturing patient consent:', error);
      return res.status(500).json({ message: "Failed to capture patient consent" });
    }
  });

  // Get patient-specific consents
  router.get("/patients/:patientId/consents", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);

      const result = await db
        .select({
          id: patientConsents.id,
          consentFormTitle: consentForms.title,
          consentType: consentForms.consentType,
          category: consentForms.category,
          consentGivenBy: patientConsents.consentGivenBy,
          guardianName: patientConsents.guardianName,
          signatureDate: patientConsents.signatureDate,
          status: patientConsents.status,
          expiryDate: patientConsents.expiryDate
        })
        .from(patientConsents)
        .leftJoin(consentForms, eq(patientConsents.consentFormId, consentForms.id))
        .where(and(
          eq(patientConsents.patientId, patientId),
          eq(patientConsents.organizationId, req.user!.organizationId)
        ))
        .orderBy(desc(patientConsents.signatureDate));

      return res.json(result);
    } catch (error) {
      console.error('Error fetching patient consents:', error);
      return res.status(500).json({ message: "Failed to fetch patient consents" });
    }
  });

  // =====================
  // PATIENT REFERRALS ROUTES
  // =====================

  // Get patient referrals
  router.get("/patients/:id/referrals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId || 1;

      if (!patientId || isNaN(patientId)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }

      const referrals = await db.select({
        id: patientReferrals.id,
        patientId: patientReferrals.patientId,
        referredToDoctor: patientReferrals.referredToDoctor,
        referredToFacility: patientReferrals.referredToFacility,
        specialty: patientReferrals.specialty,
        reason: patientReferrals.reason,
        urgency: patientReferrals.urgency,
        status: patientReferrals.status,
        referralDate: patientReferrals.referralDate,
        appointmentDate: patientReferrals.appointmentDate,
        notes: patientReferrals.notes,
        followUpRequired: patientReferrals.followUpRequired,
        followUpDate: patientReferrals.followUpDate,
        createdAt: patientReferrals.createdAt,
        referringDoctor: {
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role
        }
      })
        .from(patientReferrals)
        .leftJoin(users, eq(patientReferrals.referringDoctorId, users.id))
        .where(and(
          eq(patientReferrals.patientId, patientId),
          eq(patientReferrals.organizationId, userOrgId)
        ))
        .orderBy(desc(patientReferrals.createdAt));

      return res.json(referrals);
    } catch (error) {
      console.error('Error fetching patient referrals:', error);
      return res.status(500).json({ message: "Failed to fetch referrals" });
    }
  });

  // Create patient referral
  router.post("/patients/:id/referrals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const userOrgId = req.user?.organizationId || 1;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User authentication required" });
      }

      if (!patientId || isNaN(patientId)) {
        return res.status(400).json({ message: "Invalid patient ID" });
      }

      // Validate required fields
      const missingFields = [];
      if (!req.body.reason || (typeof req.body.reason === 'string' && req.body.reason.trim() === '')) {
        missingFields.push('reason');
      }
      if (!req.body.specialty || (typeof req.body.specialty === 'string' && req.body.specialty.trim() === '')) {
        missingFields.push('specialty');
      }

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: `Missing required fields: ${missingFields.join(', ')}`,
          missingFields
        });
      }

      const [newReferral] = await db.insert(patientReferrals).values({
        ...req.body,
        patientId,
        referringDoctorId: userId,
        organizationId: userOrgId
      }).returning();

      res.status(201).json(newReferral);
    } catch (error: any) {
      console.error('Error creating referral:', error);
      if (error.code === '23505') {
        return res.status(409).json({ message: "A referral with these details already exists" });
      }
      if (error.code === '23503') {
        return res.status(400).json({ message: "Invalid patient or doctor reference" });
      }
      return res.status(500).json({ message: error.message || "Failed to create referral" });
    }
  });

  // Update patient referral
  router.patch("/patients/:id/referrals/:referralId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const referralId = parseInt(req.params.referralId);
      const userOrgId = req.user?.organizationId;

      const [updated] = await db.update(patientReferrals)
        .set({ ...req.body, updatedAt: new Date() })
        .where(and(
          eq(patientReferrals.id, referralId),
          eq(patientReferrals.patientId, patientId),
          eq(patientReferrals.organizationId, userOrgId!)
        ))
        .returning();

      if (!updated) {
        return res.status(404).json({ message: "Referral not found" });
      }

      return res.json(updated);
    } catch (error) {
      console.error('Error updating referral:', error);
      return res.status(500).json({ message: "Failed to update referral" });
    }
  });

  // Delete patient referral
  router.delete("/patients/:id/referrals/:referralId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const referralId = parseInt(req.params.referralId);
      const userOrgId = req.user?.organizationId;

      const [deleted] = await db.delete(patientReferrals)
        .where(and(
          eq(patientReferrals.id, referralId),
          eq(patientReferrals.patientId, patientId),
          eq(patientReferrals.organizationId, userOrgId!)
        ))
        .returning();

      if (!deleted) {
        return res.status(404).json({ message: "Referral not found" });
      }

      return res.json({ message: "Referral deleted successfully" });
    } catch (error) {
      console.error('Error deleting referral:', error);
      return res.status(500).json({ message: "Failed to delete referral" });
    }
  });

  // Send referral via email
  router.post("/patients/:id/referrals/:referralId/send-email", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const referralId = parseInt(req.params.referralId);
      const userOrgId = req.user?.organizationId || 1;
      const { recipientEmail, recipientName, notes } = req.body;

      if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        return res.status(400).json({ message: "Invalid email address format" });
      }

      // Get the referral with patient and doctor information
      const referralData = await db.select({
        referral: {
          id: patientReferrals.id,
          specialty: patientReferrals.specialty,
          reason: patientReferrals.reason,
          urgency: patientReferrals.urgency,
          referredToFacility: patientReferrals.referredToFacility,
          appointmentDate: patientReferrals.appointmentDate,
          notes: patientReferrals.notes
        },
        patient: {
          id: patients.id,
          firstName: patients.firstName,
          lastName: patients.lastName,
          dateOfBirth: patients.dateOfBirth,
          mrn: patients.mrn
        },
        referringDoctor: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
        .from(patientReferrals)
        .innerJoin(patients, eq(patientReferrals.patientId, patients.id))
        .leftJoin(users, eq(patientReferrals.referringDoctorId, users.id))
        .where(and(
          eq(patientReferrals.id, referralId),
          eq(patientReferrals.patientId, patientId),
          eq(patientReferrals.organizationId, userOrgId)
        ))
        .limit(1);

      if (!referralData || referralData.length === 0) {
        return res.status(404).json({ message: "Referral not found" });
      }

      const { referral, patient, referringDoctor } = referralData[0];

      // Get organization info for clinic details
      const [org] = await db.select({
        name: organizations.name,
        phone: organizations.phone,
        email: organizations.email
      })
        .from(organizations)
        .where(eq(organizations.id, userOrgId))
        .limit(1);

      const patientName = `${patient.firstName} ${patient.lastName}`;
      const doctorName = referringDoctor 
        ? `Dr. ${referringDoctor.firstName} ${referringDoctor.lastName}`
        : 'Healthcare Provider';

      // Send the email
      const result = await EmailService.sendReferralNotification({
        recipientEmail,
        recipientName,
        patientName,
        patientDOB: patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }) : undefined,
        patientMRN: patient.mrn || undefined,
        specialty: referral.specialty || 'General',
        reason: referral.reason || '',
        urgency: referral.urgency || 'routine',
        referringDoctorName: doctorName,
        referringFacility: org?.name,
        appointmentDate: referral.appointmentDate 
          ? new Date(referral.appointmentDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
          : undefined,
        notes: notes || referral.notes || undefined,
        clinicName: org?.name,
        clinicPhone: org?.phone || undefined,
        clinicEmail: org?.email || undefined
      });

      if (result.success) {
        // Update the referral status if needed
        await db.update(patientReferrals)
          .set({ 
            status: 'sent',
            updatedAt: new Date()
          })
          .where(eq(patientReferrals.id, referralId));

        return res.json({
          success: true,
          message: "Referral sent successfully via email",
          recipient: recipientEmail,
          messageId: result.messageId
        });
      } else {
        return res.status(500).json({
          success: false,
          message: result.error || "Failed to send referral email"
        });
      }
    } catch (error) {
      console.error('Error sending referral email:', error);
      return res.status(500).json({ message: "Failed to send referral email" });
    }
  });

  // Print referral with organizational letterhead
  router.get("/patients/:id/referrals/:referralId/print", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const referralId = parseInt(req.params.referralId);
      const userOrgId = req.user?.organizationId || 1;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User authentication required" });
      }

      // Get the referral with patient and doctor information using raw SQL for reliability
      const referralData = await db.execute(sql`
        SELECT 
          pr.id as "referralId",
          pr.specialty,
          pr.reason,
          pr.urgency,
          pr.status,
          pr.referred_to_doctor as "referredToDoctor",
          pr.referred_to_facility as "referredToFacility",
          pr.referral_date as "referralDate",
          pr.appointment_date as "appointmentDate",
          pr.notes,
          pr.follow_up_required as "followUpRequired",
          pr.follow_up_date as "followUpDate",
          pr.created_at as "createdAt",
          p.id as "patientId",
          p.first_name as "patientFirstName",
          p.last_name as "patientLastName",
          p.date_of_birth as "patientDateOfBirth",
          p.gender as "patientGender",
          p.phone as "patientPhone",
          p.address as "patientAddress",
          p.national_id as "patientMrn",
          u.id as "doctorId",
          u.username as "doctorUsername",
          u.first_name as "doctorFirstName",
          u.last_name as "doctorLastName",
          u.role as "doctorRole"
        FROM patient_referrals pr
        INNER JOIN patients p ON pr.patient_id = p.id
        LEFT JOIN users u ON pr.referring_doctor_id = u.id
        WHERE pr.id = ${referralId}
          AND pr.patient_id = ${patientId}
          AND pr.organization_id = ${userOrgId}
        LIMIT 1
      `);

      if (!referralData.rows || referralData.rows.length === 0) {
        return res.status(404).json({ message: "Referral not found" });
      }

      const result = referralData.rows[0] as any;

      // Get organization info for letterhead
      const [org] = await db.select({
        name: organizations.name,
        type: organizations.type,
        address: organizations.address,
        phone: organizations.phone,
        email: organizations.email,
        website: organizations.website,
        themeColor: organizations.themeColor
      })
        .from(organizations)
        .where(eq(organizations.id, userOrgId))
        .limit(1);

      // Combine all data for the HTML generator
      const printData = {
        // Referral data
        referralId: result.referralId,
        specialty: result.specialty,
        reason: result.reason,
        urgency: result.urgency,
        status: result.status,
        referredToDoctor: result.referredToDoctor,
        referredToFacility: result.referredToFacility,
        referralDate: result.referralDate,
        appointmentDate: result.appointmentDate,
        notes: result.notes,
        followUpRequired: result.followUpRequired,
        followUpDate: result.followUpDate,
        createdAt: result.createdAt,
        
        // Patient data
        patientId: result.patientId,
        patientFirstName: result.patientFirstName,
        patientLastName: result.patientLastName,
        patientDateOfBirth: result.patientDateOfBirth,
        patientGender: result.patientGender,
        patientPhone: result.patientPhone,
        patientAddress: result.patientAddress,
        patientMrn: result.patientMrn,
        
        // Doctor data
        doctorId: result.doctorId,
        doctorUsername: result.doctorUsername,
        doctorFirstName: result.doctorFirstName,
        doctorLastName: result.doctorLastName,
        doctorRole: result.doctorRole,
        
        // Organization data
        organizationName: org?.name,
        organizationType: org?.type,
        organizationAddress: org?.address,
        organizationPhone: org?.phone,
        organizationEmail: org?.email,
        organizationWebsite: org?.website,
        organizationTheme: org?.themeColor
      };

      // Generate HTML
      const html = generateReferralHTML(printData);

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating referral print:', error);
      return res.status(500).json({ message: "Failed to generate referral print" });
    }
  });

  return router;
}

export default setupPatientExtendedRoutes;

