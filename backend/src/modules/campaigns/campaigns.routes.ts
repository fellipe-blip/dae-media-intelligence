import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

// GET /campaigns?client_id=
router.get('/', async (req, res, next) => {
  try {
    let query = supabase.from('campaigns').select('*, ad_sets(*, creatives(*))').order('name');
    if (req.query.client_id) query = query.eq('client_id', req.query.client_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, ad_sets(*, creatives(*))')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('campaigns').insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('campaigns').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('campaigns').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) { next(e); }
});

// Ad Sets
router.get('/:id/adsets', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('ad_sets').select('*, creatives(*)').eq('campaign_id', req.params.id);
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// Creatives
router.get('/adsets/:adsetId/creatives', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('creatives').select('*').eq('ad_set_id', req.params.adsetId);
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

export default router;
