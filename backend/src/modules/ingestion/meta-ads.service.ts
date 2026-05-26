import axios from 'axios';
import { supabase } from '../../config/supabase';

const META_BASE = 'https://graph.facebook.com/v19.0';

async function fetchMetrics(adAccountId: string, level: 'campaign' | 'adset' | 'ad', since: string, until: string) {
  const fields = [
    'campaign_id', 'campaign_name',
    'adset_id', 'adset_name',
    'ad_id', 'ad_name',
    'spend', 'impressions', 'reach', 'frequency', 'clicks', 'ctr', 'cpc', 'cpm',
    'actions', 'cost_per_action_type',
    'video_p25_watched_actions', 'video_p100_watched_actions',
  ].join(',');

  const { data } = await axios.get(`${META_BASE}/act_${adAccountId}/insights`, {
    params: {
      access_token: process.env.META_ACCESS_TOKEN,
      level,
      fields,
      time_range: JSON.stringify({ since, until }),
      time_increment: 1,
      limit: 500,
    },
  });

  return data.data || [];
}

function extractAction(actions: any[], type: string): number {
  const action = (actions || []).find((a: any) => a.action_type === type);
  return action ? Number(action.value) : 0;
}

export async function ingestMetaAds(clientId: number, adAccountId: string, days = 7) {
  console.log(`[Meta Ads] Ingesting for client ${clientId}, account ${adAccountId}`);

  const until = new Date().toISOString().split('T')[0];
  const sinceDate = new Date(Date.now() - days * 86400000);
  const since = sinceDate.toISOString().split('T')[0];

  // Ingest campaign-level
  const campaignData = await fetchMetrics(adAccountId, 'campaign', since, until);
  for (const row of campaignData) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .upsert({
        client_id: clientId,
        external_id: row.campaign_id,
        name: row.campaign_name,
        platform: 'meta',
        status: 'active',
      }, { onConflict: 'external_id' })
      .select()
      .single();

    if (!campaign) continue;

    const leads = extractAction(row.actions, 'lead') + extractAction(row.actions, 'offsite_conversion.fb_pixel_lead');
    const messages = extractAction(row.actions, 'onsite_conversion.messaging_first_reply');

    await supabase.from('metrics_daily').upsert({
      client_id: clientId,
      entity_type: 'campaign',
      entity_id: campaign.id,
      date: row.date_start,
      spend: Number(row.spend) || 0,
      impressions: Number(row.impressions) || 0,
      reach: Number(row.reach) || 0,
      frequency: Number(row.frequency) || 0,
      clicks: Number(row.clicks) || 0,
      ctr: Number(row.ctr) || 0,
      cpc: Number(row.cpc) || 0,
      cpm: Number(row.cpm) || 0,
      leads,
      cpl: leads > 0 ? (Number(row.spend) / leads) : 0,
      messages,
      cost_per_message: messages > 0 ? (Number(row.spend) / messages) : 0,
    }, { onConflict: 'entity_type,entity_id,date' });
  }

  console.log(`[Meta Ads] Ingested ${campaignData.length} campaign rows`);
  return { rows: campaignData.length };
}
