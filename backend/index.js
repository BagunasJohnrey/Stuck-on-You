import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'dotenv/config';
import noteRoutes from './routes/notes.js';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy (Vercel / reverse proxy) so express-rate-limit and
// req.ip use the real client IP from X-Forwarded-For instead of the proxy's.
app.set('trust proxy', 1);

// Security headers.
app.use(helmet());

// Optimized CORS Configuration
const corsOptions = {
  origin: ['https://stuck-on-you.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Cap request body size to prevent oversized-payload DoS.
app.use(express.json({ limit: '10kb' }));

// Routes
app.use('/api/notes', noteRoutes);

// Health Check
app.get('/', (req, res) => res.send('Stuck on You API is running!'));

// Malformed JSON / body-parser errors -> clean 400 instead of a stack trace.
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Payload too large.' });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }
  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Something went wrong.' });
});

const server = app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

// Graceful shutdown: close the Prisma connection pool.
const shutdown = async (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
