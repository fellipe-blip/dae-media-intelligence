import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { client_id, status } = req.query;
    let query = supabase
      .from('tasks')
      .select('*, clients(name)')
      .order('due_date', { ascending: true });
    if (client_id) query = query.eq('client_id', client_id);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('tasks').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const updates: any = { ...req.body };
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('tasks').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
