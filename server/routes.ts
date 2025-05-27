import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertVisitSchema, insertLabResultSchema, insertMedicineSchema, insertPrescriptionSchema, insertUserSchema, insertReferralSchema } from "@shared/schema";
import { z } from "zod";
import { authenticateToken, requireRole, requireAnyRole, hashPassword, comparePassword, generateToken, type AuthRequest } from "./middleware/auth";

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.json(patient);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patient" });
    }
  });

  // Visits routes - Only doctors can create visits
  app.post("/api/patients/:id/visits", authenticateToken, requireRole('doctor'), async (req: AuthRequest, res) => {
    try {
      const patientId = parseInt(req.params.id);
      const visitData = insertVisitSchema.parse({ ...req.body, patientId });
      const visit = await storage.createVisit(visitData);
      res.json(visit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid visit data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create visit" });
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

  // Low stock medicines
  app.get("/api/medicines/low-stock", async (req, res) => {
    try {
      const lowStockMedicines = await storage.getLowStockMedicines();
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
  app.post("/api/users", authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      userData.password = await hashPassword(userData.password);
      const user = await storage.createUser(userData);
      res.json({ ...user, password: undefined }); // Don't return password
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create user" });
      }
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

  const httpServer = createServer(app);
  return httpServer;
}
