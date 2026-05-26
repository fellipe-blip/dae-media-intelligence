import express from 'express';
import backendApp from '../backend/src/index';

const app = express();

// Chamadas do frontend: /api/clients → backendApp vê /clients
app.use('/api', backendApp);

// Vercel Cron e /health chegam sem prefixo /api
app.use('/', backendApp);

export default app;
