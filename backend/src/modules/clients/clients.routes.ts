import { Router } from 'express';
import { supabase } from '../../config/supabase';

const router = Router();

// GET /clients
router.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*, client_kpis(*)')
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// GET /clients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*, client_kpis(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

// POST /clients
router.post('/', async (req, res, next) => {
  try {
    const { client_kpis, ...clientData } = req.body;
    const { data: client, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();
    if (error) throw error;

    if (client_kpis?.length) {
      const kpis = client_kpis.map((k: any) => ({ ...k, client_id: client.id }));
      await supabase.from('client_kpis').insert(kpis);
    }

    const { data: full } = await supabase
      .from('clients')
      .select('*, client_kpis(*)')
      .eq('id', client.id)
      .single();
    res.status(201).json(full);
  } catch (e) { next(e); }
});

// PUT /clients/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { client_kpis, ...clientData } = req.body;
    const { error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', req.params.id);
    if (error) throw error;

    if (client_kpis !== undefined) {
      await supabase.from('client_kpis').delete().eq('client_id', req.params.id);
      if (client_kpis.length) {
        const kpis = client_kpis.map((k: any) => ({ ...k, client_id: Number(req.params.id) }));
        await supabase.from('client_kpis').insert(kpis);
      }
    }

    const { data: full } = await supabase
      .from('clients')
      .select('*, client_kpis(*)')
      .eq('id', req.params.id)
      .single();
    res.json(full);
  } catch (e) { next(e); }
});

// DELETE /clients/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
