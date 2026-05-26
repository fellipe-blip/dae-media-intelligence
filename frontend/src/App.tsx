import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Campaigns from './pages/Campaigns';
import Creatives from './pages/Creatives';
import Funnel from './pages/Funnel';
import Insights from './pages/Insights';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Activities from './pages/Activities';
import Tasks from './pages/Tasks';
import Admin from './pages/Admin';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/creatives" element={<Creatives />} />
            <Route path="/funnel" element={<Funnel />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
