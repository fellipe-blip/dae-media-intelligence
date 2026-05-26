import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

// GET /funnel?client_id=&days=30
router.get('/', async (req, res, next) => {
  try {
    const { client_id, days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 86400000).toISOString().split('T')[0];

    let query = supabase
      .from('crm_metrics')
      .select('*')
      .gte('date', startDate)
      .order('date');
    if (client_id) query = query.eq('client_id', client_id);

    const { data, error } = await query;
    if (error) throw error;

    const totals = (data || []).reduce((acc: any, m: any) => {
      acc.leads = (acc.leads || 0) + (m.leads || 0);
      acc.mql = (acc.mql || 0) + (m.mql || 0);
      acc.sql = (acc.sql || 0) + (m.sql || 0);
      acc.sales = (acc.sales || 0) + (m.sales || 0);
      acc.spend = (acc.spend || 0) + (m.spend || 0);
      acc.revenue = (acc.revenue || 0) + (m.revenue || 0);
      return acc;
    }, {} as Record<string, number>);

    totals.lead_to_mql = totals.leads > 0 ? (totals.mql / totals.leads) * 100 : 0;
    totals.mql_to_sql = totals.mql > 0 ? (totals.sql / totals.mql) * 100 : 0;
    totals.sql_to_sale = totals.sql > 0 ? (totals.sales / totals.sql) * 100 : 0;
    totals.cost_per_mql = totals.mql > 0 ? totals.spend / totals.mql : 0;
    totals.cost_per_sql = totals.sql > 0 ? totals.spend / totals.sql : 0;
    totals.cost_per_sale = totals.sales > 0 ? totals.spend / totals.sales : 0;
    totals.roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;

    res.json({ totals, daily: data });
  } catch (e) { next(e); }
});

// GET /funnel/breakdown?client_id=&by=campaign&days=30
router.get('/breakdown', async (req, res, next) => {
  try {
    const { client_id, by = 'campaign', days = 30 } = req.query;
    const startDate = new Date(Date.now() - Number(days) * 86400000).toISOString().split('T')[0];

    let query = supabase
      .from('crm_metrics')
      .select('*, campaigns(name), creatives(name)')
      .gte('date', startDate);
    if (client_id) query = query.eq('client_id', client_id);
    if (by === 'campaign') query = query.not('campaign_id', 'is', null);
    else query = query.not('creative_id', 'is', null);

    const { data, error } = await query;
    if (error) throw error;

    const grouped: Record<string, any> = {};
    for (const m of (data || []) as any[]) {
      const key = by === 'campaign' ? m.campaign_id : m.creative_id;
      const name = by === 'campaign' ? m.campaigns?.name : m.creatives?.name;
      if (!key) continue;
      if (!grouped[key]) grouped[key] = { id: key, name: name || key, leads: 0, mql: 0, sql: 0, sales: 0, spend: 0 };
      grouped[key].leads += m.leads || 0;
      grouped[key].mql += m.mql || 0;
      grouped[key].sql += m.sql || 0;
      grouped[key].sales += m.sales || 0;
      grouped[key].spend += m.spend || 0;
    }

    res.json(Object.values(grouped));
  } catch (e) { next(e); }
});

export default router;
