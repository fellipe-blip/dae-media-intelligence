import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { MetricsSummary } from '../types';

export function useMetricsSummary(clientId: number | null, days = 30) {
  return useQuery<MetricsSummary>({
    queryKey: ['metrics', 'summary', clientId, days],
    queryFn: async () => (await api.get('/metrics/summary', { params: { client_id: clientId, days } })).data,
    enabled: !!clientId,
  });
}

export function useMetricsTimeseries(clientId: number | null, days = 30) {
  return useQuery<{ date: string; spend: number; leads: number; impressions: number }[]>({
    queryKey: ['metrics', 'timeseries', clientId, days],
    queryFn: async () => (await api.get('/metrics/timeseries', { params: { client_id: clientId, days } })).data,
    enabled: !!clientId,
  });
}

export function useMetricsCreatives(clientId: number | null, days = 30) {
  return useQuery({
    queryKey: ['metrics', 'creatives', clientId, days],
    queryFn: async () => (await api.get('/metrics/creatives', { params: { client_id: clientId, days } })).data,
    enabled: !!clientId,
  });
}
