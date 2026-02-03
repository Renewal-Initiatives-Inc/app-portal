/// <reference types="cypress" />

// Custom commands for the App Registry Portal

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login as admin user
       */
      loginAsAdmin(): Chainable<void>;

      /**
       * Login as regular user
       */
      loginAsUser(): Chainable<void>;

      /**
       * Get element by data-testid
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;

      /**
       * Wait for page to be fully loaded
       */
      waitForPageLoad(): Chainable<void>;

      /**
       * Check if element is visible and click it
       */
      safeClick(selector: string): Chainable<void>;
    }
  }
}

// Login as admin
Cypress.Commands.add('loginAsAdmin', () => {
  cy.session('admin', () => {
    // Set mock session cookie for admin user
    cy.setCookie('next-auth.session-token', 'mock-admin-session-token');
    cy.setCookie('next-auth.csrf-token', 'mock-csrf-token');
  });
});

// Login as regular user
Cypress.Commands.add('loginAsUser', () => {
  cy.session('user', () => {
    // Set mock session cookie for regular user
    cy.setCookie('next-auth.session-token', 'mock-user-session-token');
    cy.setCookie('next-auth.csrf-token', 'mock-csrf-token');
  });
});

// Get by data-testid
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Wait for page load
Cypress.Commands.add('waitForPageLoad', () => {
  cy.document().its('readyState').should('eq', 'complete');
  cy.get('body').should('be.visible');
});

// Safe click with visibility check
Cypress.Commands.add('safeClick', (selector: string) => {
  cy.get(selector).should('be.visible').click();
});

export {};
