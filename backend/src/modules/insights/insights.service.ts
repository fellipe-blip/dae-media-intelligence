import OpenAI from 'openai';
import { supabase } from '../../config/supabase';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateInsight(clientId: number, type: 'weekly_wed' | 'manual' = 'manual') {
  const { data: client } = await supabase
    .from('clients')
    .select('*, client_kpis(*)')
    .eq('id', clientId)
    .single();

  if (!client) throw new Error('Client not found');

  const days = type === 'manual' ? 7 : 30;
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const { data: metrics } = await supabase
    .from('metrics_daily')
    .select('*')
    .eq('client_id', clientId)
    .eq('entity_type', 'campaign')
    .gte('date', startDate)
    .order('date');

  const { data: crmMetrics } = await supabase
    .from('crm_metrics')
    .select('*')
    .eq('client_id', clientId)
    .gte('date', startDate)
    .order('date');

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('client_id', clientId)
    .eq('status', 'active');

  // Aggregate totals
  const totals = (metrics || []).reduce((acc: any, m: any) => {
    acc.spend = (acc.spend || 0) + (m.spend || 0);
    acc.impressions = (acc.impressions || 0) + (m.impressions || 0);
    acc.clicks = (acc.clicks || 0) + (m.clicks || 0);
    acc.leads = (acc.leads || 0) + (m.leads || 0);
    acc.reach = (acc.reach || 0) + (m.reach || 0);
    acc.messages = (acc.messages || 0) + (m.messages || 0);
    return acc;
  }, {} as Record<string, number>);

  totals.cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  totals.frequency = totals.reach > 0 ? totals.impressions / totals.reach : 0;

  const crmTotals = (crmMetrics || []).reduce((acc: any, m: any) => {
    acc.mql = (acc.mql || 0) + (m.mql || 0);
    acc.sql = (acc.sql || 0) + (m.sql || 0);
    acc.sales = (acc.sales || 0) + (m.sales || 0);
    return acc;
  }, {} as Record<string, number>);

  const systemPrompt = type === 'weekly_wed'
    ? `Você é um especialista em marketing digital analisando dados de campanhas pagas para uma agência.
Responda sempre em português.
OBRIGATÓRIO: inclua seção "## Evolução (7d vs 14d vs 30d)" comparando os períodos.
Analise: performance por objetivo de campanha, criativos, funil CRM.
Classifique cada insight com: impact_level (high/medium/low), category (performance/creative/funnel/budget), summary (1 linha).`
    : `Você é um especialista em marketing digital. Análise concisa em português.
Máximo 3 próximos passos. Foco na semana atual. Sem comparação temporal.`;

  const userMessage = `
Cliente: ${client.name}
Período: últimos ${days} dias
Objetivos: ${(client.objectives || []).join(', ')}
Budget mensal: R$ ${client.monthly_budget || 0}

Métricas agregadas:
- Spend: R$ ${totals.spend?.toFixed(2)}
- Impressões: ${totals.impressions?.toLocaleString()}
- Cliques: ${totals.clicks?.toLocaleString()}
- Leads: ${totals.leads}
- CTR: ${totals.ctr?.toFixed(2)}%
- CPL: R$ ${totals.cpl?.toFixed(2)}
- Frequência: ${totals.frequency?.toFixed(2)}
- Mensagens: ${totals.messages}

Funil CRM:
- MQL: ${crmTotals.mql || 0}
- SQL: ${crmTotals.sql || 0}
- Vendas: ${crmTotals.sales || 0}

Campanhas ativas: ${campaigns?.length || 0}
KPIs configurados: ${(client.client_kpis || []).map((k: any) => `${k.name}: meta ${k.target_value}`).join(', ')}
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    max_tokens: 2000,
  });

  const content = response.choices[0].message.content || '';

  const { data: insight, error } = await supabase
    .from('insights')
    .insert({
      client_id: clientId,
      type,
      content,
      impact_level: detectImpactLevel(content),
      category: detectCategory(content),
      summary: extractSummary(content),
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return insight;
}

function detectImpactLevel(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('crítico') || lower.includes('urgente') || lower.includes('alto impacto')) return 'high';
  if (lower.includes('atenção') || lower.includes('moderado')) return 'medium';
  return 'low';
}

function detectCategory(content: string): string {
  const lower = content.toLowerCase();
  if (lower.includes('criativo') || lower.includes('creative')) return 'creative';
  if (lower.includes('funil') || lower.includes('crm') || lower.includes('lead')) return 'funnel';
  if (lower.includes('budget') || lower.includes('orçamento')) return 'budget';
  return 'performance';
}

function extractSummary(content: string): string {
  const lines = content.split('\n').filter(l => l.trim());
  return lines[0]?.replace(/^#+\s*/, '').slice(0, 120) || 'Análise gerada com IA';
}
