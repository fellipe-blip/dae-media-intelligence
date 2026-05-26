import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useClientStore } from '../store/clientStore';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import api from '../api/client';

export default function Creatives() {
  const { selectedClientId } = useClientStore();
  const [days, setDays] = useState(30);

  const { data: creatives, isLoading } = useQuery({
    queryKey: ['creatives', selectedClientId, days],
    queryFn: () => api.get('/metrics/creatives', { params: { client_id: selectedClientId, days } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  if (!selectedClientId) {
    return <div className="flex-1 p-6"><Header title="Criativos" /><EmptyState message="Selecione um cliente" /></div>;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Criativos"
        subtitle="Performance dos criativos"
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

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !(creatives || []).length ? (
        <EmptyState message="Nenhum criativo com dados" sub="Execute a ingestão para importar métricas de criativos" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="pb-2 text-gray-500 font-medium">Criativo</th>
                <th className="pb-2 text-gray-500 font-medium text-right">Spend</th>
                <th className="pb-2 text-gray-500 font-medium text-right">Impressões</th>
                <th className="pb-2 text-gray-500 font-medium text-right">Cliques</th>
                <th className="pb-2 text-gray-500 font-medium text-right">Leads</th>
                <th className="pb-2 text-gray-500 font-medium text-right">CPL</th>
                <th className="pb-2 text-gray-500 font-medium text-right">CTR</th>
              </tr>
            </thead>
            <tbody>
              {(creatives || []).map((c: any) => (
                <tr key={c.entity_id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      {c.thumbnail_url && (
                        <img src={c.thumbnail_url} alt="" className="w-8 h-8 rounded object-cover" />
                      )}
                      <div>
                        <div className="text-gray-200">{c.name}</div>
                        <div className="text-xs text-gray-600">{c.creative_type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-gray-300">R$ {c.spend?.toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-400">{c.impressions?.toLocaleString()}</td>
                  <td className="py-3 text-right text-gray-400">{c.clicks?.toLocaleString()}</td>
                  <td className="py-3 text-right text-blue-400 font-medium">{c.leads}</td>
                  <td className="py-3 text-right text-gray-300">R$ {c.cpl?.toFixed(2)}</td>
                  <td className="py-3 text-right text-gray-400">{c.ctr?.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
