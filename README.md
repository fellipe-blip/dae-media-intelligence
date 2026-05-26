# DAE Media Intelligence

Plataforma centralizada para agências de tráfego pago — consolida Meta Ads + RD Station CRM, gera relatórios automáticos com IA e monitora KPIs em tempo real.

## Setup rápido

### Backend

```bash
cd backend
cp .env.example .env  # preencha as variáveis
npm install
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env  # ajuste VITE_API_URL se necessário
npm install
npm run dev
```

### Banco de dados (Supabase)

Execute o arquivo `backend/supabase-schema.sql` no SQL Editor do seu projeto Supabase.

## Variáveis de ambiente

### Backend `.env`
| Variável | Descrição |
|----------|-----------|
| `API_URL_supabase` | URL do projeto Supabase |
| `service_role_supabase` | Service role key do Supabase |
| `OPENAI_API_KEY` | Chave da OpenAI (GPT-4o) |
| `META_ACCESS_TOKEN` | Token de acesso Meta Ads |
| `RDSTATION_ACCESS_TOKEN` | Token RD Station CRM |
| `API_KEY` | Chave interna da API |
| `ALLOWED_ORIGIN` | URL do frontend (CORS) |

### Frontend `.env`
| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL do backend |
| `VITE_API_KEY` | Chave da API (mesma do backend) |

## Deploy

- **Backend → Railway**: conecte o repositório, root `backend/`, o `railway.json` já está configurado
- **Frontend → Vercel**: conecte o repositório, root `frontend/`, o `vercel.json` já está configurado

## Endpoints principais

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/health` | Health check |
| GET/POST/PUT/DELETE | `/clients` | CRUD de clientes |
| GET | `/metrics/summary` | Métricas agregadas |
| GET | `/metrics/timeseries` | Série temporal |
| POST | `/insights/generate` | Gerar insight com IA |
| POST | `/reports/generate/weekly-campaign` | Relatório de segunda |
| POST | `/reports/generate/weekly-wed` | Relatório de quarta (IA) |
| POST | `/reports/generate/weekly-activities` | Relatório de sexta |
| POST | `/alerts/run-checks` | Verificar alertas agora |
| POST | `/ingestion/run-all` | Ingestão de todos os clientes |
| GET | `/admin/stats` | Estatísticas cross-client |
