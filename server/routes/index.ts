import type { Express } from "express";
import { setupPatientRoutes } from "./patients";
import { setupLaboratoryRoutes } from "./laboratory";
import { setupPrescriptionRoutes } from "./prescriptions";
import { setupPatientExtendedRoutes } from "./patient-extended";
import publicApiRouter from "./public-api";
import mobileApiRouter from "./mobile-api";
import apiKeysRouter from "./api-keys";
import apiDocsRouter from "./api-docs";
import accessControlRouter from "./access-control";
import organizationsRouter from "./organizations";
import authRouter from "./auth";
import healthRouter from "./health";
import profileRouter from "./profile";
import { setupTabConfigRoutes } from "./tab-configs";
import { setupTabPresetRoutes } from "./tab-presets";
import { setupVisitRoutes } from "./visits";
import { setupLabResultsRoutes } from "./lab-results";
import { setupMedicinesRoutes } from "./medicines";
import { setupReferralRoutes } from "./referrals";
import { setupVaccinationRoutes } from "./vaccinations";
import { setupAppointmentRoutes } from "./appointments";
import { setupBillingRoutes } from "./billing";
import { setupAnalyticsRoutes } from "./analytics";
import { setupNotificationRoutes } from "./notifications";
import { setupSuggestionRoutes } from "./suggestions";
import { setupSystemRoutes } from "./system";
import { setupUsersRoutes } from "./users";
import { setupPerformanceRoutes } from "./performance";
import { setupIntegrationsRoutes } from "./integrations";
import { setupLongevityRoutes } from "./longevity";
import { setupPatientPortalRoutes } from "./patient-portal";
import { setupTelemedicineRoutes } from "./telemedicine";
import { setupDashboardRoutes } from "./dashboard";
import { setupFilesRoutes } from "./files";
import { setupPrintRoutes } from "./print";
// import { setupBillingRoutes } from "./billing";
// import { setupSystemRoutes } from "./system";

/**
 * Sets up all route modules for the healthcare management system
 * This replaces the monolithic routes.ts file with organized, domain-specific modules
 */
