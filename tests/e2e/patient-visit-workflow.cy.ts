/**
 * E2E Test: Complete Patient Visit Workflow
 * Tests: Login → Patient Search → Create Visit → Lab Order → Prescription
 */
describe('Patient Visit Workflow E2E', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('http://localhost:5001');
    
    // Login (adjust selectors based on actual login form)
    cy.get('input[name="username"]').type('testuser');
    cy.get('input[name="password"]').type('testpass');
    cy.get('button[type="submit"]').click();
    
    // Wait for dashboard to load
    cy.url().should('include', '/dashboard');
  });

  it('should complete full patient visit workflow', () => {
    // Step 1: Navigate to Patients
    cy.contains('Patients').click();
    cy.url().should('include', '/patients');

    // Step 2: Search for patient
    cy.get('input[placeholder*="Search"]').type('Test Patient');
    cy.wait(500);

    // Step 3: Click on patient (or create new if none exists)
    cy.contains('Test Patient').first().click();
    cy.url().should('include', '/patients/');

    // Step 4: Record Visit
    cy.contains('Record Visit').click();
    cy.get('input[name="chiefComplaint"]').type('Fever and cough');
    cy.get('button').contains('Save').click();
    cy.contains('Visit recorded').should('be.visible');

    // Step 5: Create Lab Order
    cy.contains('Lab Orders').click();
    cy.contains('New Lab Order').click();
    cy.get('input[type="checkbox"]').first().check();
    cy.get('button').contains('Create Order').click();
    cy.contains('Lab order created').should('be.visible');

    // Step 6: Create Prescription
    cy.contains('Prescriptions').click();
    cy.contains('New Prescription').click();
    cy.get('input[name="medicationName"]').type('Paracetamol');
    cy.get('input[name="dosage"]').type('500mg');
    cy.get('button').contains('Prescribe').click();
    cy.contains('Prescription created').should('be.visible');
  });

  it('should navigate between patient tabs', () => {
    // Navigate to patient profile
    cy.visit('http://localhost:5001/patients/1');
    
    // Test tab navigation
    cy.contains('Visits').click();
    cy.contains('Lab Results').click();
    cy.contains('Medications').click();
    cy.contains('Overview').click();
  });
});

