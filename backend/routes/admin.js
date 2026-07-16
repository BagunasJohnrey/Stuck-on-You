// backend/routes/admin.js
// Admin-only endpoints, protected by a shared ADMIN_TOKEN secret.
import express from 'express';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

// Middleware: require a valid admin bearer token.
const requireAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const expected = process.env.ADMIN_TOKEN;

  if (!expected || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  return next();
};

// DELETE /api/admin/notes/:id
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
    console.error('DELETE /api/admin/notes/:id failed:', err);
    return res.status(500).json({ error: 'Unable to delete note.' });
  }
});

export default router;
