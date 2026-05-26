import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Archive } from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useClientStore } from '../store/clientStore';
import api from '../api/client';

const ACTIVITY_TYPES = [
  'budget_change', 'creative_pause', 'creative_launch',
  'campaign_pause', 'campaign_launch', 'kpi_update',
  'note', 'meeting', 'optimization',
];

const typeLabels: Record<string, string> = {
  budget_change: 'Orçamento', creative_pause: 'Pausar Criativo', creative_launch: 'Lançar Criativo',
  campaign_pause: 'Pausar Campanha', campaign_launch: 'Lançar Campanha', kpi_update: 'KPI Update',
  note: 'Anotação', meeting: 'Reunião', optimization: 'Otimização',
};

export default function Activities() {
  const { selectedClientId } = useClientStore();
  const qc = useQueryClient();
  const [showArchived, setShowArchived] = useState(false);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ activity_type: 'note', title: '', description: '' });

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', selectedClientId, showArchived],
    queryFn: () => api.get('/activities', {
      params: {
        client_id: selectedClientId || undefined,
        archived: showArchived,
      },
    }).then(r => r.data),
  });

  const createActivity = useMutation({
    mutationFn: (data: any) => api.post('/activities', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); setModal(false); },
  });

  const deleteActivity = useMutation({
    mutationFn: (id: number) => api.delete(`/activities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });

  const handleCreate = () => {
    if (!selectedClientId) return;
    createActivity.mutate({ ...form, client_id: selectedClientId });
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Atividades"
        subtitle="Log de atividades da equipe"
        actions={
          <div className="flex gap-2">
            <button onClick={() => setShowArchived(!showArchived)} className={showArchived ? 'btn-primary' : 'btn-secondary'}>
              <Archive size={14} />
            </button>
            <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
              <Plus size={14} />Nova Atividade
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !(activities || []).length ? (
        <EmptyState message="Nenhuma atividade" sub="Registre atividades como reuniões, otimizações e mudanças" />
      ) : (
        <div className="space-y-2">
          {(activities || []).map((a: any) => (
            <div key={a.id} className={`card flex items-center justify-between ${a.archived_at ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <span className="badge-info text-xs">{typeLabels[a.activity_type] || a.activity_type}</span>
                <div>
                  {a.title && <div className="text-sm text-gray-200">{a.title}</div>}
                  {a.description && <div className="text-xs text-gray-500">{a.description}</div>}
                  <div className="text-xs text-gray-600 mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('pt-BR')}
                    {a.clients?.name && ` · ${a.clients.name}`}
                    {a.archived_at && ' · Arquivada'}
                  </div>
                </div>
              </div>
              <button onClick={() => deleteActivity.mutate(a.id)} className="text-gray-600 hover:text-red-400 p-1">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal title="Nova Atividade" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={form.activity_type}
              onChange={e => setForm({ ...form, activity_type: e.target.value })}
            >
              {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{typeLabels[t]}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Título</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
            <textarea
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCreate} disabled={createActivity.isPending} className="btn-primary flex-1">
              {createActivity.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
