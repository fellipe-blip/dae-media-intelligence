export interface Client {
  id: number;
  name: string;
  status: 'active' | 'paused' | 'churned';
  ad_account_id?: string;
  crm_token?: string;
  monthly_budget?: number;
  objectives?: string[];
  funnel_stage_config?: any;
  rd_fonte_field?: string;
  client_kpis?: ClientKPI[];
  created_at: string;
}

export interface ClientKPI {
  id?: number;
  client_id?: number;
  name: string;
  target_value?: number;
  min_value?: number;
  max_value?: number;
  type: 'lower_is_better' | 'higher_is_better' | 'range';
  weight?: number;
}

export interface Campaign {
  id: number;
  client_id: number;
  external_id?: string;
  name: string;
  platform: 'meta' | 'google' | 'tiktok';
  objective?: string;
  status: string;
  ad_sets?: AdSet[];
}

export interface AdSet {
  id: number;
  campaign_id: number;
  name: string;
  status: string;
  creatives?: Creative[];
}

export interface Creative {
  id: number;
  ad_set_id?: number;
  campaign_id?: number;
  name: string;
  creative_type: 'image' | 'video' | 'carousel' | 'story' | 'reel';
  thumbnail_url?: string;
  status: string;
}

export interface MetricRow {
  id: number;
  client_id: number;
  entity_type: 'campaign' | 'ad_set' | 'creative';
  entity_id: number;
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  messages: number;
  cost_per_message: number;
}

export interface MetricsSummary {
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  messages: number;
  cpl: number;
  ctr: number;
  cpc: number;
}

export interface Alert {
  id: number;
  client_id: number;
  type: 'kpi_breach' | 'frequency_high';
  kpi_name?: string;
  severity: 'critical' | 'warning';
  current_value?: number;
  target_value?: number;
  message?: string;
  resolved: boolean;
  resolved_at?: string;
  created_at: string;
  clients?: { name: string };
}

export interface Insight {
  id: number;
  client_id: number;
  type: 'weekly_wed' | 'manual';
  content: string;
  summary?: string;
  impact_level: 'high' | 'medium' | 'low';
  category: 'performance' | 'creative' | 'funnel' | 'budget';
  generated_at: string;
  clients?: { name: string };
}

export interface Report {
  id: number;
  client_id: number;
  type: 'weekly_mon' | 'weekly_wed' | 'weekly_fri' | 'manual';
  title: string;
  content: string;
  generated_at: string;
  clients?: { name: string };
}

export interface Activity {
  id: number;
  client_id: number;
  activity_type: string;
  title?: string;
  description?: string;
  metadata?: any;
  archived_at?: string;
  created_at: string;
  clients?: { name: string };
}

export interface Task {
  id: number;
  client_id: number;
  title: string;
  activity_type: string;
  custom_type?: string;
  due_date: string;
  assigned_to: string;
  status: 'pending' | 'done' | 'cancelled';
  completed_at?: string;
  created_at: string;
  clients?: { name: string };
}

export interface FunnelTotals {
  leads: number;
  mql: number;
  sql: number;
  sales: number;
  spend: number;
  revenue: number;
  lead_to_mql: number;
  mql_to_sql: number;
  sql_to_sale: number;
  cost_per_mql: number;
  cost_per_sql: number;
  cost_per_sale: number;
  roas: number;
}
