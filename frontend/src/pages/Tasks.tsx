import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle, XCircle, Trash2, Clock } from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import { useClientStore } from '../store/clientStore';
import api from '../api/client';

const ACTIVITY_TYPES = [
  'budget_change', 'creative_pause', 'creative_launch',
  'campaign_pause', 'campaign_launch', 'kpi_update',
  'note', 'meeting', 'optimization', 'other',
];

export default function Tasks() {
  const { selectedClientId } = useClientStore();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    title: '', activity_type: 'note', due_date: '', assigned_to: '', custom_type: '',
  });
  const [showDone, setShowDone] = useState(false);

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', selectedClientId],
    queryFn: () => api.get('/tasks', { params: { client_id: selectedClientId || undefined } }).then(r => r.data),
  });

  const createTask = useMutation({
    mutationFn: (data: any) => api.post('/tasks', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setModal(false); },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: any) => api.put(`/tasks/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteTask = useMutation({
    mutationFn: (id: number) => api.delete(`/tasks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const today = new Date().toISOString().split('T')[0];

  const pending = (tasks || []).filter((t: any) => t.status === 'pending');
  const done = (tasks || []).filter((t: any) => t.status !== 'pending');

  const isOverdue = (t: any) => t.status === 'pending' && t.due_date < today;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Tarefas"
        subtitle="Controle de prazo por cliente"
        actions={
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={14} />Nova Tarefa
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !pending.length && !done.length ? (
        <EmptyState message="Nenhuma tarefa" sub="Crie tarefas para controlar prazos do time" />
      ) : (
        <>
          <div className="space-y-2 mb-6">
            {pending.map((t: any) => (
              <div key={t.id} className={`card flex items-center justify-between ${isOverdue(t) ? 'border-red-800' : ''}`}>
                <div className="flex items-center gap-3">
                  <Clock size={14} className={isOverdue(t) ? 'text-red-400' : 'text-gray-500'} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-200">{t.title}</span>
                      {isOverdue(t) && <span className="badge-critical">Overdue</span>}
                      {t.clients?.name && <span className="text-xs text-gray-500">{t.clients.name}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Prazo: {new Date(t.due_date + 'T12:00:00').toLocaleDateString('pt-BR')} · {t.assigned_to}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateTask.mutate({ id: t.id, status: 'done' })}
                    className="text-gray-500 hover:text-green-400 p-1"
                  >
                    <CheckCircle size={16} />
                  </button>
                  <button
                    onClick={() => updateTask.mutate({ id: t.id, status: 'cancelled' })}
                    className="text-gray-500 hover:text-yellow-400 p-1"
                  >
                    <XCircle size={16} />
                  </button>
                  <button onClick={() => deleteTask.mutate(t.id)} className="text-gray-600 hover:text-red-400 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {done.length > 0 && (
            <>
              <button
                onClick={() => setShowDone(!showDone)}
                className="text-xs text-gray-500 hover:text-gray-300 mb-3"
              >
                {showDone ? '▲' : '▶'} {done.length} tarefa(s) concluída(s)/cancelada(s)
              </button>
              {showDone && (
                <div className="space-y-2 opacity-50">
                  {done.map((t: any) => (
                    <div key={t.id} className="card flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={t.status === 'done' ? 'badge-success' : 'badge-warning'}>{t.status}</span>
                        <span className="text-sm text-gray-400">{t.title}</span>
                      </div>
                      <button onClick={() => deleteTask.mutate(t.id)} className="text-gray-700 hover:text-red-400 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      <Modal title="Nova Tarefa" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Título *</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
              <select
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                value={form.activity_type}
                onChange={e => setForm({ ...form, activity_type: e.target.value })}
              >
                {ACTIVITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Prazo *</label>
              <input
                type="date"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Responsável *</label>
            <input
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
              value={form.assigned_to}
              onChange={e => setForm({ ...form, assigned_to: e.target.value })}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button
              onClick={() => createTask.mutate({ ...form, client_id: selectedClientId })}
              disabled={createTask.isPending || !form.title || !form.due_date || !form.assigned_to}
              className="btn-primary flex-1"
            >
              {createTask.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
