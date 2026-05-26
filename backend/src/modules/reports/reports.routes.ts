import { Router } from 'express';
import { supabase } from '../../config/supabase';
import { generateWeeklyCampaignReport } from './weekly-campaign-report';
import { generateWeeklyActivitiesReport, archivePreviousWeekActivities } from './weekly-activities-report';
import { generateInsight } from '../insights/insights.service';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { client_id, type, limit = 50 } = req.query;
    let query = supabase
      .from('reports')
      .select('*, clients(name)')
      .order('generated_at', { ascending: false })
      .limit(Number(limit));
    if (client_id) query = query.eq('client_id', client_id);
    if (type) query = query.eq('type', type);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*, clients(name)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { next(e); }
});

router.post('/generate/weekly-campaign', async (req, res, next) => {
  try {
    const { client_id } = req.body;
    const report = await generateWeeklyCampaignReport(Number(client_id));
    res.status(201).json(report);
  } catch (e) { next(e); }
});

router.post('/generate/weekly-activities', async (req, res, next) => {
  try {
    const { client_id } = req.body;
    const report = await generateWeeklyActivitiesReport(Number(client_id));
    await archivePreviousWeekActivities(Number(client_id));
    res.status(201).json(report);
  } catch (e) { next(e); }
});

router.post('/generate/weekly-wed', async (req, res, next) => {
  try {
    const { client_id } = req.body;
    const insight = await generateInsight(Number(client_id), 'weekly_wed');
    res.status(201).json(insight);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { error } = await supabase.from('reports').delete().eq('id', req.params.id);
    if (error) throw error;
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
