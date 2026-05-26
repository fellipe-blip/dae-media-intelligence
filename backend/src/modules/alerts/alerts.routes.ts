import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { runAlertChecks } from './alerts.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { client_id, resolved } = req.query;
    let query = supabase.from('alerts').select('*, clients(name)').order('created_at', { ascending: false });
    if (client_id) query = query.eq('client_id', client_id);
    if (resolved !== undefined) query = query.eq('resolved', resolved === 'true');
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.put('/:id/resolve', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('alerts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) { next(e); }
});

router.post('/run-checks', async (req, res, next) => {
  try {
    await runAlertChecks();
    res.json({ message: 'Alert checks completed' });
  } catch (e) { next(e); }
});

export default router;
