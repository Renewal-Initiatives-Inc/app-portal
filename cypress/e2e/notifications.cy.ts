/// <reference types="cypress" />

describe('Notifications', () => {
  describe('Notification Dropdown', () => {
    it('should redirect to login if accessing admin area unauthenticated', () => {
      cy.visit('/admin');
      cy.url().should('include', '/login');
    });
  });

  describe('With Authentication (requires setup)', () => {
    it.skip('should show notification bell in header', () => {
      cy.loginAsAdmin();
      cy.visit('/admin');
      cy.waitForPageLoad();

      cy.getByTestId('notification-bell').should('be.visible');
    });

    it.skip('should open notification dropdown on click', () => {
      cy.loginAsAdmin();
      cy.visit('/admin');
      cy.waitForPageLoad();

      cy.getByTestId('notification-bell').click();
      cy.getByTestId('notification-dropdown').should('be.visible');
    });

    it.skip('should show unread count badge when notifications exist', () => {
      cy.loginAsAdmin();
      cy.visit('/admin');
      cy.waitForPageLoad();

      cy.getByTestId('notification-count').should('exist');
    });

    it.skip('should mark notification as read when clicked', () => {
      cy.loginAsAdmin();
      cy.visit('/admin');
      cy.waitForPageLoad();

      cy.getByTestId('notification-bell').click();
      cy.getByTestId('notification-item').first().click();

      // Notification should be marked as read
      cy.getByTestId('notification-item').first()
        .should('not.have.class', 'unread');
    });

    it.skip('should have mark all as read button', () => {
      cy.loginAsAdmin();
      cy.visit('/admin');
      cy.waitForPageLoad();

      cy.getByTestId('notification-bell').click();
      cy.getByTestId('mark-all-read-button').should('be.visible');
    });
  });
});
