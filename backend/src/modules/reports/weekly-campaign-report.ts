import { supabase } from '../../config/supabase';

function extractTag(name: string): string {
  const match = name.match(/\[([^\]]+)\]/);
  return match ? match[1] : name;
}

function classifyObjective(name: string): 'leads_forms' | 'leads_wpp' | 'whatsapp' | 'traffic' | 'other' {
  const lower = name.toLowerCase();
  if (lower.includes('[wpp]') || lower.includes('whatsapp')) return lower.includes('[forms]') ? 'leads_forms' : 'leads_wpp';
  if (lower.includes('[forms]') || lower.includes('form')) return 'leads_forms';
  if (lower.includes('tráfego') || lower.includes('vp') || lower.includes('traffic')) return 'traffic';
  return 'other';
}

export async function generateWeeklyCampaignReport(clientId: number) {
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
  if (!client) throw new Error('Client not found');

  const today = new Date();
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - today.getDay() - 6);
  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);

  const start = lastMonday.toISOString().split('T')[0];
  const end = lastSunday.toISOString().split('T')[0];

  const { data: metrics } = await supabase
    .from('metrics_daily')
    .select('*, campaigns(name, objective)')
    .eq('client_id', clientId)
    .eq('entity_type', 'campaign')
    .gte('date', start)
    .lte('date', end);

  const { data: crmMetrics } = await supabase
    .from('crm_metrics')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', start)
    .lte('date', end);

  // Group by campaign objective
  const groups: Record<string, { name: string; spend: number; leads: number; messages: number; clicks: number; impressions: number; }> = {};

  for (const m of (metrics || []) as any[]) {
    const campName = m.campaigns?.name || '';
    const tag = extractTag(campName);
    const obj = classifyObjective(campName);
    const key = `${obj}_${tag}`;
    if (!groups[key]) groups[key] = { name: tag, spend: 0, leads: 0, messages: 0, clicks: 0, impressions: 0 };
    groups[key].spend += m.spend || 0;
    groups[key].leads += m.leads || 0;
    groups[key].messages += m.messages || 0;
    groups[key].clicks += m.clicks || 0;
    groups[key].impressions += m.impressions || 0;
  }

  const crmTotals = (crmMetrics || []).reduce((acc: any, m: any) => {
    acc.mql = (acc.mql || 0) + (m.mql || 0);
    acc.sql = (acc.sql || 0) + (m.sql || 0);
    acc.sales = (acc.sales || 0) + (m.sales || 0);
    return acc;
  }, {} as Record<string, number>);

  let content = `# Relatório Semanal de Campanhas\n`;
  content += `**Cliente:** ${client.name}\n`;
  content += `**Período:** ${start} a ${end}\n\n`;

  const leadsGroups = Object.entries(groups).filter(([k]) => k.startsWith('leads'));
  const wppGroups = Object.entries(groups).filter(([k]) => k.startsWith('whatsapp'));
  const trafficGroups = Object.entries(groups).filter(([k]) => k.startsWith('traffic'));
  const otherGroups = Object.entries(groups).filter(([k]) => k.startsWith('other'));

  if (leadsGroups.length) {
    content += `## Leads\n`;
    for (const [, g] of leadsGroups) {
      const cpl = g.leads > 0 ? g.spend / g.leads : 0;
      content += `### ${g.name}\n`;
      content += `- Leads: ${g.leads} | CPL: R$ ${cpl.toFixed(2)} | Spend: R$ ${g.spend.toFixed(2)}\n`;
    }
    content += `\n**Funil CRM:** MQL: ${crmTotals.mql || 0} | SQL: ${crmTotals.sql || 0} | Vendas: ${crmTotals.sales || 0}\n\n`;
  }

  if (wppGroups.length) {
    content += `## WhatsApp\n`;
    for (const [, g] of wppGroups) {
      const cpm = g.messages > 0 ? g.spend / g.messages : 0;
      content += `### ${g.name}\n`;
      content += `- Mensagens: ${g.messages} | Custo/msg: R$ ${cpm.toFixed(2)} | Spend: R$ ${g.spend.toFixed(2)}\n`;
    }
    content += '\n';
  }

  if (trafficGroups.length) {
    content += `## Tráfego/VP\n`;
    for (const [, g] of trafficGroups) {
      const ctr = g.impressions > 0 ? (g.clicks / g.impressions) * 100 : 0;
      content += `### ${g.name}\n`;
      content += `- Cliques: ${g.clicks} | CTR: ${ctr.toFixed(2)}% | Spend: R$ ${g.spend.toFixed(2)}\n`;
    }
    content += '\n';
  }

  if (otherGroups.length) {
    content += `## Outros\n`;
    for (const [, g] of otherGroups) {
      content += `### ${g.name}\n`;
      content += `- Spend: R$ ${g.spend.toFixed(2)} | Impressões: ${g.impressions.toLocaleString()}\n`;
    }
  }

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      client_id: clientId,
      type: 'weekly_mon',
      title: `Relatório Semanal — ${client.name} (${start})`,
      content,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return report;
}
