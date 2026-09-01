import cors from 'cors';
import express from 'express';
import { env, isProduction } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { apiRoutes } from './routes';

/**
 * Builds the app without starting it, so the server entrypoint stays a
 * three-line bootstrap and the app can be exercised without binding a port.
 */
export function createApp() {
  const app = express();

  app.use(
    cors({
      // A single Vercel origin in production; `*` only as a local default.
      origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(',').map((o) => o.trim()),
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  if (!isProduction) {
    app.use((req, _res, next) => {
      console.log(`${req.method} ${req.originalUrl}`);
      next();
    });
  }

  app.use('/api', apiRoutes);

  // Order matters: the 404 must come after every route, and the error handler
  // after everything — Express recognises it only by its four-argument shape,
  // and anything registered later never sees the error.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
