import { supabase } from '../../config/supabase';

export async function generateWeeklyActivitiesReport(clientId: number) {
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
  if (!client) throw new Error('Client not found');

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const start = monday.toISOString().split('T')[0];
  const end = today.toISOString().split('T')[0];

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('client_id', clientId)
    .is('archived_at', null)
    .gte('created_at', start)
    .lte('created_at', end + 'T23:59:59')
    .order('created_at');

  const grouped: Record<string, typeof activities> = {};
  for (const a of (activities || [])) {
    const type = a.activity_type;
    if (!grouped[type]) grouped[type] = [];
    grouped[type]!.push(a);
  }

  const typeLabels: Record<string, string> = {
    budget_change: 'Alterações de Orçamento',
    creative_pause: 'Criativos Pausados',
    creative_launch: 'Criativos Lançados',
    campaign_pause: 'Campanhas Pausadas',
    campaign_launch: 'Campanhas Lançadas',
    kpi_update: 'Atualizações de KPI',
    note: 'Anotações',
    meeting: 'Reuniões',
    optimization: 'Otimizações',
  };

  let content = `# Relatório de Atividades da Semana\n`;
  content += `**Cliente:** ${client.name}\n`;
  content += `**Período:** ${start} a ${end}\n\n`;

  if (!activities?.length) {
    content += `Nenhuma atividade registrada nesta semana.\n`;
  } else {
    for (const [type, acts] of Object.entries(grouped)) {
      content += `## ${typeLabels[type] || type}\n`;
      for (const a of (acts || [])) {
        const date = new Date(a.created_at).toLocaleDateString('pt-BR');
        content += `- [${date}] ${a.description || a.title || '—'}\n`;
      }
      content += '\n';
    }
  }

  const { data: report, error } = await supabase
    .from('reports')
    .insert({
      client_id: clientId,
      type: 'weekly_fri',
      title: `Relatório de Atividades — ${client.name} (${end})`,
      content,
      generated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return report;
}

export async function archivePreviousWeekActivities(clientId: number) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1);
  const mondayStr = monday.toISOString().split('T')[0];

  const { error } = await supabase
    .from('activities')
    .update({ archived_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .is('archived_at', null)
    .lt('created_at', mondayStr);

  if (error) throw error;
}