export function setupRoutes(app: Express): void {
  console.log("=== SETTING UP MODULAR ROUTES ===");
  
  // Health check routes (for monitoring)
  console.log("Setting up health check routes...");
  app.use('/api/health', healthRouter);
  
  // Authentication routes (must be first for security)
  console.log("Setting up authentication routes...");
  app.use('/api/auth', authRouter);
  
  // Profile routes
  console.log("Setting up profile routes...");
  app.use('/api/profile', profileRouter);
  
  // Core healthcare functionality - ONLY modules that exist
  console.log("Setting up patient routes...");
  const patientRouter = setupPatientRoutes();
  app.use('/api', patientRouter);
  
  console.log("Setting up laboratory routes...");
  const laboratoryRouter = setupLaboratoryRoutes();
  app.use('/api', laboratoryRouter);
  
  console.log("Setting up prescription routes...");
  const prescriptionRouter = setupPrescriptionRoutes();
  app.use('/api', prescriptionRouter);
  
  console.log("Setting up patient extended routes (allergies, immunizations, imaging, procedures)...");
  const patientExtendedRouter = setupPatientExtendedRoutes();
  app.use('/api', patientExtendedRouter);
  
  // Visit routes
  console.log("Setting up visit routes...");
  const visitRouter = setupVisitRoutes();
  app.use('/api', visitRouter);
  
  // Lab Results routes
  console.log("Setting up lab results routes...");
  const labResultsRouter = setupLabResultsRoutes();
  app.use('/api', labResultsRouter);
  
  // Medicines routes
  console.log("Setting up medicines routes...");
  const medicinesRouter = setupMedicinesRoutes();
  app.use('/api', medicinesRouter);
  
  // Referrals routes
  console.log("Setting up referrals routes...");
  const referralsRouter = setupReferralRoutes();
  app.use('/api', referralsRouter);
  
  // Vaccinations routes
  console.log("Setting up vaccinations routes...");
  const vaccinationsRouter = setupVaccinationRoutes();
  app.use('/api', vaccinationsRouter);
  
  // Appointments routes
  console.log("Setting up appointments routes...");
  const appointmentsRouter = setupAppointmentRoutes();
  app.use('/api', appointmentsRouter);
  
  // Billing routes
  console.log("Setting up billing routes...");
  const billingRouter = setupBillingRoutes();
  app.use('/api', billingRouter);
  
  // Analytics routes
  console.log("Setting up analytics routes...");
  const analyticsRouter = setupAnalyticsRoutes();
  app.use('/api', analyticsRouter);
  
  // Notifications routes
  console.log("Setting up notifications routes...");
  const notificationsRouter = setupNotificationRoutes();
  app.use('/api', notificationsRouter);
  
  // Suggestions routes
  console.log("Setting up suggestions routes...");
  const suggestionsRouter = setupSuggestionRoutes();
  app.use('/api', suggestionsRouter);
  
  // Users routes
  console.log("Setting up users routes...");
  const usersRouter = setupUsersRoutes();
  app.use('/api', usersRouter);
  
  // System routes
  console.log("Setting up system routes...");
  const systemRouter = setupSystemRoutes();
  app.use('/api', systemRouter);
  
  // Performance & Monitoring routes
  console.log("Setting up performance routes...");
  const performanceRouter = setupPerformanceRoutes();
  app.use('/api', performanceRouter);
  
  // Healthcare Integrations routes (FHIR, Lab Sync, E-prescribing, etc.)
  console.log("Setting up healthcare integrations routes...");
  const integrationsRouter = setupIntegrationsRoutes();
  app.use('/api', integrationsRouter);
  
  // Longevity Assessment routes (lifestyle, body composition, mental health, biomarkers)
  console.log("Setting up longevity assessment routes...");
  const longevityRouter = setupLongevityRoutes();
  app.use('/api', longevityRouter);
  
  // Public REST API routes
  console.log("Setting up public API routes...");
  app.use('/api/v1', publicApiRouter);
  
  // Mobile-optimized API routes
  console.log("Setting up mobile API routes...");
  app.use('/api/mobile', mobileApiRouter);
  
  // API Keys management routes
  console.log("Setting up API keys management routes...");
  app.use('/api/api-keys', apiKeysRouter);
  
  // API Documentation routes
  console.log("Setting up API documentation routes...");
  app.use('/api/docs', apiDocsRouter);
  
  // Access Control & Role Management routes
  console.log("Setting up access control routes...");
  app.use('/api/access-control', accessControlRouter);
  
  // Organization Management routes
  console.log("Setting up organization management routes...");
  app.use('/api/organizations', organizationsRouter);
  
  // Tab Configurations routes
  console.log("Setting up tab configurations routes...");
  setupTabConfigRoutes(app);
  
  // Tab Presets routes
  console.log("Setting up tab presets routes...");
  setupTabPresetRoutes(app);
  
  // Patient Portal routes
  console.log("Setting up patient portal routes...");
  setupPatientPortalRoutes(app);
  
  // Dashboard routes
  console.log("Setting up dashboard routes...");
  const dashboardRouter = setupDashboardRoutes();
  app.use('/api', dashboardRouter);
  
  // Telemedicine routes
  console.log("Setting up telemedicine routes...");
  const telemedicineRouter = setupTelemedicineRoutes();
  app.use('/api', telemedicineRouter);
  
  // Files routes
  console.log("Setting up files routes...");
  const filesRouter = setupFilesRoutes();
  app.use('/api', filesRouter);
  
  // TODO: Add remaining modules as they are migrated from routes.ts:
  // setupAppointmentRoutes(app);
  // setupAnalyticsRoutes(app);
  // setupBillingRoutes(app);
  // setupIntegrationRoutes(app);
  // setupSuggestionRoutes(app);
  // setupNotificationRoutes(app);
  // setupSystemRoutes(app);
  
  console.log("=== ROUTES SETUP COMPLETE ===");
}