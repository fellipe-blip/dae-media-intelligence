import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useClientStore } from '../store/clientStore';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import api from '../api/client';
import { FunnelTotals } from '../types';

const fmtBRL = (n: number) => `R$ ${n?.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) || '0'}`;
const fmtPct = (n: number) => `${n?.toFixed(1) || '0'}%`;

export default function Funnel() {
  const { selectedClientId } = useClientStore();
  const [days, setDays] = useState(30);
  const [breakdown, setBreakdown] = useState<'campaign' | 'creative'>('campaign');

  const { data, isLoading } = useQuery<{ totals: FunnelTotals; daily: any[] }>({
    queryKey: ['funnel', selectedClientId, days],
    queryFn: () => api.get('/funnel', { params: { client_id: selectedClientId, days } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  const { data: breakdownData } = useQuery({
    queryKey: ['funnel', 'breakdown', selectedClientId, days, breakdown],
    queryFn: () => api.get('/funnel/breakdown', { params: { client_id: selectedClientId, days, by: breakdown } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  if (!selectedClientId) {
    return <div className="flex-1 p-6"><Header title="Funil CRM" /><EmptyState message="Selecione um cliente" /></div>;
  }

  const t = data?.totals;

  const stages = [
    { label: 'Leads', value: t?.leads || 0, color: 'bg-blue-500' },
    { label: 'MQL', value: t?.mql || 0, color: 'bg-purple-500' },
    { label: 'SQL', value: t?.sql || 0, color: 'bg-yellow-500' },
    { label: 'Venda', value: t?.sales || 0, color: 'bg-green-500' },
  ];

  const maxVal = Math.max(...stages.map(s => s.value), 1);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Funil CRM"
        subtitle="Jornada Lead → Venda"
        actions={
          <select
            value={days}
            onChange={e => setDays(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
          >
            <option value={7}>7 dias</option>
            <option value={30}>30 dias</option>
            <option value={60}>60 dias</option>
            <option value={90}>90 dias</option>
          </select>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : (
        <>
          {/* Funnel visualization */}
          <div className="card mb-6">
            <div className="flex items-end gap-2 mb-6" style={{ height: 140 }}>
              {stages.map(s => (
                <div key={s.label} className="flex-1 flex flex-col items-center justify-end gap-1">
                  <span className="text-sm font-bold text-gray-200">{s.value.toLocaleString()}</span>
                  <div
                    className={`w-full rounded-t ${s.color} opacity-80`}
                    style={{ height: `${(s.value / maxVal) * 100}%`, minHeight: 4 }}
                  />
                  <span className="text-xs text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Conversion rates */}
            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-400">{fmtPct(t?.lead_to_mql || 0)}</div>
                <div className="text-xs text-gray-500">Lead → MQL</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-400">{fmtPct(t?.mql_to_sql || 0)}</div>
                <div className="text-xs text-gray-500">MQL → SQL</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-400">{fmtPct(t?.sql_to_sale || 0)}</div>
                <div className="text-xs text-gray-500">SQL → Venda</div>
              </div>
            </div>
          </div>

          {/* Cost metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-1">Custo por MQL</div>
              <div className="text-xl font-bold text-gray-200">{fmtBRL(t?.cost_per_mql || 0)}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-1">Custo por SQL</div>
              <div className="text-xl font-bold text-gray-200">{fmtBRL(t?.cost_per_sql || 0)}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-1">Custo por Venda</div>
              <div className="text-xl font-bold text-gray-200">{fmtBRL(t?.cost_per_sale || 0)}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-gray-500 mb-1">ROAS</div>
              <div className="text-xl font-bold text-green-400">{(t?.roas || 0).toFixed(2)}x</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-300">Breakdown por</h3>
              <div className="flex gap-2">
                <button
                  className={breakdown === 'campaign' ? 'btn-primary py-1' : 'btn-secondary py-1'}
                  onClick={() => setBreakdown('campaign')}
                >Campanha</button>
                <button
                  className={breakdown === 'creative' ? 'btn-primary py-1' : 'btn-secondary py-1'}
                  onClick={() => setBreakdown('creative')}
                >Criativo</button>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-left">
                  <th className="pb-2 text-gray-500 font-medium">Nome</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Leads</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">MQL</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">SQL</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Vendas</th>
                  <th className="pb-2 text-gray-500 font-medium text-right">Spend</th>
                </tr>
              </thead>
              <tbody>
                {(breakdownData || []).map((b: any) => (
                  <tr key={b.id} className="border-b border-gray-800/50">
                    <td className="py-2 text-gray-300 text-xs max-w-xs truncate">{b.name}</td>
                    <td className="py-2 text-right text-gray-400">{b.leads}</td>
                    <td className="py-2 text-right text-purple-400">{b.mql}</td>
                    <td className="py-2 text-right text-yellow-400">{b.sql}</td>
                    <td className="py-2 text-right text-green-400">{b.sales}</td>
                    <td className="py-2 text-right text-gray-300">R$ {b.spend?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
