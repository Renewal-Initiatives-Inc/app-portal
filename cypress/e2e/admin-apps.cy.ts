/// <reference types="cypress" />

describe('Admin Apps Management', () => {
  beforeEach(() => {
    // Note: These tests require authentication
    // In CI, you'd need to mock the auth or use a test account
    cy.visit('/admin/apps');
  });

  describe('Apps List Page', () => {
    it('should redirect to login if not authenticated', () => {
      cy.url().should('include', '/login');
    });
  });

  // The following tests would run with proper authentication setup
  describe('With Authentication (requires setup)', () => {
    it.skip('should display apps table when authenticated', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/apps');
      cy.waitForPageLoad();

      cy.getByTestId('apps-table').should('be.visible');
    });

    it.skip('should have create app button', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/apps');
      cy.waitForPageLoad();

      cy.getByTestId('create-app-button').should('be.visible');
    });

    it.skip('should open create app dialog when clicking create button', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/apps');
      cy.waitForPageLoad();

      cy.getByTestId('create-app-button').click();
      cy.getByTestId('create-app-dialog').should('be.visible');
    });

    it.skip('should validate required fields in create form', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/apps');
      cy.waitForPageLoad();

      cy.getByTestId('create-app-button').click();
      cy.getByTestId('submit-app-button').click();

      // Should show validation errors
      cy.contains('Name must be at least').should('be.visible');
    });
  });
});
