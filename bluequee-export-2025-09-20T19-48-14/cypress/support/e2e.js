// Custom commands for clinic management system testing
Cypress.Commands.add('loginAsDoctor', () => {
  cy.visit('/login')
  cy.get('[data-cy=username]').type('ade')
  cy.get('[data-cy=password]').type('doctor123')
  cy.get('[data-cy=login-button]').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('loginAsNurse', () => {
  cy.visit('/login')
  cy.get('[data-cy=username]').type('syb')
  cy.get('[data-cy=password]').type('nurse123')
  cy.get('[data-cy=login-button]').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.visit('/login')
  cy.get('[data-cy=username]').type('admin')
  cy.get('[data-cy=password]').type('admin123')
  cy.get('[data-cy=login-button]').click()
  cy.url().should('include', '/dashboard')
})

Cypress.Commands.add('navigateToPatient', (patientId) => {
  cy.visit(`/patients/${patientId}`)
  cy.get('[data-cy=patient-overview]').should('be.visible')
})

Cypress.Commands.add('selectConsultationForm', (formName) => {
  cy.get('[data-cy=consultation-forms]').within(() => {
    cy.contains(formName).click()
  })
  cy.get('[data-cy=selected-form]').should('contain', formName)
})

Cypress.Commands.add('fillConsultationField', (fieldLabel, value) => {
  cy.get('[data-cy=consultation-form]').within(() => {
    cy.get(`[data-cy="field-${fieldLabel}"]`).type(value)
  })
})

Cypress.Commands.add('submitConsultation', () => {
  cy.get('[data-cy=submit-consultation]').click()
  cy.get('[data-cy=success-toast]').should('be.visible')
})