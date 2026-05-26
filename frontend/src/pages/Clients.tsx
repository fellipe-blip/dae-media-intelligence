import { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import Header from '../components/layout/Header';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from '../hooks/useClients';
import { Client, ClientKPI } from '../types';

const EMPTY_CLIENT: Partial<Client> = {
  name: '', status: 'active', monthly_budget: undefined,
  ad_account_id: '', crm_token: '', objectives: [], client_kpis: [],
};

export default function Clients() {
  const { data: clients, isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Client> | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const openCreate = () => { setEditing(EMPTY_CLIENT); setModalOpen(true); };
  const openEdit = (c: Client) => { setEditing({ ...c }); setModalOpen(true); };

  const handleSave = async () => {
    if (!editing) return;
    if (editing.id) await updateClient.mutateAsync({ id: editing.id, ...editing });
    else await createClient.mutateAsync(editing);
    setModalOpen(false);
    setEditing(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este cliente?')) return;
    await deleteClient.mutateAsync(id);
  };

  const statusColor: Record<string, string> = {
    active: 'badge-success', paused: 'badge-warning', churned: 'badge-critical',
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <Header
        title="Clientes"
        subtitle="Gerencie clientes e seus KPIs"
        actions={<button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={14} />Novo Cliente</button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size={32} /></div>
      ) : (
        <div className="space-y-3">
          {(clients || []).map(client => (
            <div key={client.id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">{client.name}</span>
                      <span className={statusColor[client.status]}>{client.status}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {client.ad_account_id && `Ad Account: ${client.ad_account_id}`}
                      {client.monthly_budget && ` · Budget: R$ ${client.monthly_budget.toLocaleString('pt-BR')}`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExpanded(expanded === client.id ? null : client.id)}
                    className="text-gray-500 hover:text-gray-300"
                  >
                    {expanded === client.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button onClick={() => openEdit(client)} className="btn-secondary py-1 px-2">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(client.id)} className="btn-danger py-1 px-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expanded === client.id && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Objetivos:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(client.objectives || []).map(o => (
                          <span key={o} className="badge-info">{o}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">CRM Token:</span>
                      <span className="text-gray-400 ml-2">{client.crm_token ? '••••••••' : '—'}</span>
                    </div>
                  </div>
                  {(client.client_kpis || []).length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">KPIs configurados:</p>
                      <div className="grid grid-cols-3 gap-2">
                        {client.client_kpis!.map(kpi => (
                          <div key={kpi.id} className="bg-gray-800 rounded-lg p-2 text-xs">
                            <div className="font-medium text-gray-200">{kpi.name.toUpperCase()}</div>
                            <div className="text-gray-500">Meta: {kpi.target_value} · {kpi.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal title={editing?.id ? 'Editar Cliente' : 'Novo Cliente'} open={modalOpen} onClose={() => setModalOpen(false)} wide>
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nome *</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  value={editing.name || ''}
                  onChange={e => setEditing({ ...editing, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Status</label>
                <select
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  value={editing.status}
                  onChange={e => setEditing({ ...editing, status: e.target.value as Client['status'] })}
                >
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="churned">Churned</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Ad Account ID</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  value={editing.ad_account_id || ''}
                  onChange={e => setEditing({ ...editing, ad_account_id: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Budget Mensal (R$)</label>
                <input
                  type="number"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  value={editing.monthly_budget || ''}
                  onChange={e => setEditing({ ...editing, monthly_budget: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">CRM Token (RD Station)</label>
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200"
                  value={editing.crm_token || ''}
                  onChange={e => setEditing({ ...editing, crm_token: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1">Cancelar</button>
              <button
                onClick={handleSave}
                className="btn-primary flex-1"
                disabled={createClient.isPending || updateClient.isPending}
              >
                {(createClient.isPending || updateClient.isPending) ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
