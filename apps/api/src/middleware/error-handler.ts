import type { ErrorRequestHandler, RequestHandler } from 'express';
import { z } from 'zod';
import { isProduction } from '../config/env';
import { Prisma } from '../generated/prisma/client';
import { AppError, NotFound } from '../lib/errors';

/** Terminal handler for paths no router claimed. */
export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFound(`No route for ${req.method} ${req.originalUrl}`);
};

/**
 * The single place errors become HTTP. Express 5 forwards rejected promises from
 * async handlers here on its own, so handlers need no try/catch wrapper.
 *
 * Must be mounted last — Express identifies error middleware by its four-argument
 * signature, and anything registered after it will never see the error.
 */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // A schema rejected the request body/query/params.
  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Request validation failed.',
        details: z.flattenError(err).fieldErrors,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = mapPrismaError(err);
    if (mapped) {
      res.status(mapped.status).json({ error: { code: mapped.code, message: mapped.message } });
      return;
    }
  }

  // Anything reaching here is a bug. Log it in full; return nothing that would
  // leak query internals or connection strings to the client.
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong.',
      ...(isProduction ? {} : { details: err instanceof Error ? err.message : String(err) }),
    },
  });
};

function mapPrismaError(
  err: Prisma.PrismaClientKnownRequestError,
): { status: number; code: string; message: string } | null {
  switch (err.code) {
    case 'P2002': {
      const target = err.meta?.['target'];
      const fields = Array.isArray(target) ? target.join(', ') : String(target ?? 'field');
      return { status: 409, code: 'DUPLICATE', message: `A record with this ${fields} already exists.` };
    }
    case 'P2003':
      return { status: 400, code: 'INVALID_REFERENCE', message: 'A referenced record does not exist.' };
    case 'P2025':
      return { status: 404, code: 'NOT_FOUND', message: 'The requested record does not exist.' };
    default:
      return null;
  }
}
