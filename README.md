# StoreIMS — Inventory Management System

A production-ready inventory management system for general stores: real-time synced web dashboard, mobile app, and REST/WebSocket API.

## Stack

| Layer | Technology |
|---|---|
| Web | Next.js 14, TypeScript, TailwindCSS, React Query, Zustand |
| Mobile | Flutter, Riverpod, GoRouter, Dio |
| Backend | FastAPI, SQLAlchemy (async), Alembic, Pydantic v2 |
| Database | PostgreSQL 16 |
| Cache/Queue | Redis, Celery |
| Realtime | WebSockets |
| Infra | Docker, Docker Compose, Nginx, GitHub Actions, AWS (EC2/RDS/S3/CloudFront) |

## Folder Structure

```
store-inventory/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/v1/endpoints/   # All REST + WebSocket routes
│   │   ├── core/                # Config, security, dependencies
│   │   ├── db/                  # Database engine & session
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Business logic
│   │   ├── websockets/            # Real-time connection manager
│   │   └── main.py                # App entrypoint
│   ├── alembic/                  # DB migrations
│   ├── tests/                    # Unit + integration tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js web dashboard
│   └── src/
│       ├── app/                  # Pages (App Router)
│       ├── components/           # Reusable UI + forms
│       ├── hooks/                 # React Query hooks, WebSocket hook
│       ├── lib/                   # Axios client
│       ├── store/                 # Zustand stores
│       └── types/                 # Shared TS types
├── mobile/                    # Flutter app
│   └── lib/
│       ├── core/                  # API client
│       ├── features/              # auth, inventory, etc. (data + presentation)
│       └── shared/                  # Models shared across features
├── infra/
│   ├── nginx/nginx.conf       # Reverse proxy + rate limiting
│   └── docker/
├── .github/workflows/ci-cd.yml  # CI/CD pipeline
├── docker-compose.yml          # Production stack
└── docker-compose.dev.yml      # Local development stack
```

## Quick Start (Local Development)

```bash
# 1. Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Start everything
docker compose -f docker-compose.dev.yml up --build

# 3. Run migrations
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head

# 4. Open
# Web:      http://localhost:3000
# API docs: http://localhost:8000/api/docs
```

First user: register via `/auth/register` — this becomes the store **Owner**.

## Database

ER diagram and full schema are defined in `backend/app/models/models.py` and the initial Alembic migration `001_initial.py`. Core tables: `stores`, `users`, `categories`, `suppliers`, `products`, `stock_transactions`, `stock_audits`, `notes`, `activity_logs`, `notifications`, `file_attachments`.

Run migrations:
```bash
cd backend
alembic upgrade head          # apply
alembic revision --autogenerate -m "description"   # generate new migration
```

## API

Interactive Swagger docs: `GET /api/docs`. All endpoints are versioned under `/api/v1`. Pagination uses `page`/`page_size` query params; list endpoints support `search`, `sort_by`/`sort_order` where applicable.

Key endpoint groups:
- `/auth/*` — login, register, refresh, change-password
- `/products/*` — CRUD, barcode lookup, history
- `/stock/in`, `/stock/out`, `/stock/ledger`
- `/audits/*` — physical vs database comparison, discrepancy report
- `/dashboard/*` — stats, stock movement, category distribution, movers
- `/suppliers/*`, `/categories/*`, `/notes/*`, `/users/*`
- `/activity-logs`, `/notifications`
- `/ws/{store_id}` — WebSocket for real-time sync

## Real-Time Sync

The backend's `ConnectionManager` (`app/websockets/manager.py`) groups WebSocket connections by `store_id` and broadcasts:
- `stock_update` — quantity changed (stock in/out)
- `low_stock_alert` — quantity dropped to/below `min_stock`
- `audit_complete` — audit recorded
- `notification` — generic notifications
- `product_created`

The web frontend (`useWebSocket` hook) and mobile app subscribe to `wss://.../api/v1/ws/{store_id}?token={access_token}`, invalidate relevant queries, and show toasts.

## Security

- Passwords hashed with bcrypt; strength enforced (8+ chars, upper/lower/digit/special)
- JWT access (30 min) + refresh (7 days) tokens with rotation
- Role-based access control: `owner` vs `employee` (enforced via FastAPI dependencies `require_owner` / `get_current_user`)
- Rate limiting via `slowapi` + Nginx zones (stricter on `/auth/*`)
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, etc.) added in middleware
- All mutations logged to `activity_logs`
- SQL injection prevented via SQLAlchemy parameterized queries throughout
- Negative inventory blocked at the service layer (`StockService.stock_out`)

## Testing

```bash
cd backend
pytest --cov=app --cov-report=term-missing   # target: 90%+
```

```bash
cd frontend
npm run test:coverage
```

## Deployment (AWS)

1. **RDS PostgreSQL** — managed Postgres instance, multi-AZ for production
2. **ElastiCache Redis** — for Celery broker and caching
3. **ECR** — Docker image registry (CI/CD pushes here)
4. **EC2** — runs `docker-compose.yml` (backend, frontend, nginx, celery worker/beat)
5. **S3** — product images and database backups
6. **CloudFront** — CDN for static assets and images

CI/CD (`.github/workflows/ci-cd.yml`):
1. Lint + test backend (pytest, ruff) and frontend (eslint, tsc, jest)
2. Security scan (Trivy, Bandit)
3. Build & push Docker images to ECR
4. SSH into EC2, `docker compose pull && up -d`, run `alembic upgrade head`

## Multi-Store Support

The schema is multi-tenant ready: every table carries `store_id`. Adding "Store B" requires no schema changes — just a new row in `stores` and users assigned to it. All queries already filter by `store_id` via `get_current_store_id`.

## Roadmap (Phase 4 / Bonus)

- **Barcode scanner** (Flutter, `mobile_scanner`) — implemented in `barcode_scanner_screen.dart`; unknown barcodes prompt product creation
- **Export module** — PDF/Excel/CSV stubs in `transactions/page.tsx`; wire to `reportlab`/`openpyxl` (already in `requirements.txt`)
- **Backup module** — Celery beat job to dump Postgres → S3 daily
- **OCR inventory entry** — Tesseract/Google Vision pipeline for handwritten notes
- **AI inventory assistant** — natural-language queries over `stock_transactions`/`products` via an LLM tool-calling layer
- **Demand forecasting** — time-series model over `stock_transactions` for reorder recommendations
