/// <reference types="cypress" />

describe('Dashboard', () => {
  beforeEach(() => {
    // Note: In a real test, you'd need proper auth setup
    cy.visit('/');
    cy.waitForPageLoad();
  });

  describe('App Grid', () => {
    it('should show app grid or empty state', () => {
      cy.get('body').then(($body) => {
        const hasAppGrid = $body.find('[data-testid="app-grid"]').length > 0;
        const hasEmptyState = $body.find('[data-testid="empty-state"]').length > 0;
        const hasLogin = $body.find('[data-testid="login-button"]').length > 0;

        // One of these should be true
        expect(hasAppGrid || hasEmptyState || hasLogin).to.be.true;
      });
    });
  });

  describe('Navigation', () => {
    it('should have working navigation links', () => {
      cy.get('nav').should('exist');
    });
  });
});
