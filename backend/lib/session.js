// backend/lib/session.js
// Minimal HMAC-signed session token (browser cookie) for admin auth.
// Avoids external JWT deps; format: base64url(payload).base64url(hmac)
import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET || process.env.ADMIN_TOKEN || 'insecure-dev-secret';
const COOKIE_NAME = 'admin_session';
const MAX_AGE_MS = 1000 * 60 * 60 * 8; // 8 hours

const b64url = (buf) => Buffer.from(buf).toString('base64url');

const sign = (payloadStr) => {
  const sig = crypto.createHmac('sha256', SECRET).update(payloadStr).digest('base64url');
  return sig;
};

export const createSessionToken = () => {
  const payload = { a: 1, exp: Date.now() + MAX_AGE_MS };
  const payloadStr = b64url(JSON.stringify(payload));
  const sig = sign(payloadStr);
  return `${payloadStr}.${sig}`;
};

export const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const [payloadStr, sig] = token.split('.');
  const expected = sign(payloadStr);
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (!payload.exp || payload.exp < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
};

export const SESSION_COOKIE = COOKIE_NAME;
export const SESSION_MAX_AGE = MAX_AGE_MS;

export const parseCookies = (header = '') => {
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
};
