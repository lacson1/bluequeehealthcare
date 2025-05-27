import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertVisitSchema, insertLabResultSchema, insertMedicineSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Patients routes
  app.post("/api/patients", async (req, res) => {
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

  app.get("/api/patients", async (req, res) => {
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

  // Visits routes
  app.post("/api/patients/:id/visits", async (req, res) => {
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

  // Medicines routes
  app.post("/api/medicines", async (req, res) => {
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

  app.get("/api/medicines", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
