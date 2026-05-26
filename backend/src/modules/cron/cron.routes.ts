import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { generateWeeklyCampaignReport } from '../reports/weekly-campaign-report';
import { generateWeeklyActivitiesReport, archivePreviousWeekActivities } from '../reports/weekly-activities-report';
import { generateInsight } from '../insights/insights.service';
import { runAlertChecks } from '../alerts/alerts.service';

const router = Router();

// Vercel Cron chama com Authorization: Bearer <CRON_SECRET>
function verifyCron(req: any, res: any): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem secret configurado, permite em dev
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

async function getActiveClients() {
  const { data } = await supabase.from('clients').select('id, name').eq('status', 'active');
  return data || [];
}

// GET /cron/run — chamado pelo Vercel Cron diariamente às 12:00 UTC (09:00 BRT)
// Vercel Hobby: máx 2 crons, mínimo 1x/dia — este único endpoint verifica o dia e executa o job correto
router.get('/run', async (req, res, next) => {
  if (!verifyCron(req, res)) return;

  try {
    const now = new Date();
    // Horário de Brasília (UTC-3)
    const brTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const day = brTime.getDay(); // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab

    const clients = await getActiveClients();
    const results: any[] = [];

    console.log(`[Cron] Executando — dia ${day}, ${clients.length} clientes ativos`);

    // Diário: verificação de alertas (todos os dias)
    try {
      await runAlertChecks();
      results.push({ job: 'alert_checks', status: 'ok' });
    } catch (e: any) {
      results.push({ job: 'alert_checks', status: 'error', error: e.message });
    }

    // Segunda (1): relatório de campanhas (template)
    if (day === 1) {
      for (const client of clients) {
        try {
          await generateWeeklyCampaignReport(client.id);
          results.push({ job: 'weekly_campaign', client: client.name, status: 'ok' });
        } catch (e: any) {
          results.push({ job: 'weekly_campaign', client: client.name, status: 'error', error: e.message });
        }
      }
    }

    // Quarta (3): insight com IA (GPT-4o)
    if (day === 3) {
      for (const client of clients) {
        try {
          await generateInsight(client.id, 'weekly_wed');
          results.push({ job: 'weekly_insight', client: client.name, status: 'ok' });
        } catch (e: any) {
          results.push({ job: 'weekly_insight', client: client.name, status: 'error', error: e.message });
        }
      }
    }

    // Sexta (5): relatório de atividades (template) + arquivamento
    if (day === 5) {
      for (const client of clients) {
        try {
          await generateWeeklyActivitiesReport(client.id);
          await archivePreviousWeekActivities(client.id);
          results.push({ job: 'weekly_activities', client: client.name, status: 'ok' });
        } catch (e: any) {
          results.push({ job: 'weekly_activities', client: client.name, status: 'error', error: e.message });
        }
      }
    }

    res.json({ ok: true, day, results });
  } catch (e) { next(e); }
});

export default router;
