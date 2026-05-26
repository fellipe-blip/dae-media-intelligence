import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

// GET /metrics?client_id=&entity_type=&entity_id=&start=&end=
router.get('/', async (req, res, next) => {
  try {
    const { client_id, entity_type, entity_id, start, end } = req.query;
    let query = supabase.from('metrics_daily').select('*').order('date', { ascending: false });
    if (client_id) query = query.eq('client_id', client_id);
    if (entity_type) query = query.eq('entity_type', entity_type);
    if (entity_id) query = query.eq('entity_id', entity_id);
    if (start) query = query.gte('date', start);
    if (end) query = query.lte('date', end);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// GET /metrics/summary?client_id=&days=30
router.get('/summary', async (req, res, next) => {
  try {
    const { client_id, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    const startStr = startDate.toISOString().split('T')[0];

    let query = supabase
      .from('metrics_daily')
      .select('*')
      .eq('entity_type', 'campaign')
      .gte('date', startStr);
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error } = await query;
    if (error) throw error;

    const summary = (data || []).reduce((acc: any, row: any) => {
      acc.spend = (acc.spend || 0) + (row.spend || 0);
      acc.impressions = (acc.impressions || 0) + (row.impressions || 0);
      acc.clicks = (acc.clicks || 0) + (row.clicks || 0);
      acc.leads = (acc.leads || 0) + (row.leads || 0);
      acc.messages = (acc.messages || 0) + (row.messages || 0);
      return acc;
    }, {} as Record<string, number>);

    summary.cpl = summary.leads > 0 ? summary.spend / summary.leads : 0;
    summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions) * 100 : 0;
    summary.cpc = summary.clicks > 0 ? summary.spend / summary.clicks : 0;

    res.json(summary);
  } catch (e) { next(e); }
});

// GET /metrics/timeseries?client_id=&days=30
router.get('/timeseries', async (req, res, next) => {
  try {
    const { client_id, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    const startStr = startDate.toISOString().split('T')[0];

    let query = supabase
      .from('metrics_daily')
      .select('date, spend, impressions, clicks, leads, messages')
      .eq('entity_type', 'campaign')
      .gte('date', startStr)
      .order('date');
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate by date
    const byDate: Record<string, any> = {};
    for (const row of data || []) {
      if (!byDate[row.date]) byDate[row.date] = { date: row.date, spend: 0, impressions: 0, clicks: 0, leads: 0, messages: 0 };
      byDate[row.date].spend += row.spend || 0;
      byDate[row.date].impressions += row.impressions || 0;
      byDate[row.date].clicks += row.clicks || 0;
      byDate[row.date].leads += row.leads || 0;
      byDate[row.date].messages += row.messages || 0;
    }

    res.json(Object.values(byDate));
  } catch (e) { next(e); }
});

// GET /metrics/creatives?client_id=&days=30
router.get('/creatives', async (req, res, next) => {
  try {
    const { client_id, days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - Number(days));
    const startStr = startDate.toISOString().split('T')[0];

    let query = supabase
      .from('metrics_daily')
      .select('entity_id, spend, impressions, clicks, leads, messages, creatives(name, creative_type, thumbnail_url)')
      .eq('entity_type', 'creative')
      .gte('date', startStr);
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error } = await query;
    if (error) throw error;

    // Aggregate by creative
    const byCreative: Record<string, any> = {};
    for (const row of (data || []) as any[]) {
      const id = row.entity_id;
      if (!byCreative[id]) {
        byCreative[id] = {
          entity_id: id,
          name: row.creatives?.name || 'Creative ' + id,
          creative_type: row.creatives?.creative_type,
          thumbnail_url: row.creatives?.thumbnail_url,
          spend: 0, impressions: 0, clicks: 0, leads: 0, messages: 0,
        };
      }
      byCreative[id].spend += row.spend || 0;
      byCreative[id].impressions += row.impressions || 0;
      byCreative[id].clicks += row.clicks || 0;
      byCreative[id].leads += row.leads || 0;
      byCreative[id].messages += row.messages || 0;
    }

    const result = Object.values(byCreative)
      .map((c: any) => ({
        ...c,
        cpl: c.leads > 0 ? c.spend / c.leads : 0,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
      }))
      .sort((a: any, b: any) => b.leads - a.leads)
      .slice(0, 10);

    res.json(result);
  } catch (e) { next(e); }
});

export default router;
