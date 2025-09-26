import type { Express } from "express";
import { setupPatientRoutes } from "./patients";
import { setupLaboratoryRoutes } from "./laboratory";
import { setupPrescriptionRoutes } from "./prescriptions";
import { setupAppointmentRoutes } from "./appointments";
import { setupAuthRoutes } from "./auth";
import { setupAnalyticsRoutes } from "./analytics";
import { setupIntegrationRoutes } from "./integrations";
import { setupSuggestionRoutes } from "./suggestions";
import { setupNotificationRoutes } from "./notifications";
import { setupPatientPortalRoutes } from "./patient-portal";
import { setupBillingRoutes } from "./billing";
import { setupSystemRoutes } from "./system";

/**
 * Sets up all route modules for the healthcare management system
 * This replaces the monolithic routes.ts file with organized, domain-specific modules
 */
export function setupRoutes(app: Express): void {
  // Core healthcare functionality
  setupPatientRoutes(app);
  setupLaboratoryRoutes(app);
  setupPrescriptionRoutes(app);
  setupAppointmentRoutes(app);
  
  // System & administration
  setupAuthRoutes(app);
  setupAnalyticsRoutes(app);
  setupBillingRoutes(app);
  
  // External integrations
  setupIntegrationRoutes(app);
  setupPatientPortalRoutes(app);
  
  // Support features
  setupSuggestionRoutes(app);
  setupNotificationRoutes(app);
  setupSystemRoutes(app);
}