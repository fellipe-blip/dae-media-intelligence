import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle, Trash2, RefreshCw } from 'lucide-react';
import Header from '../components/layout/Header';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { useClientStore } from '../store/clientStore';
import api from '../api/client';

export default function Alerts() {
  const { selectedClientId } = useClientStore();
  const qc = useQueryClient();
  const [showResolved, setShowResolved] = useState(false);
  const [running, setRunning] = useState(false);

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', selectedClientId, showResolved],
    queryFn: () => api.get('/alerts', {
      params: {
        client_id: selectedClientId || undefined,
        resolved: showResolved,
      },
    }).then(r => r.data),
  });

  const resolveAlert = useMutation({
    mutationFn: (id: number) => api.put(`/alerts/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const deleteAlert = useMutation({
    mutationFn: (id: number) => api.delete(`/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const runChecks = async () => {
    setRunning(true);
    try {
      await api.post('/alerts/run-checks', {});
      qc.invalidateQueries({ queryKey: ['alerts'] });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Alertas"
        subtitle="Monitoramento de KPIs em tempo real"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowResolved(!showResolved)}
              className={showResolved ? 'btn-primary' : 'btn-secondary'}
            >
              {showResolved ? 'Ver Ativos' : 'Ver Resolvidos'}
            </button>
            <button onClick={runChecks} disabled={running} className="btn-secondary flex items-center gap-2">
              <RefreshCw size={14} className={running ? 'animate-spin' : ''} />
              {running ? 'Verificando...' : 'Verificar Agora'}
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : !(alerts || []).length ? (
        <EmptyState
          message={showResolved ? 'Nenhum alerta resolvido' : 'Nenhum alerta ativo'}
          sub="Sistema monitorando automaticamente às 8h"
        />
      ) : (
        <div className="space-y-3">
          {(alerts || []).map((alert: any) => (
            <div
              key={alert.id}
              className={`card border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : 'border-l-yellow-500'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle
                    size={16}
                    className={alert.severity === 'critical' ? 'text-red-400' : 'text-yellow-400'}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-200">{alert.message}</span>
                      <span className={alert.severity === 'critical' ? 'badge-critical' : 'badge-warning'}>
                        {alert.severity}
                      </span>
                      {alert.clients && <span className="text-xs text-gray-500">{alert.clients.name}</span>}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {alert.type} · {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                      {alert.current_value !== undefined && ` · Valor: ${Number(alert.current_value).toFixed(2)}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert.mutate(alert.id)}
                      className="btn-secondary py-1 px-2 flex items-center gap-1 text-green-400"
                    >
                      <CheckCircle size={14} />
                      <span className="text-xs">Resolver</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteAlert.mutate(alert.id)}
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
