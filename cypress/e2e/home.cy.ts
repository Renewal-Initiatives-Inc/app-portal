/// <reference types="cypress" />

describe('Home Page', () => {
  it('should display the home page with app grid or login redirect', () => {
    cy.visit('/');
    cy.waitForPageLoad();

    // Either shows login or home page content
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="login-button"]').length > 0) {
        // User is not logged in, redirect to login
        cy.getByTestId('login-button').should('be.visible');
      } else {
        // User is logged in, shows app content
        cy.get('main').should('be.visible');
      }
    });
  });

  it('should have a skip link for accessibility', () => {
    cy.visit('/');
    cy.waitForPageLoad();

    // Check for skip link (accessibility feature)
    cy.get('[data-testid="skip-link"]').should('exist');
  });
});
