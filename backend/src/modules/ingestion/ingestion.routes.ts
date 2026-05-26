import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { ingestMetaAds } from './meta-ads.service';
import { ingestRDStation } from './rdstation.service';

const router = Router();

router.post('/meta/:clientId', async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { days = 7 } = req.body;

    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (!client?.ad_account_id) return res.status(400).json({ error: 'Client has no ad_account_id configured' });

    const result = await ingestMetaAds(Number(clientId), client.ad_account_id, days);
    res.json(result);
  } catch (e) { next(e); }
});

router.post('/rdstation/:clientId', async (req, res, next) => {
  try {
    const { clientId } = req.params;

    const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (!client?.crm_token) return res.status(400).json({ error: 'Client has no crm_token configured' });

    const result = await ingestRDStation(
      Number(clientId),
      client.crm_token,
      client.funnel_stage_config,
      client.rd_fonte_field,
    );
    res.json(result);
  } catch (e) { next(e); }
});

// Run ingestion for all active clients
router.post('/run-all', async (req, res, next) => {
  try {
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .eq('status', 'active');

    const results = [];
    for (const client of clients || []) {
      if (client.ad_account_id) {
        try {
          const r = await ingestMetaAds(client.id, client.ad_account_id, 7);
          results.push({ client: client.name, platform: 'meta', ...r });
        } catch (e: any) {
          results.push({ client: client.name, platform: 'meta', error: e.message });
        }
      }
      if (client.crm_token) {
        try {
          const r = await ingestRDStation(client.id, client.crm_token, client.funnel_stage_config, client.rd_fonte_field);
          results.push({ client: client.name, platform: 'rdstation', ...r });
        } catch (e: any) {
          results.push({ client: client.name, platform: 'rdstation', error: e.message });
        }
      }
    }

    res.json({ results });
  } catch (e) { next(e); }
});

export default router;
