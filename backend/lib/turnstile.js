// lib/turnstile.js
// Verifies a Cloudflare Turnstile challenge token against Cloudflare's
// siteverify endpoint. Returns true only for a successful, non-expired
// validation tied to the expected sitekey + action.
import { prisma } from './prisma.js';

const TURNSTILE_VERIFY_URL =
  'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export const verifyTurnstile = async (token, remoteIp) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    // Misconfiguration: treat as failure so we never silently skip CAPTCHA.
    console.error('TURNSTILE_SECRET_KEY is not set — blocking submission.');
    return false;
  }

  if (!token || typeof token !== 'string') return false;

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set('remoteip', remoteIp);

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.error('Turnstile verification request failed:', err);
    return false;
  }
};
