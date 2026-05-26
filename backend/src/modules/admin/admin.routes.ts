import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

// All reports across clients
router.get('/reports', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, clients(name)')
      .order('generated_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// All insights across clients
router.get('/insights', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('insights')
      .select('*, clients(name)')
      .order('generated_at', { ascending: false })
      .limit(100);
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// All alerts across clients
router.get('/alerts', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// All tasks across clients
router.get('/tasks', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, clients(name)')
      .order('due_date', { ascending: true });
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// All activities across clients
router.get('/activities', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*, clients(name)')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Stats summary
router.get('/stats', async (req, res, next) => {
  try {
    const [
      { count: clients },
      { count: activeAlerts },
      { count: pendingTasks },
      { count: reports },
    ] = await Promise.all([
      supabase.from('clients').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
      supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
    ]);

    res.json({ active_clients: clients, active_alerts: activeAlerts, pending_tasks: pendingTasks, total_reports: reports });
  } catch (e) { next(e); }
});

export default router;
