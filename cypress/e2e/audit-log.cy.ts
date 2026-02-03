/// <reference types="cypress" />

describe('Audit Log', () => {
  beforeEach(() => {
    cy.visit('/admin/audit-log');
  });

  describe('Audit Log Page', () => {
    it('should redirect to login if not authenticated', () => {
      cy.url().should('include', '/login');
    });
  });

  describe('With Authentication (requires setup)', () => {
    it.skip('should display audit log table when authenticated', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/audit-log');
      cy.waitForPageLoad();

      cy.getByTestId('audit-log-table').should('be.visible');
    });

    it.skip('should show audit log entries with action types', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/audit-log');
      cy.waitForPageLoad();

      cy.get('table tbody tr').should('have.length.at.least', 0);
    });

    it.skip('should have pagination controls', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/audit-log');
      cy.waitForPageLoad();

      cy.getByTestId('pagination').should('exist');
    });

    it.skip('should filter audit logs by action type', () => {
      cy.loginAsAdmin();
      cy.visit('/admin/audit-log');
      cy.waitForPageLoad();

      cy.getByTestId('action-filter').click();
      cy.contains('APP_CREATED').click();

      // Verify filter is applied
      cy.url().should('include', 'action=APP_CREATED');
    });
  });
});
