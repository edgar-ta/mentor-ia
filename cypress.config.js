import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    specPattern: 'backend/tests/cypress.js',
    supportFile: false,
    baseUrl: 'http://localhost:4000',
    video: false
  }
});
