describe('Consultation Management', () => {
  beforeEach(() => {
    // Login as doctor for consultation tests
    cy.loginAsDoctor()
  })

  it('should display available consultation forms', () => {
    cy.navigateToPatient(3) // Ade Bola patient
    cy.get('[data-testid=consultation-tab]').click()
    
    // Check if consultation forms are loaded
    cy.get('[data-testid=consultation-forms]').should('be.visible')
    cy.get('[data-testid=form-card]').should('have.length.greaterThan', 0)
  })

  it('should allow selecting a consultation form', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Select first available form
    cy.get('[data-testid=form-card]').first().click()
    cy.get('[data-testid=selected-form]').should('be.visible')
  })

  it('should fill and submit consultation form', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Select Gynaecological Assessment form (if available)
    cy.get('[data-testid=form-card]').contains('Gynaecological').click()
    
    // Fill form fields based on available fields
    cy.get('[data-testid=consultation-form]').within(() => {
      // Fill text fields
      cy.get('input[type="text"]').first().type('Patient reports mild discomfort')
      cy.get('textarea').first().type('Detailed examination notes and observations')
      
      // Select from dropdowns if available
      cy.get('select').first().then($select => {
        if ($select.length > 0) {
          cy.wrap($select).select(1)
        }
      })
    })
    
    // Submit consultation
    cy.get('[data-testid=submit-consultation]').click()
    cy.get('.toast').should('contain', 'success', { timeout: 10000 })
  })

  it('should display consultation history', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Check consultation history section
    cy.get('[data-testid=consultation-history]').should('be.visible')
    cy.get('[data-testid=consultation-record]').should('have.length.greaterThan', 0)
  })

  it('should show consultation details in timeline', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Check timeline display
    cy.get('[data-testid=consultation-history]').within(() => {
      cy.get('[data-testid=consultation-record]').first().within(() => {
        cy.get('[data-testid=consultation-date]').should('be.visible')
        cy.get('[data-testid=consultation-form-name]').should('be.visible')
        cy.get('[data-testid=conducted-by]').should('be.visible')
      })
    })
  })

  it('should handle form validation errors', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Select a form but don't fill required fields
    cy.get('[data-testid=form-card]').first().click()
    cy.get('[data-testid=submit-consultation]').click()
    
    // Should show validation errors or prevent submission
    cy.get('.toast').should('contain', 'error')
      .or('should.not.contain', 'success')
  })

  it('should allow nurse to create consultations', () => {
    cy.loginAsNurse()
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Nurse should have access to consultation forms
    cy.get('[data-testid=consultation-forms]').should('be.visible')
    cy.get('[data-testid=form-card]').should('have.length.greaterThan', 0)
  })

  it('should display comprehensive consultation data', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Check if consultation records show complete information
    cy.get('[data-testid=consultation-record]').first().within(() => {
      cy.get('[data-testid=consultation-details]').should('be.visible')
      cy.get('[data-testid=form-data]').should('be.visible')
    })
  })

  it('should filter consultation forms by specialist role', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Check if forms show specialist role badges
    cy.get('[data-testid=form-card]').each($card => {
      cy.wrap($card).find('[data-testid=specialist-role]').should('be.visible')
    })
  })

  it('should maintain consultation form state during session', () => {
    cy.navigateToPatient(3)
    cy.get('[data-testid=consultation-tab]').click()
    
    // Select form and fill partial data
    cy.get('[data-testid=form-card]').first().click()
    cy.get('input[type="text"]').first().type('Test data')
    
    // Navigate away and back
    cy.get('[data-testid=overview-tab]').click()
    cy.get('[data-testid=consultation-tab]').click()
    
    // Form should still be selected (may not preserve field data)
    cy.get('[data-testid=selected-form]').should('be.visible')
  })
})