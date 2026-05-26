import axios from 'axios';
import { supabase } from '../../config/supabase';

const RD_BASE = 'https://crm.rdstation.com/api/v1';

interface Deal {
  id: string;
  name: string;
  win: boolean;
  deal_stage_id: string;
  campaign_id?: string;
  amount_montly?: number;
  created_at: string;
  updated_at: string;
  custom_fields?: { custom_field_id: string; value: any }[];
}

export async function ingestRDStation(clientId: number, token: string, stageConfig: any, rdFonteField?: string) {
  console.log(`[RD Station] Ingesting for client ${clientId}`);

  const { data } = await axios.get(`${RD_BASE}/deals`, {
    params: { token, limit: 200, page: 1 },
  });

  const deals: Deal[] = data.deals || [];
  const today = new Date().toISOString().split('T')[0];

  const stageOrderMap: Record<string, number> = stageConfig?.stageOrderMap || {};
  const prefixMap: Record<string, string> = stageConfig?.prefixMap || {};

  // Aggregate funnel metrics for today
  const funnel = { leads: 0, mql: 0, sql: 0, sales: 0, revenue: 0, spend: 0 };

  for (const deal of deals) {
    // Filter by fonte if configured
    if (rdFonteField) {
      const fonteField = deal.custom_fields?.find(f => f.custom_field_id === rdFonteField);
      if (!fonteField?.value?.toString().toLowerCase().includes('meta')) continue;
    }

    funnel.leads++;
    if (deal.win) {
      funnel.sales++;
      funnel.revenue += deal.amount_montly || 0;
    }

    // Determine funnel stage
    const stageOrder = stageOrderMap[deal.deal_stage_id];
    if (stageOrder !== undefined) {
      if (stageOrder >= 1) funnel.mql++;
      if (stageOrder >= 2) funnel.sql++;
    } else {
      // Check prefix
      for (const [prefix, level] of Object.entries(prefixMap)) {
        if (deal.deal_stage_id.startsWith(prefix)) {
          if (level === 'mql' || level === 'sql' || level === 'sale') funnel.mql++;
          if (level === 'sql' || level === 'sale') funnel.sql++;
          break;
        }
      }
    }
  }

  await supabase.from('crm_metrics').upsert({
    client_id: clientId,
    date: today,
    leads: funnel.leads,
    mql: funnel.mql,
    sql: funnel.sql,
    sales: funnel.sales,
    revenue: funnel.revenue,
    spend: funnel.spend,
  }, { onConflict: 'client_id,date' });

  console.log(`[RD Station] Ingested: leads=${funnel.leads}, mql=${funnel.mql}, sql=${funnel.sql}, sales=${funnel.sales}`);
  return funnel;
}
