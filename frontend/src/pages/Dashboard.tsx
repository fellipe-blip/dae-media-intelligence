import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, TrendingDown, MousePointer, Radio, MessageCircle, AlertTriangle, Lightbulb } from 'lucide-react';
import Header from '../components/layout/Header';
import MetricCard from '../components/ui/MetricCard';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { useClientStore } from '../store/clientStore';
import { useMetricsSummary, useMetricsTimeseries } from '../hooks/useMetrics';
import api from '../api/client';

const fmt = (n: number, prefix = '') => `${prefix}${n?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) || '0'}`;
const fmtBRL = (n: number) => `R$ ${fmt(n)}`;

export default function Dashboard() {
  const { selectedClientId } = useClientStore();
  const [days, setDays] = useState(30);

  const { data: summary, isLoading: loadingSummary } = useMetricsSummary(selectedClientId, days);
  const { data: timeseries } = useMetricsTimeseries(selectedClientId, days);

  const { data: alerts } = useQuery({
    queryKey: ['alerts', selectedClientId, 'active'],
    queryFn: () => api.get('/alerts', { params: { client_id: selectedClientId, resolved: false } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  const { data: insights } = useQuery({
    queryKey: ['insights', selectedClientId],
    queryFn: () => api.get('/insights', { params: { client_id: selectedClientId, limit: 3 } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  const { data: client } = useQuery({
    queryKey: ['clients', selectedClientId],
    queryFn: () => api.get(`/clients/${selectedClientId}`).then(r => r.data),
    enabled: !!selectedClientId,
  });

  if (!selectedClientId) {
    return (
      <div className="flex-1 p-6">
        <Header title="Dashboard" subtitle="Selecione um cliente para visualizar os dados" />
        <EmptyState message="Nenhum cliente selecionado" sub="Escolha um cliente no seletor acima" />
      </div>
    );
  }

  const criticalAlerts = (alerts || []).filter((a: any) => a.severity === 'critical');
  const warningAlerts = (alerts || []).filter((a: any) => a.severity === 'warning');

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title={client?.name || 'Dashboard'}
        subtitle={`Últimos ${days} dias`}
        actions={
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            <option value={7}>7 dias</option>
            <option value={14}>14 dias</option>
            <option value={30}>30 dias</option>
          </select>
        }
      />

      {/* Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-4 p-3 bg-red-950 border border-red-800 rounded-xl flex items-center gap-3">
          <AlertTriangle size={16} className="text-red-400 shrink-0" />
          <span className="text-sm text-red-300">
            {criticalAlerts.length} alerta(s) crítico(s) ativo(s) — verifique a página de Alertas
          </span>
        </div>
      )}
      {warningAlerts.length > 0 && criticalAlerts.length === 0 && (
        <div className="mb-4 p-3 bg-yellow-950 border border-yellow-800 rounded-xl flex items-center gap-3">
          <AlertTriangle size={16} className="text-yellow-400 shrink-0" />
          <span className="text-sm text-yellow-300">
            {warningAlerts.length} aviso(s) ativo(s)
          </span>
        </div>
      )}

      {loadingSummary ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard label="Spend" value={fmtBRL(summary?.spend || 0)} icon={<DollarSign size={16} />} color="text-green-400" />
            <MetricCard label="Leads" value={fmt(summary?.leads || 0)} icon={<Users size={16} />} color="text-blue-400" />
            <MetricCard label="CPL" value={fmtBRL(summary?.cpl || 0)} icon={<TrendingDown size={16} />} color="text-purple-400" />
            <MetricCard label="CTR" value={`${(summary?.ctr || 0).toFixed(2)}%`} icon={<MousePointer size={16} />} color="text-yellow-400" />
            <MetricCard label="Impressões" value={fmt(summary?.impressions || 0)} icon={<Radio size={16} />} color="text-gray-400" />
            <MetricCard label="Mensagens" value={fmt(summary?.messages || 0)} icon={<MessageCircle size={16} />} color="text-teal-400" />
            <MetricCard label="CPC" value={fmtBRL(summary?.cpc || 0)} icon={<MousePointer size={16} />} color="text-orange-400" />
            <MetricCard label="Cliques" value={fmt(summary?.clicks || 0)} icon={<MousePointer size={16} />} color="text-pink-400" />
          </div>

          {/* Trend chart */}
          <div className="card mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Evolução de Spend e Leads</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timeseries || []} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Area type="monotone" dataKey="spend" stroke="#3b82f6" fill="url(#spendGrad)" name="Spend (R$)" strokeWidth={2} />
                <Area type="monotone" dataKey="leads" stroke="#10b981" fill="url(#leadsGrad)" name="Leads" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* KPI status */}
          {client?.client_kpis?.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Status dos KPIs</h3>
              <div className="space-y-2">
                {client.client_kpis.map((kpi: any) => {
                  const val = (summary as any)?.[kpi.name];
                  let status = 'on_target';
                  if (val !== undefined) {
                    if (kpi.type === 'lower_is_better' && kpi.max_value && val > kpi.max_value) status = val > kpi.max_value * 1.2 ? 'breach' : 'warning';
                    if (kpi.type === 'higher_is_better' && kpi.min_value && val < kpi.min_value) status = val < kpi.min_value * 0.8 ? 'breach' : 'warning';
                    if (kpi.type === 'range' && (val < kpi.min_value || val > kpi.max_value)) status = 'warning';
                  }
                  return (
                    <div key={kpi.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <span className="text-sm text-gray-300">{kpi.name.toUpperCase()}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-200">
                          {val !== undefined ? val.toFixed(2) : '—'}
                        </span>
                        <span className="text-xs text-gray-500">meta: {kpi.target_value}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          status === 'on_target' ? 'bg-green-950 text-green-400' :
                          status === 'warning' ? 'bg-yellow-950 text-yellow-400' :
                          'bg-red-950 text-red-400'
                        }`}>
                          {status === 'on_target' ? 'OK' : status === 'warning' ? 'Atenção' : 'Breach'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent insights */}
          {(insights || []).length > 0 && (
            <div className="card">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} className="text-yellow-400" />
                <h3 className="text-sm font-medium text-gray-300">Insights Recentes</h3>
              </div>
              <div className="space-y-3">
                {(insights || []).map((ins: any) => (
                  <div key={ins.id} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        ins.impact_level === 'high' ? 'bg-red-950 text-red-400' :
                        ins.impact_level === 'medium' ? 'bg-yellow-950 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                      }`}>
                        {ins.impact_level}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(ins.generated_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2">{ins.summary || ins.content.slice(0, 120)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
