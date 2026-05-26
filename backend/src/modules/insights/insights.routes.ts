import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { generateInsight } from './insights.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { client_id, limit = 20 } = req.query;
    let query = supabase
      .from('insights')
      .select('*, clients(name)')
      .order('generated_at', { ascending: false })
      .limit(Number(limit));
    if (client_id) query = query.eq('client_id', client_id);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/generate', async (req, res, next) => {
  try {
    const { client_id, type = 'manual' } = req.body;
    const insight = await generateInsight(Number(client_id), type);
    res.status(201).json(insight);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('insights').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
