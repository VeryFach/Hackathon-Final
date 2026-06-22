# EcoOil

EcoOil adalah platform pengelolaan rantai pasok minyak jelantah dari masyarakat, pengepul, sampai stakeholder. Sistem ini mencatat setoran minyak, proses pickup, pembentukan batch, hasil lab, pricing, payout, serta dashboard analitik dan rekomendasi berbasis AI.

## Teknologi

- Frontend: Next.js, React, Tailwind CSS, TanStack Query, Leaflet/Recharts
- Backend API: NestJS, Prisma ORM, PostgreSQL
- AI service: FastAPI, scikit-learn, Prophet
- Monorepo: pnpm workspace, Turborepo
- Infrastructure lokal: Docker Compose, PostgreSQL
- Deployment: Docker, Nginx, Git Action CI/CD

## Struktur Aplikasi

```txt
apps/
  api/         NestJS REST API, Prisma schema, seed, business modules
  web/         Next.js dashboard untuk masyarakat, pengepul, stakeholder
  ai-service/  FastAPI untuk clustering, prediction, dan analitik pendukung
packages/
  dto/         Zod schemas dan shared DTO
  constants/   Shared constants
  lib/         Shared library helpers
  ui/          Shared UI package
  utils/       Shared utilities
```

## Prasyarat

- Node.js 22+ direkomendasikan untuk API saat ini
- pnpm 9+
- Docker dan Docker Compose
- Python 3.10+ bila menjalankan AI service langsung tanpa Docker

## Environment

Contoh konfigurasi lokal yang dipakai project:

```env
# apps/api/.env
DATABASE_URL=postgresql://postgres:password@localhost:5433/hackthon_db?schema=public
JWT_SECRET=123
AI_SERVICE_URL=http://127.0.0.1:8000
PORT=3001
```

```env
# apps/web/.env atau apps/web/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
```

## Cara Menjalankan

Install dependency dari root repo:

```bash
pnpm install
```

Jalankan PostgreSQL:

```bash
docker compose up -d db
```

Jalankan migrasi/generate Prisma dan seed data:

```bash
cd apps/api
pnpm prisma generate
pnpm prisma db push
pnpm prisma db seed
```

Jalankan backend API:

```bash
cd apps/api
pnpm dev
```

Backend berjalan di:

```txt
http://localhost:3001
http://localhost:3001/docs
```

Jalankan frontend:

```bash
cd apps/web
pnpm dev
```

Frontend berjalan di:

```txt
http://localhost:3000
```

Jalankan AI service:

