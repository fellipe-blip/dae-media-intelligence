import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Megaphone, Image, TrendingUp,
  Lightbulb, FileText, Bell, Activity, CheckSquare, Shield, Zap,
} from 'lucide-react';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Users, label: 'Clientes' },
  { to: '/campaigns', icon: Megaphone, label: 'Campanhas' },
  { to: '/creatives', icon: Image, label: 'Criativos' },
  { to: '/funnel', icon: TrendingUp, label: 'Funil CRM' },
  { to: '/insights', icon: Lightbulb, label: 'Insights' },
  { to: '/reports', icon: FileText, label: 'Relatórios' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/activities', icon: Activity, label: 'Atividades' },
  { to: '/tasks', icon: CheckSquare, label: 'Tarefas' },
  { to: '/admin', icon: Shield, label: 'Admin' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-800">
        <Zap className="text-blue-500" size={20} />
        <span className="font-bold text-sm tracking-tight">DAE Intelligence</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                active
                  ? 'bg-blue-600/20 text-blue-400 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-gray-800 text-xs text-gray-600">
        v1.0.0 — DAE Assessoria
      </div>
    </aside>
  );
}
