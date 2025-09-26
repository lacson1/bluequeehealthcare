import type { Express } from "express";
import { setupPatientRoutes } from "./patients";
import { setupLaboratoryRoutes } from "./laboratory";
import { setupPrescriptionRoutes } from "./prescriptions";
// import { setupAppointmentRoutes } from "./appointments";
// import { setupAuthRoutes } from "./auth";
// import { setupAnalyticsRoutes } from "./analytics";
// import { setupIntegrationRoutes } from "./integrations";
// import { setupSuggestionRoutes } from "./suggestions";
// import { setupNotificationRoutes } from "./notifications";
// import { setupPatientPortalRoutes } from "./patient-portal";
// import { setupBillingRoutes } from "./billing";
// import { setupSystemRoutes } from "./system";

/**
 * Sets up all route modules for the healthcare management system
 * This replaces the monolithic routes.ts file with organized, domain-specific modules
 */
export function setupRoutes(app: Express): void {
  console.log("=== SETTING UP MODULAR ROUTES ===");
  
  // Core healthcare functionality - ONLY modules that exist
  console.log("Setting up patient routes...");
  setupPatientRoutes(app);
  
  console.log("Setting up laboratory routes...");
  const laboratoryRouter = setupLaboratoryRoutes();
  app.use('/api', laboratoryRouter);
  
  console.log("Setting up prescription routes...");
  setupPrescriptionRoutes(app);
  
  // TODO: Add remaining modules as they are created:
  // setupAppointmentRoutes(app);
  // setupAuthRoutes(app);
  // setupAnalyticsRoutes(app);
  // setupBillingRoutes(app);
  // setupIntegrationRoutes(app);
  // setupPatientPortalRoutes(app);
  // setupSuggestionRoutes(app);
  // setupNotificationRoutes(app);
  // setupSystemRoutes(app);
  
  console.log("=== ROUTES SETUP COMPLETE ===");
}