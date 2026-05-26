import { supabase } from '../../config/supabase';

export async function runAlertChecks() {
  console.log('[Alerts] Running alert checks...');

  const { data: clients } = await supabase
    .from('clients')
    .select('*, client_kpis(*)')
    .eq('status', 'active');

  if (!clients?.length) return;

  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  for (const client of clients) {
    const { data: metrics } = await supabase
      .from('metrics_daily')
      .select('*')
      .eq('client_id', client.id)
      .eq('entity_type', 'campaign')
      .gte('date', sevenDaysAgo);

    if (!metrics?.length) continue;

    const totals = metrics.reduce((acc: any, m: any) => {
      acc.spend = (acc.spend || 0) + (m.spend || 0);
      acc.impressions = (acc.impressions || 0) + (m.impressions || 0);
      acc.clicks = (acc.clicks || 0) + (m.clicks || 0);
      acc.leads = (acc.leads || 0) + (m.leads || 0);
      acc.reach = (acc.reach || 0) + (m.reach || 0);
      return acc;
    }, {} as Record<string, number>);

    totals.cpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    totals.frequency = totals.reach > 0 ? totals.impressions / totals.reach : 0;
    totals.cpc = totals.clicks > 0 ? totals.spend / totals.clicks : 0;
    totals.cpm = totals.impressions > 0 ? (totals.spend / totals.impressions) * 1000 : 0;

    // Check KPI breaches
    for (const kpi of (client.client_kpis || [])) {
      const value = totals[kpi.name];
      if (value === undefined) continue;

      let severity: string | null = null;
      let score = 1;

      if (kpi.type === 'range') {
        if (value < kpi.min_value || value > kpi.max_value) {
          severity = 'warning';
          const distMin = Math.abs(value - kpi.min_value) / (kpi.target_value || 1);
          const distMax = Math.abs(value - kpi.max_value) / (kpi.target_value || 1);
          score = 1 - Math.max(distMin, distMax);
          if (score < 0.6) severity = 'critical';
        }
      } else if (kpi.type === 'lower_is_better') {
        if (kpi.max_value && value > kpi.max_value) {
          severity = 'warning';
          score = kpi.max_value / value;
          if (score < 0.6) severity = 'critical';
        }
      } else if (kpi.type === 'higher_is_better') {
        if (kpi.min_value && value < kpi.min_value) {
          severity = 'warning';
          score = value / kpi.min_value;
          if (score < 0.6) severity = 'critical';
        }
      }

      if (severity) {
        // Deduplication: max 1 alert per KPI per client per day
        const { data: existing } = await supabase
          .from('alerts')
          .select('id')
          .eq('client_id', client.id)
          .eq('kpi_name', kpi.name)
          .eq('type', 'kpi_breach')
          .eq('resolved', false)
          .gte('created_at', today);

        if (!existing?.length) {
          await supabase.from('alerts').insert({
            client_id: client.id,
            type: 'kpi_breach',
            kpi_name: kpi.name,
            severity,
            current_value: value,
            target_value: kpi.target_value,
            message: `KPI ${kpi.name} está em ${value.toFixed(2)} (meta: ${kpi.target_value})`,
            resolved: false,
          });
        }
      }
    }

    // Frequency alert
    if (totals.frequency >= 4.0) {
      const freqSeverity = totals.frequency >= 5.0 ? 'critical' : 'warning';
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('client_id', client.id)
        .eq('type', 'frequency_high')
        .eq('resolved', false)
        .gte('created_at', today);

      if (!existing?.length) {
        await supabase.from('alerts').insert({
          client_id: client.id,
          type: 'frequency_high',
          kpi_name: 'frequency',
          severity: freqSeverity,
          current_value: totals.frequency,
          target_value: 4.0,
          message: `Frequência alta: ${totals.frequency.toFixed(2)} (limite: 4.0)`,
          resolved: false,
        });
      }
    }
  }

  console.log('[Alerts] Alert checks completed.');
}
