import { useQuery } from '@tanstack/react-query';
import { useClientStore } from '../store/clientStore';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import api from '../api/client';

const platformColors: Record<string, string> = {
  meta: 'badge-info',
  google: 'badge-success',
  tiktok: 'badge-warning',
};

export default function Campaigns() {
  const { selectedClientId } = useClientStore();

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns', selectedClientId],
    queryFn: () => api.get('/campaigns', { params: { client_id: selectedClientId } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  if (!selectedClientId) {
    return (
      <div className="flex-1 p-6">
        <Header title="Campanhas" />
        <EmptyState message="Selecione um cliente" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header title="Campanhas" subtitle={`${(campaigns || []).length} campanhas`} />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !(campaigns || []).length ? (
        <EmptyState message="Nenhuma campanha encontrada" sub="Execute a ingestão de dados para importar campanhas do Meta Ads" />
      ) : (
        <div className="space-y-3">
          {(campaigns || []).map((c: any) => (
            <div key={c.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-200 text-sm">{c.name}</span>
                  <span className={platformColors[c.platform] || 'badge-info'}>{c.platform}</span>
                  <span className={c.status === 'active' ? 'badge-success' : 'badge-warning'}>{c.status}</span>
                </div>
                {c.objective && <span className="text-xs text-gray-500">{c.objective}</span>}
              </div>
              {(c.ad_sets || []).length > 0 && (
                <div className="mt-2 pl-3 border-l border-gray-800 space-y-1">
                  {c.ad_sets.map((as: any) => (
                    <div key={as.id} className="text-xs text-gray-500">
                      Ad Set: {as.name}
                      {(as.creatives || []).length > 0 && (
                        <span className="ml-2 text-gray-600">· {as.creatives.length} criativo(s)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {c.external_id && <div className="text-xs text-gray-700 mt-1">ID: {c.external_id}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
