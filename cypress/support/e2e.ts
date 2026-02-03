// Cypress E2E support file
// This file is processed and loaded automatically before test files.

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Hide fetch/XHR requests from command log
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Prevent Cypress from failing on uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Log error for debugging
  console.error('Uncaught exception:', err.message);
  // returning false here prevents Cypress from failing the test
  return false;
});

// Add custom assertion messages
chai.config.truncateThreshold = 0;
