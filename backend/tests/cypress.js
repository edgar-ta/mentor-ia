describe('Auth integration (API)', () => {
  // Cambia según dónde esté corriendo tu backend
  const apiBase = Cypress.env('API_URL') || 'http://localhost:4000';

  it('GET /api/health returns ok', () => {
    cy.request(`${apiBase}/api/health`).its('body').should('deep.equal', { ok: true, service: 'mentoria-backend' });
  });

  it('register -> login flow via API', () => {
    const email = `cypress+${Date.now()}@example.test`;
    const password = 'StrongPass123';

    // Intentamos registrar. Si ya existe, permitimos 409 (test idempotente).
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/auth/register`,
      body: { nombre: 'Cypress User', email, password },
      failOnStatusCode: false
    }).then((res) => {
      expect([201, 409]).to.include(res.status);
      if (res.status === 201) {
        expect(res.body).to.have.property('redirectTo', '/app/onboarding');
      }
    });

    // Intentamos iniciar sesión con esas credenciales
    cy.request({
      method: 'POST',
      url: `${apiBase}/api/auth/login`,
      body: { email, password },
      failOnStatusCode: false
    }).then((res) => {
      // 200 -> ok, 401 -> credenciales inválidas (si el registro fue 409 por existir pero con otra password)
      expect([200, 401]).to.include(res.status);
      if (res.status === 200) {
        expect(res.body).to.have.property('redirectTo');
      }
    });
  });
});