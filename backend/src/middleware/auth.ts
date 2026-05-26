import { Request, Response, NextFunction } from 'express';

export function apiKeyMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'development') return next();
  // Cron usa Authorization: Bearer <CRON_SECRET>, não X-API-Key
  if (req.path.startsWith('/cron')) return next();
  const key = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY || 'dae-secret-key-change-in-prod';
  if (!key || key !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
