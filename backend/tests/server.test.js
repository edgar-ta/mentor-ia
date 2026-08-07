/* eslint-env jest */

// White-box tests for backend/server.js routes
// - We mock express so the module doesn't open a real network port
// - We mock internal dependencies (auth, security, logger, db, etc.) to control behavior

import { jest } from '@jest/globals';

function makeFakeApp() {
  const routes = [];
  const app = {
    _routes: routes,
    use: jest.fn(() => {}),
    get: (route, handler) => routes.push({ method: 'GET', route, handler }),
    post: (route, handler) => routes.push({ method: 'POST', route, handler }),
    patch: (route, handler) => routes.push({ method: 'PATCH', route, handler }),
    delete: (route, handler) => routes.push({ method: 'DELETE', route, handler }),
    listen: jest.fn((port, cb) => cb && cb()),
    _findHandler(method, route) {
      return routes.find((r) => r.method === method && r.route === route)?.handler;
    }
  };
  return app;
}

function makeReq(body = {}, params = {}, query = {}, user = undefined, sessionInfo = undefined) {
  return {
    body,
    params,
    query,
    user,
    sessionInfo
  };
}

function makeRes() {
  let statusCode = 200;
  let headers = {};
  let body = null;
  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      body = payload;
      return { statusCode, body };
    },
    setHeader(name, value) {
      headers[name] = value;
    },
    send(payload) {
      body = payload;
      return { statusCode, headers, body };
    },
    _get() {
      return { statusCode, headers, body };
    }
  };
}

describe('server routes (white-box)', () => {
  let fakeApp;
  beforeEach(async () => {
    jest.resetModules();
    fakeApp = makeFakeApp();

    // Mock express to return our fake app
    jest.unstable_mockModule('express', () => {
      const express = () => fakeApp;
      express.json = () => (req, res, next) => next();
      express.static = () => (req, res, next) => next();
      return { default: express };
    });

    // Minimal no-op mocks for middleware / external libs that server.js imports
    jest.unstable_mockModule('cors', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('helmet', () => ({ default: () => (req, res, next) => next() }));
    jest.unstable_mockModule('dotenv', () => ({ default: { config: jest.fn() } }));

    // Mock logger and ensureBootstrapAdmin so server doesn't exit or print
    jest.unstable_mockModule('../lib/logger.js', () => ({ logger: { info: jest.fn() }, logError: jest.fn() }));
    jest.unstable_mockModule('../lib/errorHandler.js', () => ({ errorHandler: (err, req, res, next) => next(err), handleRouteError: jest.fn(), notFoundHandler: (req, res, next) => next() }));
    jest.unstable_mockModule('../lib/db.js', () => ({ pool: { query: jest.fn().mockResolvedValue([[]]) } }));

    // Mock auth helpers and other internals that routes call
    jest.unstable_mockModule('../lib/auth.js', () => ({
      addProgressLog: jest.fn(),
      assignCoachToUser: jest.fn(),
      authenticateUser: jest.fn(),
      buildUserSnapshotById: jest.fn().mockResolvedValue({}),
      calculateDailyCalories: jest.fn().mockReturnValue(2000),
      changePasswordOncePerMonth: jest.fn(),
      completeUserOnboarding: jest.fn(),
      consumePasswordResetToken: jest.fn(),
      createPasswordResetToken: jest.fn().mockResolvedValue('plain-token'),
      createSessionForUser: jest.fn(),
      createUser: jest.fn(),
      ensureBootstrapAdmin: jest.fn().mockResolvedValue(),
      findUserByEmail: jest.fn(),
      getCurrentSession: jest.fn(),
      getProgressHistory: jest.fn().mockResolvedValue([]),
      listActiveSessions: jest.fn(),
      listApprovedCoaches: jest.fn().mockResolvedValue([]),
      listCoachApplications: jest.fn().mockResolvedValue([]),
      listCoachClients: jest.fn().mockResolvedValue([]),
      reviewCoachApplication: jest.fn(),
      revokeAllUserSessions: jest.fn(),
      revokeCurrentSession: jest.fn(),
      sanitizeUser: jest.fn((u) => ({ id: u.id, nombre: u.nombre, email: u.email })),
      submitCoachApplication: jest.fn(),
      unassignCoachFromUser: jest.fn(),
      updateUserProfile: jest.fn()
    }));

    jest.unstable_mockModule('../lib/mailer.js', () => ({ sendPasswordResetEmail: jest.fn().mockResolvedValue({ previewUrl: null }) }));
    jest.unstable_mockModule('../lib/middleware.js', () => ({ requireLogin: (req, res, next) => next(), requireRole: () => ((req, res, next) => next()) }));
    jest.unstable_mockModule('../lib/security.js', () => ({ isStrongPassword: jest.fn() }));
    jest.unstable_mockModule('../lib/searchService.js', () => ({ getResourceBySlug: jest.fn(), getSearchMeta: jest.fn().mockReturnValue({}), searchResources: jest.fn().mockReturnValue([]) }));

    // Import after registering ESM mocks so the server configures our fake app.
    await import('../server.js');
  });

  test('GET /api/health returns ok and service name', async () => {
    const handler = fakeApp._findHandler('GET', '/api/health');
    expect(handler).toBeDefined();

    const req = makeReq();
    const res = makeRes();

    const result = await handler(req, res);
    // handler uses res.json directly; our makeRes.json returns the captured body
    const { body } = res._get();
    expect(body).toEqual({ ok: true, service: 'mentoria-backend' });
  });

  test('POST /api/auth/register - validates input and success path (white-box)', async () => {
    const { findUserByEmail, createUser, createSessionForUser, sanitizeUser } = await import('../lib/auth.js');
    const { isStrongPassword } = await import('../lib/security.js');

    const handler = fakeApp._findHandler('POST', '/api/auth/register');
    expect(handler).toBeDefined();

    // 1) missing fields -> 400
    let req = makeReq({ nombre: '', email: '', password: '' });
    let res = makeRes();
    await handler(req, res);
    let out = res._get();
    expect(out.statusCode).toBe(400);
    expect(out.body).toHaveProperty('message');

    // 2) weak password -> 400
    isStrongPassword.mockReturnValue(false);
    req = makeReq({ nombre: 'Test', email: 'a@b.com', password: 'weakpass' });
    res = makeRes();
    await handler(req, res);
    out = res._get();
    expect(out.statusCode).toBe(400);
    expect(out.body).toHaveProperty('message');

    // 3) existing user -> 409
    isStrongPassword.mockReturnValue(true);
    findUserByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' });
    req = makeReq({ nombre: 'Test', email: 'a@b.com', password: 'StrongPass123' });
    res = makeRes();
    await handler(req, res);
    out = res._get();
    expect(out.statusCode).toBe(409);
    expect(out.body).toHaveProperty('message');

    // 4) success -> 201 with sanitized user and redirect
    findUserByEmail.mockResolvedValue(null);
    createUser.mockResolvedValue({ id: 42, nombre: 'Test', email: 'a@b.com', rol: 'usuario' });
    createSessionForUser.mockResolvedValue();
    sanitizeUser.mockImplementation((u) => ({ id: u.id, nombre: u.nombre }));

    req = makeReq({ nombre: 'Test', email: 'a@b.com', password: 'StrongPass123' });
    res = makeRes();
    await handler(req, res);
    out = res._get();
    expect(out.statusCode).toBe(201);
    expect(out.body).toHaveProperty('user');
    expect(out.body).toHaveProperty('redirectTo', '/app/onboarding');
  });
});
