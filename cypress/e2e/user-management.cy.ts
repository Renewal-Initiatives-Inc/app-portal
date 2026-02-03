/// <reference types="cypress" />

describe('User Management', () => {
  beforeEach(() => {
    cy.visit('/admin/users');
  });

  describe('Users List Page', () => {
    it('should redirect to login if not authenticated', () => {
      cy.url().should('include', '/login');
    });
  });

  describe('With Authentication (requires setup)', () => {
    it.skip('should display users table when authenticated', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/users');
      cy.waitForPageLoad();

      cy.getByTestId('users-table').should('be.visible');
    });

    it.skip('should have invite user button', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/users');
      cy.waitForPageLoad();

      cy.getByTestId('invite-user-button').should('be.visible');
    });

    it.skip('should open invite user dialog', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/users');
      cy.waitForPageLoad();

      cy.getByTestId('invite-user-button').click();
      cy.getByTestId('invite-user-dialog').should('be.visible');
    });

    it.skip('should validate email in invite form', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/users');
      cy.waitForPageLoad();

      cy.getByTestId('invite-user-button').click();
      cy.getByTestId('email-input').type('invalid-email');
      cy.getByTestId('submit-invite-button').click();

      // Should show validation error
      cy.contains('Invalid email').should('be.visible');
    });

    it.skip('should show user details when clicking a user row', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/users');
      cy.waitForPageLoad();

      cy.getByTestId('user-row').first().click();
      cy.getByTestId('user-details').should('be.visible');
    });
  });
});
