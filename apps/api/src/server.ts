import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { prisma } from './db';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'reachable', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'unreachable' });
  }
});

// Dashboard, bookings, mechanics and customers routes are added next.

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
