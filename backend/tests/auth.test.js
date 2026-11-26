import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { requireRole } from '../middleware/requireRole.js';
import { authenticate } from '../middleware/auth.js';

process.env.JWT_SECRET = 'test-secret';

function mockRes() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
}

test('requireRole lets the right role through', () => {
    const res = mockRes();
    let called = false;
    requireRole('traveler')({ role: 'traveler' }, res, () => { called = true; });
    assert.equal(called, true);
});

test('requireRole blocks the other role with 403', () => {
    const res = mockRes();
    let called = false;
    requireRole('organizer')({ role: 'traveler' }, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
});

test('requireRole blocks a token with no role', () => {
    const res = mockRes();
    let called = false;
    requireRole('traveler')({}, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
});

test('authenticate puts userId and role on req', () => {
    const token = jwt.sign({ userId: 7, role: 'organizer' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    let called = false;
    authenticate(req, mockRes(), () => { called = true; });
    assert.equal(called, true);
    assert.equal(req.userId, 7);
    assert.equal(req.role, 'organizer');
});

test('authenticate rejects a missing token with 401', () => {
    const res = mockRes();
    authenticate({ headers: {} }, res, () => {});
    assert.equal(res.statusCode, 401);
});

test('authenticate rejects a bad token with 401', () => {
    const res = mockRes();
    authenticate({ headers: { authorization: 'Bearer not-a-real-token' } }, res, () => {});
    assert.equal(res.statusCode, 401);
});
