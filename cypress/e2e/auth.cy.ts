/// <reference types="cypress" />

describe('Authentication', () => {
  describe('Login Page', () => {
    it('should display the login page', () => {
      cy.visit('/login');
      cy.waitForPageLoad();

      // Check for login elements
      cy.contains('Sign in').should('be.visible');
    });

    it('should show login button', () => {
      cy.visit('/login');
      cy.waitForPageLoad();

      cy.getByTestId('login-button').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users from admin to login', () => {
      cy.visit('/admin');
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated users from admin/apps to login', () => {
      cy.visit('/admin/apps');
      cy.url().should('include', '/login');
    });

    it('should redirect unauthenticated users from admin/users to login', () => {
      cy.visit('/admin/users');
      cy.url().should('include', '/login');
    });
  });
});
