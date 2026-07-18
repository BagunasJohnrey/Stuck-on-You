// backend/routes/admin.js
// Admin-only endpoints, protected by an HMAC-signed session cookie.
import express from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import {
  createSessionToken,
  verifySessionToken,
  parseCookies,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from '../lib/session.js';

const router = express.Router();

// Brute-force protection: max 3 failed login attempts per 15 min per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  skipSuccessfulRequests: true, // only failed attempts consume the budget
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many failed attempts. Try again in 15 minutes.' },
});

// Middleware: require a valid admin session cookie.
const requireAdmin = (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!verifySessionToken(token)) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  return next();
};

// POST /login  — verify password, set httpOnly session cookie.
router.post('/login', loginLimiter, (req, res) => {
  const expected = process.env.ADMIN_TOKEN;
  const provided = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: 'Invalid admin password.' });
  }
  const token = createSessionToken();
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  return res.json({ success: true });
});

// POST /logout  — clear session cookie.
router.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  return res.json({ success: true });
});

// GET /reports  — list flagged notes with their reports.
router.get('/reports', requireAdmin, async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: { note: true },
    });
    return res.json(reports);
  } catch (err) {
    console.error('GET /reports failed:', err);
    return res.status(500).json({ error: 'Unable to load reports.' });
  }
});

// DELETE /notes/:id  — delete a note.
router.delete('/notes/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid note id.' });
  }

  try {
    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    await prisma.note.delete({ where: { id } });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /notes/:id failed:', err);
    return res.status(500).json({ error: 'Unable to delete note.' });
  }
});

// DELETE /reports/:id  — dismiss a single report.
router.delete('/reports/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid report id.' });
  }

  try {
    await prisma.report.delete({ where: { id } });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /reports/:id failed:', err);
    return res.status(500).json({ error: 'Unable to delete report.' });
  }
});

// GET /banned  — list all prohibited words.
router.get('/banned', requireAdmin, async (req, res) => {
  try {
    const words = await prisma.prohibitedWord.findMany({ orderBy: { word: 'asc' } });
    return res.json(words);
  } catch (err) {
    console.error('GET /banned failed:', err);
    return res.status(500).json({ error: 'Unable to load banned words.' });
  }
});

// POST /banned  — add a prohibited word.
router.post('/banned', requireAdmin, async (req, res) => {
  const raw = typeof req.body?.word === 'string' ? req.body.word.trim().toLowerCase() : '';
  if (raw.length < 2) {
    return res.status(400).json({ error: 'Word must be at least 2 characters.' });
  }
  if (raw.length > 50) {
    return res.status(400).json({ error: 'Word is too long.' });
  }

  try {
    const word = await prisma.prohibitedWord.upsert({
      where: { word: raw },
      update: {},
      create: { word: raw },
    });
    return res.status(201).json(word);
  } catch (err) {
    console.error('POST /banned failed:', err);
    return res.status(500).json({ error: 'Unable to add banned word.' });
  }
});

// DELETE /banned/:id  — remove a prohibited word.
router.delete('/banned/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid word id.' });
  }

  try {
    await prisma.prohibitedWord.delete({ where: { id } });
    return res.json({ success: true, id });
  } catch (err) {
    console.error('DELETE /banned/:id failed:', err);
    return res.status(500).json({ error: 'Unable to delete banned word.' });
  }
});

export default router;
