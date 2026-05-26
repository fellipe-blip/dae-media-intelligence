import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, FileText, Lightbulb, Bell, CheckSquare, Activity, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Spinner from '../components/ui/Spinner';
import api from '../api/client';

const tabs = [
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'alerts', label: 'Alertas', icon: Bell },
  { id: 'tasks', label: 'Tarefas', icon: CheckSquare },
  { id: 'activities', label: 'Atividades', icon: Activity },
] as const;

type Tab = typeof tabs[number]['id'];

export default function Admin() {
  const [tab, setTab] = useState<Tab>('reports');
  const [expanded, setExpanded] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', tab],
    queryFn: () => api.get(`/admin/${tab}`).then(r => r.data),
  });

  const deleteItem = useMutation({
    mutationFn: ({ entity, id }: { entity: string; id: number }) => api.delete(`/${entity}/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', tab] }),
  });

  const entityMap: Record<Tab, string> = {
    reports: 'reports', insights: 'insights', alerts: 'alerts', tasks: 'tasks', activities: 'activities',
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={20} className="text-blue-400" />
        <div>
          <h1 className="text-xl font-semibold text-gray-100">Admin</h1>
          <p className="text-sm text-gray-500">Visão cross-client para gestores</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Clientes Ativos', value: stats.active_clients },
            { label: 'Alertas Ativos', value: stats.active_alerts, color: stats.active_alerts > 0 ? 'text-red-400' : 'text-green-400' },
            { label: 'Tarefas Pendentes', value: stats.pending_tasks, color: stats.pending_tasks > 0 ? 'text-yellow-400' : 'text-green-400' },
            { label: 'Relatórios', value: stats.total_reports },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className={`text-2xl font-bold ${s.color || 'text-gray-200'}`}>{s.value ?? '—'}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm flex-1 justify-center transition-colors ${
              tab === id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : (
        <div className="space-y-2">
          {(data || []).map((item: any) => (
            <div key={item.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    {/* Report */}
                    {tab === 'reports' && (
                      <>
                        <div className="text-sm font-medium text-gray-200 truncate">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.clients?.name} · {new Date(item.generated_at).toLocaleDateString('pt-BR')}</div>
                      </>
                    )}
                    {/* Insight */}
                    {tab === 'insights' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${item.impact_level === 'high' ? 'bg-red-950 text-red-400' : item.impact_level === 'medium' ? 'bg-yellow-950 text-yellow-400' : 'bg-gray-800 text-gray-400'}`}>
                            {item.impact_level}
                          </span>
                          <span className="text-xs text-gray-500">{item.category}</span>
                        </div>
                        <div className="text-sm text-gray-300 mt-1 truncate">{item.summary || item.content?.slice(0, 80)}</div>
                        <div className="text-xs text-gray-500">{item.clients?.name} · {new Date(item.generated_at).toLocaleDateString('pt-BR')}</div>
                      </>
                    )}
                    {/* Alert */}
                    {tab === 'alerts' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={item.severity === 'critical' ? 'badge-critical' : 'badge-warning'}>{item.severity}</span>
                          <span className="text-xs text-gray-500">{item.clients?.name}</span>
                          {item.resolved && <span className="badge-success">Resolvido</span>}
                        </div>
                        <div className="text-sm text-gray-300">{item.message}</div>
                      </>
                    )}
                    {/* Task */}
                    {tab === 'tasks' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={item.status === 'done' ? 'badge-success' : item.status === 'cancelled' ? 'badge-warning' : item.due_date < today && item.status === 'pending' ? 'badge-critical' : 'badge-info'}>
                            {item.status === 'pending' && item.due_date < today ? 'overdue' : item.status}
                          </span>
                          <span className="text-xs text-gray-500">{item.clients?.name}</span>
                        </div>
                        <div className="text-sm text-gray-300">{item.title}</div>
                        <div className="text-xs text-gray-500">Prazo: {item.due_date} · {item.assigned_to}</div>
                      </>
                    )}
                    {/* Activity */}
                    {tab === 'activities' && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="badge-info">{item.activity_type}</span>
                          <span className="text-xs text-gray-500">{item.clients?.name}</span>
                          {item.archived_at && <span className="badge-warning">Arquivada</span>}
                        </div>
                        <div className="text-sm text-gray-300">{item.title || item.description || '—'}</div>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(tab === 'reports' || tab === 'insights') && (
                    <button
                      onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="text-gray-500 hover:text-gray-300 p-1"
                    >
                      {expanded === item.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!confirm('Excluir?')) return;
                      deleteItem.mutate({ entity: entityMap[tab], id: item.id });
                    }}
                    className="text-gray-600 hover:text-red-400 p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {expanded === item.id && (tab === 'reports' || tab === 'insights') && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans">{item.content}</pre>
                </div>
              )}
            </div>
          ))}
          {!(data || []).length && (
            <div className="text-center py-12 text-gray-500">Nenhum item encontrado</div>
          )}
        </div>
      )}
    </div>
  );
}
