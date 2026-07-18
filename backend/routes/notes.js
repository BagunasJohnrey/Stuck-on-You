// backend/routes/notes.js
import express from 'express';
import { prisma } from '../lib/prisma.js';
import { rateLimit } from 'express-rate-limit';
import { isOffensive } from '../lib/filter.js';
import { containsUrl } from '../lib/validation.js';
import { verifyTurnstile } from '../lib/turnstile.js';

const router = express.Router();

// Allowed note colors (must match the frontend palette in Submit.jsx).
const ALLOWED_COLORS = new Set([
  '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff',
  '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc',
]);

// Field length limits (mirror the frontend, enforced authoritatively here).
const LIMITS = {
  to_name: 50,
  message: 300,
  alias: 30,
};

// Submit limiter: 50 posts per 20 minutes per IP.
const submitLimiter = rateLimit({
  windowMs: 20 * 60 * 1000,
  limit: 50,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too much drama! Please wait a few minutes before posting again.' },
});

// Read limiter: generous, but prevents scraping/DoS via the polling endpoint.
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Slow down a bit and try again shortly.' },
});

// Normalize an optional string field: trim, coerce empty to null.
const cleanOptional = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') return undefined; // signal invalid type
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

// GET /api/notes?page=0&limit=50  (newest first, paginated + capped)
router.get('/', readLimiter, async (req, res) => {
  const page = Math.max(0, parseInt(req.query.page, 10) || 0);
  const requested = parseInt(req.query.limit, 10) || 50;
  const take = Math.min(Math.max(1, requested), 100); // cap at 100 per request

  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: 'desc' },
      skip: page * take,
      take,
    });

    // Map DB field names back to the API shape the frontend expects.
    const payload = notes.map((n) => ({
      id: n.id,
      to_name: n.toName,
      message: n.message,
      alias: n.alias,
      color: n.color,
      created_at: n.createdAt,
    }));

    return res.json(payload);
  } catch (err) {
    console.error('GET /api/notes failed:', err);
    return res.status(500).json({ error: 'Unable to load notes right now.' });
  }
});

router.post('/', submitLimiter, async (req, res) => {
  const body = req.body ?? {};

  // --- CAPTCHA (Cloudflare Turnstile) ---
  try {
    const token = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    if (!(await verifyTurnstile(token, ip))) {
      return res.status(400).json({ error: 'Please complete the captcha.' });
    }
  } catch (err) {
    console.error('Turnstile check failed:', err);
    return res.status(400).json({ error: 'Captcha verification failed.' });
  }

  // --- Validation ---
  if (typeof body.message !== 'string' || body.message.trim().length === 0) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const message = body.message.trim();
  const to_name = cleanOptional(body.to_name);
  const alias = cleanOptional(body.alias);

  if (to_name === undefined || alias === undefined) {
    return res.status(400).json({ error: 'Invalid field type.' });
  }

  if (message.length > LIMITS.message) {
    return res.status(400).json({ error: `Message must be ${LIMITS.message} characters or fewer.` });
  }
  if (to_name && to_name.length > LIMITS.to_name) {
    return res.status(400).json({ error: `Recipient must be ${LIMITS.to_name} characters or fewer.` });
  }
  if (alias && alias.length > LIMITS.alias) {
    return res.status(400).json({ error: `Alias must be ${LIMITS.alias} characters or fewer.` });
  }

  // --- Block links / URLs (spam reduction) ---
  if (containsUrl(message) || containsUrl(to_name ?? '') || containsUrl(alias ?? '')) {
    return res.status(400).json({ error: 'Links are not allowed in notes.' });
  }

  const color = typeof body.color === 'string' ? body.color.toLowerCase() : '#fffffc';
  if (!ALLOWED_COLORS.has(color)) {
    return res.status(400).json({ error: 'Invalid color selection.' });
  }

  // --- Profanity check ---
  try {
    const contentToCheck = `${to_name ?? ''} ${message} ${alias ?? ''}`;
    const banned = await isOffensive(contentToCheck);
    if (banned) {
      return res.status(400).json({
        error: `Oops, the word "${banned}" isn't allowed - Magmahalan lang po tayo :)`,
      });
    }
  } catch (err) {
    console.error('Profanity check failed:', err);
    return res.status(500).json({ error: 'Unable to post your note right now.' });
  }

  // --- Persist ---
  try {
    const note = await prisma.note.create({
      data: { toName: to_name, message, alias, color },
    });

    return res.status(201).json({
      id: note.id,
      to_name: note.toName,
      message: note.message,
      alias: note.alias,
      color: note.color,
      created_at: note.createdAt,
    });
  } catch (err) {
    console.error('POST /api/notes failed:', err);
    return res.status(500).json({ error: 'Unable to post your note right now.' });
  }
});

// POST /api/notes/:id/report  — flag a note for admin review.
const REPORT_LIMITS = { reason: 200 };

router.post('/:id/report', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid note id.' });
  }

  const rawReason = req.body?.reason;
  const reason =
    typeof rawReason === 'string' && rawReason.trim().length > 0
      ? rawReason.trim().slice(0, REPORT_LIMITS.reason)
      : null;

  try {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note) {
      return res.status(404).json({ error: 'Note not found.' });
    }

    await prisma.report.create({ data: { noteId: id, reason } });
    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('POST /api/notes/:id/report failed:', err);
    return res.status(500).json({ error: 'Unable to submit report.' });
  }
});

export default router;
