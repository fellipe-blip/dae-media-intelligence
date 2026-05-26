import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useClientStore } from '../store/clientStore';
import api from '../api/client';

const typeLabels: Record<string, string> = {
  weekly_mon: 'Segunda — Campanhas',
  weekly_wed: 'Quarta — IA',
  weekly_fri: 'Sexta — Atividades',
  manual: 'Manual',
};

export default function Reports() {
  const { selectedClientId } = useClientStore();
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<number | null>(null);
  const [genModal, setGenModal] = useState(false);
  const [generating, setGenerating] = useState('');

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', selectedClientId],
    queryFn: () => api.get('/reports', { params: { client_id: selectedClientId } }).then(r => r.data),
    enabled: !!selectedClientId,
  });

  const deleteReport = useMutation({
    mutationFn: (id: number) => api.delete(`/reports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });

  const generate = async (type: string) => {
    if (!selectedClientId) return;
    setGenerating(type);
    try {
      if (type === 'weekly_mon') await api.post('/reports/generate/weekly-campaign', { client_id: selectedClientId });
      else if (type === 'weekly_fri') await api.post('/reports/generate/weekly-activities', { client_id: selectedClientId });
      else if (type === 'weekly_wed') await api.post('/reports/generate/weekly-wed', { client_id: selectedClientId });
      qc.invalidateQueries({ queryKey: ['reports'] });
      setGenModal(false);
    } finally {
      setGenerating('');
    }
  };

  if (!selectedClientId) {
    return <div className="flex-1 p-6"><Header title="Relatórios" /><EmptyState message="Selecione um cliente" /></div>;
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Relatórios"
        subtitle={`${(reports || []).length} relatórios`}
        actions={
          <button onClick={() => setGenModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={14} />Gerar Relatório
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !(reports || []).length ? (
        <EmptyState message="Nenhum relatório" sub="Relatórios são gerados automaticamente (Seg/Qua/Sex) ou manualmente" />
      ) : (
        <div className="space-y-3">
          {(reports || []).map((r: any) => (
            <div key={r.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-blue-400 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-200">{r.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="badge-info">{typeLabels[r.type] || r.type}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(r.generated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                    className="text-gray-500 hover:text-gray-300 p-1"
                  >
                    {expanded === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    onClick={() => deleteReport.mutate(r.id)}
                    className="text-gray-600 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expanded === r.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">{r.content}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal title="Gerar Relatório" open={genModal} onClose={() => setGenModal(false)}>
        <div className="space-y-2">
          {[
            { type: 'weekly_mon', label: 'Segunda — Campanhas (Template)', desc: 'Agrupa campanhas por objetivo' },
            { type: 'weekly_wed', label: 'Quarta — Análise IA (GPT-4o)', desc: 'Análise completa com comparação temporal' },
            { type: 'weekly_fri', label: 'Sexta — Atividades (Template)', desc: 'Lista atividades + arquiva semanas anteriores' },
          ].map(({ type, label, desc }) => (
            <button
              key={type}
              onClick={() => generate(type)}
              disabled={!!generating}
              className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="text-sm font-medium text-gray-200">{label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              {generating === type && <div className="text-xs text-blue-400 mt-1">Gerando...</div>}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
