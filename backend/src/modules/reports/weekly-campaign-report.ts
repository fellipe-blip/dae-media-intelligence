import { supabase } from '../../config/supabase';

function extractTag(name: string): string {
  const match = name.match(/\[([^\]]+)\]/);
  return match ? match[1] : name;
}

type CampaignType = 'wpp' | 'forms' | 'vp' | 'vendas' | 'other';

function classifyObjective(name: string): CampaignType {
  const upper = name.toUpperCase();
  if (upper.includes('[WPP]') || upper.includes('_WPP_') || upper.includes(' WPP ') || upper.includes('-WPP-')) return 'wpp';
  if (upper.includes('[FORMS]') || upper.includes('_FORMS_') || upper.includes(' FORMS ') || upper.includes('-FORMS-')) return 'forms';
  if (upper.includes('[VP]') || upper.includes('_VP_') || upper.includes(' VP ') || upper.includes('-VP-') || upper.includes('VISITA')) return 'vp';
  if (upper.includes('[VENDAS]') || upper.includes('_VENDAS_') || upper.includes(' VENDAS ') || upper.includes('-VENDAS-') || upper.includes('COMPRA')) return 'vendas';
  return 'other';
}

interface GroupData {
  name: string;
  spend: number;
  reach: number;
  // WPP
  messages: number;
  cost_per_message: number;
  // FORMS
  leads: number;
  cpl: number;
  // VP
  clicks: number;
  cpc: number;
  // VENDAS
  purchases: number;
  cost_per_purchase: number;
  add_to_cart: number;
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

  const groups: Record<string, GroupData & { type: CampaignType }> = {};

  for (const m of (metrics || []) as any[]) {
    const campName = m.campaigns?.name || '';
    const tag = extractTag(campName);
    const type = classifyObjective(campName);
    const key = `${type}_${tag}`;

    if (!groups[key]) {
      groups[key] = {
        type, name: tag,
        spend: 0, reach: 0,
        messages: 0, cost_per_message: 0,
        leads: 0, cpl: 0,
        clicks: 0, cpc: 0,
        purchases: 0, cost_per_purchase: 0, add_to_cart: 0,
      };
    }

    const g = groups[key];
    g.spend += m.spend || 0;
    g.reach += m.reach || 0;
    g.messages += m.messages || 0;
    g.leads += m.leads || 0;
    g.clicks += m.clicks || 0;
    g.purchases += m.purchases || 0;
    g.add_to_cart += m.add_to_cart || 0;
  }

  // Recalcular métricas derivadas após somar
  for (const g of Object.values(groups)) {
    g.cost_per_message = g.messages > 0 ? g.spend / g.messages : 0;
    g.cpl = g.leads > 0 ? g.spend / g.leads : 0;
    g.cpc = g.clicks > 0 ? g.spend / g.clicks : 0;
    g.cost_per_purchase = g.purchases > 0 ? g.spend / g.purchases : 0;
  }

  const wppGroups    = Object.values(groups).filter(g => g.type === 'wpp');
  const formsGroups  = Object.values(groups).filter(g => g.type === 'forms');
  const vpGroups     = Object.values(groups).filter(g => g.type === 'vp');
  const vendasGroups = Object.values(groups).filter(g => g.type === 'vendas');
  const otherGroups  = Object.values(groups).filter(g => g.type === 'other');

  let content = `# Relatório Semanal de Campanhas\n`;
  content += `**Cliente:** ${client.name}\n`;
  content += `**Período:** ${start} a ${end}\n\n`;

  // WPP
  if (wppGroups.length) {
    content += `## WPP — Mensagens\n`;
    for (const g of wppGroups) {
      content += `### ${g.name}\n`;
      content += `- Mensagens: **${g.messages}**\n`;
      content += `- Custo por Mensagem: R$ ${g.cost_per_message.toFixed(2)}\n`;
      content += `- Valor Gasto: R$ ${g.spend.toFixed(2)}\n`;
      content += `- Alcance: ${g.reach.toLocaleString('pt-BR')}\n\n`;
    }
  }

  // FORMS
  if (formsGroups.length) {
    content += `## Forms — Leads\n`;
    for (const g of formsGroups) {
      content += `### ${g.name}\n`;
      content += `- Leads: **${g.leads}**\n`;
      content += `- Custo por Lead (CPL): R$ ${g.cpl.toFixed(2)}\n`;
      content += `- Valor Gasto: R$ ${g.spend.toFixed(2)}\n`;
      content += `- Alcance: ${g.reach.toLocaleString('pt-BR')}\n\n`;
    }
  }

  // VP
  if (vpGroups.length) {
    content += `## VP — Visita ao Perfil\n`;
    for (const g of vpGroups) {
      content += `### ${g.name}\n`;
      content += `- Visitas ao Perfil: **${g.clicks}**\n`;
      content += `- Custo por Visita: R$ ${g.cpc.toFixed(2)}\n`;
      content += `- Valor Gasto: R$ ${g.spend.toFixed(2)}\n`;
      content += `- Alcance: ${g.reach.toLocaleString('pt-BR')}\n\n`;
    }
  }

  // VENDAS
  if (vendasGroups.length) {
    content += `## Vendas — Compras\n`;
    for (const g of vendasGroups) {
      content += `### ${g.name}\n`;
      content += `- Compras: **${g.purchases}**\n`;
      content += `- Custo por Compra: R$ ${g.cost_per_purchase.toFixed(2)}\n`;
      content += `- Carrinhos Adicionados: ${g.add_to_cart}\n`;
      content += `- Valor Gasto: R$ ${g.spend.toFixed(2)}\n`;
      content += `- Alcance: ${g.reach.toLocaleString('pt-BR')}\n\n`;
    }
  }

  // Outros
  if (otherGroups.length) {
    content += `## Outros\n`;
    for (const g of otherGroups) {
      content += `### ${g.name}\n`;
      content += `- Valor Gasto: R$ ${g.spend.toFixed(2)}\n`;
      content += `- Alcance: ${g.reach.toLocaleString('pt-BR')}\n\n`;
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
