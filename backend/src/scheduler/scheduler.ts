import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { generateWeeklyCampaignReport } from '../modules/reports/weekly-campaign-report';
import { generateWeeklyActivitiesReport, archivePreviousWeekActivities } from '../modules/reports/weekly-activities-report';
import { generateInsight } from '../modules/insights/insights.service';
import { runAlertChecks } from '../modules/alerts/alerts.service';

async function getActiveClients() {
  const { data } = await supabase.from('clients').select('id, name').eq('status', 'active');
  return data || [];
}

// Monday 9h: template campaign report
cron.schedule('0 9 * * 1', async () => {
  console.log('[Scheduler] Monday: generating weekly campaign reports');
  const clients = await getActiveClients();
  for (const client of clients) {
    try {
      await generateWeeklyCampaignReport(client.id);
      console.log(`[Scheduler] Campaign report done for ${client.name}`);
    } catch (e) {
      console.error(`[Scheduler] Error for ${client.name}:`, e);
    }
  }
}, { timezone: 'America/Sao_Paulo' });

// Wednesday 9h: AI insight report
cron.schedule('0 9 * * 3', async () => {
  console.log('[Scheduler] Wednesday: generating AI insights');
  const clients = await getActiveClients();
  for (const client of clients) {
    try {
      await generateInsight(client.id, 'weekly_wed');
      console.log(`[Scheduler] AI insight done for ${client.name}`);
    } catch (e) {
      console.error(`[Scheduler] Error for ${client.name}:`, e);
    }
  }
}, { timezone: 'America/Sao_Paulo' });

// Friday 9h: activities report + archive
cron.schedule('0 9 * * 5', async () => {
  console.log('[Scheduler] Friday: generating activities reports');
  const clients = await getActiveClients();
  for (const client of clients) {
    try {
      await generateWeeklyActivitiesReport(client.id);
      await archivePreviousWeekActivities(client.id);
      console.log(`[Scheduler] Activities report done for ${client.name}`);
    } catch (e) {
      console.error(`[Scheduler] Error for ${client.name}:`, e);
    }
  }
}, { timezone: 'America/Sao_Paulo' });

// Daily 8h: alert checks
cron.schedule('0 8 * * *', async () => {
  console.log('[Scheduler] Daily: running alert checks');
  try {
    await runAlertChecks();
  } catch (e) {
    console.error('[Scheduler] Alert check error:', e);
  }
}, { timezone: 'America/Sao_Paulo' });

console.log('[Scheduler] Cron jobs registered (timezone: America/Sao_Paulo)');
