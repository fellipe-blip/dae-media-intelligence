import { useClients } from '../../hooks/useClients';
import { useClientStore } from '../../store/clientStore';
import { ChevronDown } from 'lucide-react';

export default function ClientSelector() {
  const { data: clients } = useClients();
  const { selectedClientId, setSelectedClientId } = useClientStore();

  const active = clients?.filter(c => c.status === 'active') || [];
  const selected = active.find(c => c.id === selectedClientId);

  return (
    <div className="relative">
      <select
        value={selectedClientId || ''}
        onChange={e => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
        className="appearance-none bg-gray-800 border border-gray-700 rounded-lg pl-3 pr-8 py-2 text-sm text-gray-200 cursor-pointer focus:outline-none focus:border-blue-500"
      >
        <option value="">— Selecionar cliente —</option>
        {active.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}