```bash
cd apps/ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Atau jalankan semua service container:

```bash
docker compose up -d
```

## Akun Demo Seed

Seed membuat password yang sama untuk semua akun:

```txt
password123
```

Role stakeholder:

| Role | Email | Password |
| --- | --- | --- |
| stakeholder | admin@ecooil.com | password123 |

Role pengepul:

| Role | Email | Password |
| --- | --- | --- |
| pengepul | pengepul1@gmail.com | password123 |
| pengepul | pengepul2@gmail.com | password123 |
| pengepul | pengepul3@gmail.com | password123 |
| pengepul | pengepul4@gmail.com | password123 |
| pengepul | pengepul5@gmail.com | password123 |
| pengepul | pengepul6@gmail.com | password123 |
| pengepul | pengepul7@gmail.com | password123 |
| pengepul | pengepul8@gmail.com | password123 |
| pengepul | pengepul9@gmail.com | password123 |
| pengepul | pengepul10@gmail.com | password123 |

Role masyarakat:

| Role | Email | Password |
| --- | --- | --- |
| masyarakat | user1@gmail.com | password123 |
| masyarakat | user2@gmail.com | password123 |
| masyarakat | user3@gmail.com | password123 |
| masyarakat | user4@gmail.com | password123 |
| masyarakat | user5@gmail.com | password123 |
| masyarakat | user6@gmail.com | password123 |
| masyarakat | user7@gmail.com | password123 |
| masyarakat | user8@gmail.com | password123 |
| masyarakat | user9@gmail.com | password123 |
| masyarakat | user10@gmail.com | password123 |

Seed membuat total 50 akun masyarakat dengan pola `user{n}@gmail.com`.

## Alur Utama

1. Masyarakat membuat setoran minyak jelantah.
2. Pengepul menerima permintaan pickup.
3. Pengepul mencatat pickup dan liter aktual.
4. Pengepul mengelompokkan setoran menjadi batch.
5. Pengepul memproses batch dan mengirim batch ke stakeholder.
6. Stakeholder melakukan lab approval/rejection.
7. Stakeholder mengatur pricing dan menghitung nilai batch.
8. Sistem mencatat payout untuk setoran.

## Dokumentasi Metode

Dokumen perhitungan dipisah agar mudah diaudit:

- [Batch Processing Calculation Method](docs/batch-processing-calculation.md)
- [Metode Perhitungan Quality Grading](docs/quality-grading.md)

## ERD

```mermaid
erDiagram
    USER {
        uuid id PK
        string full_name
        string email UK
        string password_hash
        enum role
        datetime created_at
        datetime updated_at
    }

    DEPOSITOR_PROFILE {
        uuid id PK
        uuid user_id FK
        decimal latitude
        decimal longitude
        text address
    }

    COLLECTOR_PROFILE {
        uuid id PK
        uuid user_id FK
        decimal latitude
        decimal longitude
        text warehouse_address
        float service_radius_km
        int capacity_liter
    }

    OIL_SUBMISSION {
        uuid id PK
        uuid depositor_id FK
        uuid collector_id FK
        float estimated_liter
        float actual_liter
        enum status
        datetime created_at
    }

    BATCH {
        uuid id PK
        uuid collector_id FK
        uuid validated_by FK
        float total_raw_oil_liter
        float total_clean_oil_liter
        float residue_liter
        float sediment_ratio
        float yield_ratio
        float total_liter
        enum status
        datetime created_at
    }

    BATCH_ITEM {
        uuid id PK
        uuid batch_id FK
        uuid submission_id FK
    }

    LAB_RESULT {
        uuid id PK
        uuid batch_id FK
        float acidity_level
        float impurity_level
        float water_content
        text notes
        enum grade
        datetime tested_at
    }

    PRICING {
        uuid id PK
        uuid created_by FK
        boolean active
        datetime created_at
    }

    GRADE_RULE {
        uuid id PK
        uuid pricing_id FK
        enum grade
        float base_price
        float quality_factor
    }

    VOLUME_RULE {
        uuid id PK
        uuid pricing_id FK
        float min_volume
        float max_volume
        float bonus_factor
    }

    BATCH_PRICING {
        uuid id PK
        uuid batch_id FK
        uuid pricing_id FK
        float final_price_per_liter
        float total_value
        datetime calculated_at
    }

    PAYOUT {
        uuid id PK
        uuid submission_id FK
        float amount
        enum status
        datetime paid_at
    }

    USER ||--|| DEPOSITOR_PROFILE : owns
    USER ||--|| COLLECTOR_PROFILE : owns

    DEPOSITOR_PROFILE ||--o{ OIL_SUBMISSION : submits
    COLLECTOR_PROFILE ||--o{ OIL_SUBMISSION : collects

    COLLECTOR_PROFILE ||--o{ BATCH : creates
    USER ||--o{ BATCH : validates

    BATCH ||--o{ BATCH_ITEM : contains
    OIL_SUBMISSION ||--o{ BATCH_ITEM : grouped_into

    BATCH ||--|| LAB_RESULT : tested

    USER ||--o{ PRICING : creates
    PRICING ||--o{ GRADE_RULE : defines
    PRICING ||--o{ VOLUME_RULE : defines

    PRICING ||--o{ BATCH_PRICING : calculates
    BATCH ||--|| BATCH_PRICING : priced

    OIL_SUBMISSION ||--|| PAYOUT : paid_out
```

## Catatan Status Development

- Frontend lokal berjalan di port `3000`.
- Nest API lokal berjalan di port `3001`.
- AI service lokal berjalan di port `8000`.
- Request browser ke `/api/...` dari frontend akan terlihat menuju origin frontend, lalu diproxy ke Nest API.
- Beberapa halaman AI tetap bergantung pada FastAPI service, jadi pastikan service AI aktif saat membuka dashboard stakeholder map/prediction.
