import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { client_id, archived } = req.query;
    let query = supabase.from('activities').select('*, clients(name)').order('created_at', { ascending: false });
    if (client_id) query = query.eq('client_id', client_id);
    if (archived === 'true') query = query.not('archived_at', 'is', null);
    else if (archived === 'false') query = query.is('archived_at', null);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('activities').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('activities').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('activities').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
