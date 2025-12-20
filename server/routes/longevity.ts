import { Router } from "express";
import { authenticateToken, requireAnyRole, type AuthRequest } from "../middleware/auth";
import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import {
  lifestyleAssessments,
  bodyComposition,
  mentalHealthScreenings,
  socialDeterminants,
  advancedBiomarkers,
  heartRateVariability,
  insertLifestyleAssessmentSchema,
  insertBodyCompositionSchema,
  insertMentalHealthScreeningSchema,
  insertSocialDeterminantSchema,
  insertAdvancedBiomarkerSchema,
  insertHeartRateVariabilitySchema
} from "@shared/schema";

export function setupLongevityRoutes() {
  const router = Router();

  // =====================
  // LIFESTYLE ASSESSMENTS
  // =====================

  // Get patient lifestyle assessments
  router.get('/patients/:patientId/lifestyle-assessments', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const assessments = await db.select()
        .from(lifestyleAssessments)
        .where(and(
          eq(lifestyleAssessments.patientId, patientId),
          eq(lifestyleAssessments.organizationId, userOrgId)
        ))
        .orderBy(desc(lifestyleAssessments.assessmentDate));

      return res.json(assessments);
    } catch (error) {
      console.error('Error fetching lifestyle assessments:', error);
      return res.status(500).json({ message: "Failed to fetch lifestyle assessments" });
    }
  });

  // Create lifestyle assessment
  router.post('/patients/:patientId/lifestyle-assessments', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const assessmentData = {
        ...req.body,
        patientId,
        organizationId: userOrgId,
        assessedBy: req.user?.username || 'Unknown'
      };

      const [newAssessment] = await db.insert(lifestyleAssessments)
        .values(assessmentData)
        .returning();

      return res.status(201).json(newAssessment);
    } catch (error) {
      console.error('Error creating lifestyle assessment:', error);
      return res.status(500).json({ message: "Failed to create lifestyle assessment" });
    }
  });

  // =====================
  // BODY COMPOSITION
  // =====================

  // Get patient body composition records
  router.get('/patients/:patientId/body-composition', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const records = await db.select()
        .from(bodyComposition)
        .where(and(
          eq(bodyComposition.patientId, patientId),
          eq(bodyComposition.organizationId, userOrgId)
        ))
        .orderBy(desc(bodyComposition.measuredAt));

      return res.json(records);
    } catch (error) {
      console.error('Error fetching body composition:', error);
      return res.status(500).json({ message: "Failed to fetch body composition" });
    }
  });

  // Create body composition record
  router.post('/patients/:patientId/body-composition', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Calculate BMI if height and weight provided
      let bmi = req.body.bmi;
      if (!bmi && req.body.weight && req.body.height) {
        const heightM = parseFloat(req.body.height) / 100;
        bmi = parseFloat(req.body.weight) / (heightM * heightM);
      }

      // Calculate waist-to-hip ratio if both provided
      let waistToHipRatio = req.body.waistToHipRatio;
      if (!waistToHipRatio && req.body.waistCircumferenceCm && req.body.hipCircumferenceCm) {
        waistToHipRatio = parseFloat(req.body.waistCircumferenceCm) / parseFloat(req.body.hipCircumferenceCm);
      }

      const recordData = {
        ...req.body,
        patientId,
        organizationId: userOrgId,
        bmi,
        waistToHipRatio,
        measuredBy: req.user?.username || 'Unknown'
      };

      const [newRecord] = await db.insert(bodyComposition)
        .values(recordData)
        .returning();

      return res.status(201).json(newRecord);
    } catch (error) {
      console.error('Error creating body composition record:', error);
      return res.status(500).json({ message: "Failed to create body composition record" });
    }
  });

  // =====================
  // MENTAL HEALTH SCREENINGS
  // =====================

  // Get patient mental health screenings
  router.get('/patients/:patientId/mental-health-screenings', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'psychiatrist', 'psychologist']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const screenings = await db.select()
        .from(mentalHealthScreenings)
        .where(and(
          eq(mentalHealthScreenings.patientId, patientId),
          eq(mentalHealthScreenings.organizationId, userOrgId)
        ))
        .orderBy(desc(mentalHealthScreenings.screeningDate));

      return res.json(screenings);
    } catch (error) {
      console.error('Error fetching mental health screenings:', error);
      return res.status(500).json({ message: "Failed to fetch mental health screenings" });
    }
  });

  // Create mental health screening
  router.post('/patients/:patientId/mental-health-screenings', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'psychiatrist', 'psychologist']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Calculate PHQ-9 severity
      let phq9Severity = req.body.phq9Severity;
      if (!phq9Severity && req.body.phq9Score !== undefined) {
        const score = req.body.phq9Score;
        if (score <= 4) phq9Severity = 'minimal';
        else if (score <= 9) phq9Severity = 'mild';
        else if (score <= 14) phq9Severity = 'moderate';
        else if (score <= 19) phq9Severity = 'moderately_severe';
        else phq9Severity = 'severe';
      }

      // Calculate GAD-7 severity
      let gad7Severity = req.body.gad7Severity;
      if (!gad7Severity && req.body.gad7Score !== undefined) {
        const score = req.body.gad7Score;
        if (score <= 4) gad7Severity = 'minimal';
        else if (score <= 9) gad7Severity = 'mild';
        else if (score <= 14) gad7Severity = 'moderate';
        else gad7Severity = 'severe';
      }

      const screeningData = {
        ...req.body,
        patientId,
        organizationId: userOrgId,
        phq9Severity,
        gad7Severity,
        screenedBy: req.user?.username || 'Unknown'
      };

      const [newScreening] = await db.insert(mentalHealthScreenings)
        .values(screeningData)
        .returning();

      return res.status(201).json(newScreening);
    } catch (error) {
      console.error('Error creating mental health screening:', error);
      return res.status(500).json({ message: "Failed to create mental health screening" });
    }
  });

  // =====================
  // SOCIAL DETERMINANTS
  // =====================

  // Get patient social determinants
  router.get('/patients/:patientId/social-determinants', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker', 'social_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const records = await db.select()
        .from(socialDeterminants)
        .where(and(
          eq(socialDeterminants.patientId, patientId),
          eq(socialDeterminants.organizationId, userOrgId)
        ))
        .orderBy(desc(socialDeterminants.assessmentDate));

      return res.json(records);
    } catch (error) {
      console.error('Error fetching social determinants:', error);
      return res.status(500).json({ message: "Failed to fetch social determinants" });
    }
  });

  // Create social determinants record
  router.post('/patients/:patientId/social-determinants', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker', 'social_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const recordData = {
        ...req.body,
        patientId,
        organizationId: userOrgId,
        assessedBy: req.user?.username || 'Unknown'
      };

      const [newRecord] = await db.insert(socialDeterminants)
        .values(recordData)
        .returning();

      return res.status(201).json(newRecord);
    } catch (error) {
      console.error('Error creating social determinants record:', error);
      return res.status(500).json({ message: "Failed to create social determinants record" });
    }
  });

  // =====================
  // ADVANCED BIOMARKERS
  // =====================

  // Get patient advanced biomarkers
  router.get('/patients/:patientId/advanced-biomarkers', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const records = await db.select()
        .from(advancedBiomarkers)
        .where(and(
          eq(advancedBiomarkers.patientId, patientId),
          eq(advancedBiomarkers.organizationId, userOrgId)
        ))
        .orderBy(desc(advancedBiomarkers.testDate));

      return res.json(records);
    } catch (error) {
      console.error('Error fetching advanced biomarkers:', error);
      return res.status(500).json({ message: "Failed to fetch advanced biomarkers" });
    }
  });

  // Create advanced biomarkers record
  router.post('/patients/:patientId/advanced-biomarkers', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Calculate HOMA-IR if insulin and glucose provided
      let homaIr = req.body.homaIr;
      if (!homaIr && req.body.insulinMiuL && req.body.fastingGlucoseMgDl) {
        homaIr = (parseFloat(req.body.insulinMiuL) * parseFloat(req.body.fastingGlucoseMgDl)) / 405;
      }

      const recordData = {
        ...req.body,
        patientId,
        organizationId: userOrgId,
        homaIr
      };

      const [newRecord] = await db.insert(advancedBiomarkers)
        .values(recordData)
        .returning();

      return res.status(201).json(newRecord);
    } catch (error) {
      console.error('Error creating advanced biomarkers record:', error);
      return res.status(500).json({ message: "Failed to create advanced biomarkers record" });
    }
  });

  // =====================
  // HEART RATE VARIABILITY
  // =====================

  // Get patient HRV records
  router.get('/patients/:patientId/hrv', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      const records = await db.select()
        .from(heartRateVariability)
        .where(and(
          eq(heartRateVariability.patientId, patientId),
          eq(heartRateVariability.organizationId, userOrgId)
        ))
        .orderBy(desc(heartRateVariability.measuredAt));

      return res.json(records);
    } catch (error) {
      console.error('Error fetching HRV records:', error);
      return res.status(500).json({ message: "Failed to fetch HRV records" });
    }
  });

  // Create HRV record
  router.post('/patients/:patientId/hrv', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin', 'health_worker']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Calculate LF/HF ratio if both provided
      let lfHfRatio = req.body.lfHfRatio;
      if (!lfHfRatio && req.body.lfPowerMs2 && req.body.hfPowerMs2) {
        lfHfRatio = parseFloat(req.body.lfPowerMs2) / parseFloat(req.body.hfPowerMs2);
      }

      const recordData = {
        ...req.body,
        patientId,
        organizationId: userOrgId,
        lfHfRatio
      };

      const [newRecord] = await db.insert(heartRateVariability)
        .values(recordData)
        .returning();

      return res.status(201).json(newRecord);
    } catch (error) {
      console.error('Error creating HRV record:', error);
      return res.status(500).json({ message: "Failed to create HRV record" });
    }
  });

  // =====================
  // COMPREHENSIVE LONGEVITY SCORE
  // =====================

  // Get comprehensive longevity data for a patient
  router.get('/patients/:patientId/longevity-data', authenticateToken, requireAnyRole(['doctor', 'nurse', 'admin']), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.patientId);
      const userOrgId = req.user?.organizationId;

      if (!userOrgId) {
        return res.status(400).json({ message: "Organization context required" });
      }

      // Fetch all longevity-related data in parallel
      const [
        lifestyle,
        body,
        mentalHealth,
        social,
        biomarkers,
        hrv
      ] = await Promise.all([
        db.select().from(lifestyleAssessments)
          .where(and(eq(lifestyleAssessments.patientId, patientId), eq(lifestyleAssessments.organizationId, userOrgId)))
          .orderBy(desc(lifestyleAssessments.assessmentDate))
          .limit(1),
        db.select().from(bodyComposition)
          .where(and(eq(bodyComposition.patientId, patientId), eq(bodyComposition.organizationId, userOrgId)))
          .orderBy(desc(bodyComposition.measuredAt))
          .limit(1),
        db.select().from(mentalHealthScreenings)
          .where(and(eq(mentalHealthScreenings.patientId, patientId), eq(mentalHealthScreenings.organizationId, userOrgId)))
          .orderBy(desc(mentalHealthScreenings.screeningDate))
          .limit(1),
        db.select().from(socialDeterminants)
          .where(and(eq(socialDeterminants.patientId, patientId), eq(socialDeterminants.organizationId, userOrgId)))
          .orderBy(desc(socialDeterminants.assessmentDate))
          .limit(1),
        db.select().from(advancedBiomarkers)
          .where(and(eq(advancedBiomarkers.patientId, patientId), eq(advancedBiomarkers.organizationId, userOrgId)))
          .orderBy(desc(advancedBiomarkers.testDate))
          .limit(1),
        db.select().from(heartRateVariability)
          .where(and(eq(heartRateVariability.patientId, patientId), eq(heartRateVariability.organizationId, userOrgId)))
          .orderBy(desc(heartRateVariability.measuredAt))
          .limit(1)
      ]);

      return res.json({
        lifestyle: lifestyle[0] || null,
        bodyComposition: body[0] || null,
        mentalHealth: mentalHealth[0] || null,
        socialDeterminants: social[0] || null,
        advancedBiomarkers: biomarkers[0] || null,
        hrv: hrv[0] || null
      });
    } catch (error) {
      console.error('Error fetching longevity data:', error);
      return res.status(500).json({ message: "Failed to fetch longevity data" });
    }
  });

  return router;
}

