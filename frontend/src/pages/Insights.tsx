import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Lightbulb, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { useClientStore } from '../store/clientStore';
import api from '../api/client';

const impactColors: Record<string, string> = {
  high: 'badge-critical', medium: 'badge-warning', low: 'badge-info',
};
const categoryColors: Record<string, string> = {
  performance: 'badge-info', creative: 'badge-success', funnel: 'badge-warning', budget: 'badge-critical',
};

export default function Insights() {
  const { selectedClientId } = useClientStore();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', selectedClientId],
    queryFn: () => api.get('/insights', { params: { client_id: selectedClientId } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  const deleteInsight = useMutation({
    mutationFn: (id: number) => api.delete(`/insights/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insights'] }),
  });

  const generateManual = async () => {
    if (!selectedClientId) return;
    setGenerating(true);
    try {
      await api.post('/insights/generate', { client_id: selectedClientId, type: 'manual' });
      qc.invalidateQueries({ queryKey: ['insights'] });
    } finally {
      setGenerating(false);
    }
  };

  if (!selectedClientId) {
    return <div className="flex-1 p-6"><Header title="Insights" /><EmptyState message="Selecione um cliente" /></div>;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Insights"
        subtitle="Análises geradas por IA (GPT-4o)"
        actions={
          <button onClick={generateManual} disabled={generating} className="btn-primary flex items-center gap-2">
            <Plus size={14} />
            {generating ? 'Gerando...' : 'Gerar Insight'}
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !(insights || []).length ? (
        <EmptyState message="Nenhum insight gerado" sub="Clique em 'Gerar Insight' para criar uma análise com IA" />
      ) : (
        <div className="space-y-3">
          {(insights || []).map((ins: any) => (
            <div key={ins.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Lightbulb size={14} className="text-yellow-400 shrink-0" />
                    <span className={impactColors[ins.impact_level]}>{ins.impact_level}</span>
                    <span className={categoryColors[ins.category]}>{ins.category}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(ins.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {ins.type === 'weekly_wed' && <span className="badge-info">Semanal</span>}
                  </div>
                  {ins.summary && (
                    <p className="text-sm text-gray-300 mb-1 font-medium">{ins.summary}</p>
                  )}
                  {expanded === ins.id ? (
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans mt-2">{ins.content}</pre>
                  ) : (
                    <p className="text-sm text-gray-500 line-clamp-2">{ins.content.slice(0, 200)}…</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpanded(expanded === ins.id ? null : ins.id)}
                    className="text-gray-500 hover:text-gray-300 p-1"
                  >
                    {expanded === ins.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    onClick={() => deleteInsight.mutate(ins.id)}
                    className="text-gray-600 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
