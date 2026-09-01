import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy apps/api/.env.example to apps/api/.env.');
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// One client per process. Prisma holds a connection pool, so constructing more
// than one exhausts the database's connection limit under any real load.
export const prisma = new PrismaClient({ adapter });
