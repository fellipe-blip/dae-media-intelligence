import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { apiKeyMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';

import clientsRoutes from './modules/clients/clients.routes';
import campaignsRoutes from './modules/campaigns/campaigns.routes';
import metricsRoutes from './modules/metrics/metrics.routes';
import insightsRoutes from './modules/insights/insights.routes';
import alertsRoutes from './modules/alerts/alerts.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import funnelRoutes from './modules/funnel/funnel.routes';
import reportsRoutes from './modules/reports/reports.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import adminRoutes from './modules/admin/admin.routes';
import ingestionRoutes from './modules/ingestion/ingestion.routes';
import cronRoutes from './modules/cron/cron.routes';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    // Sem origin = same-origin ou curl
    if (!origin) return callback(null, true);
    // Localhost em dev
    if (origin.startsWith('http://localhost')) return callback(null, true);
    // Vercel deployments
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    // Domínio customizado via env var
    if (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(apiKeyMiddleware);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/clients', clientsRoutes);
app.use('/campaigns', campaignsRoutes);
app.use('/metrics', metricsRoutes);
app.use('/insights', insightsRoutes);
app.use('/alerts', alertsRoutes);
app.use('/activities', activitiesRoutes);
app.use('/funnel', funnelRoutes);
app.use('/reports', reportsRoutes);
app.use('/tasks', tasksRoutes);
app.use('/admin', adminRoutes);
app.use('/ingestion', ingestionRoutes);
app.use('/cron', cronRoutes);

app.use(errorHandler);

// Dev local: inicia servidor normalmente
// Vercel: importa o app como default export (serverless)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`[Server] Rodando em http://localhost:${PORT}`);
  });
}

export default app;
