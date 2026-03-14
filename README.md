# Core Inventory

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45-C5F74F?logo=drizzle&logoColor=111111)](https://orm.drizzle.team/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Private-6B7280)](https://github.com/JaivishChauhan/core-inventory)

Core Inventory is a Next.js App Router application for multi-location warehouse operations, product catalog management, stock movement tracking, and operational visibility.

## System Scope

The application provides:

- Warehouse and location management
- Product and stock visibility
- Inbound and outbound movement workflows (receipts, deliveries, transfers, adjustments)
- Move history and operational audit trail
- Authentication with OTP-assisted account flows
- Dashboard and KPI endpoints for operational summaries

## Technology Stack

### Runtime and Frameworks

- Next.js `16.1.6` (App Router)
- React `19.2.4`
- TypeScript `5.9`

### Data Layer

- PostgreSQL
- Drizzle ORM + Drizzle Kit

### UI and State

- Tailwind CSS `v4`
- Radix UI primitives
- TanStack React Query
- React Hook Form + Zod
- Sonner (toast notifications)

### Auth and Security Utilities

- `jose` for JWT signing and verification
- `bcryptjs` for password hashing
- HTTP-only cookie-based session handling

## Repository Layout

```text
app/                    Next.js routes, layouts, API handlers
components/             Reusable UI and feature components
lib/auth/               JWT, OTP, password, mail, session utilities
lib/db/                 Drizzle schema, queries, migrations, seed scripts
hooks/                  Shared React hooks
types/                  Shared TypeScript types
Doc/                    Product, architecture, and migration documentation
```

## Prerequisites

- Node.js `20+`
- pnpm `10+`
- PostgreSQL instance

## Environment Configuration

Create or update `.env` (and/or `.env.local`) at the repository root.

| Variable       | Required | Purpose                                                      |
| -------------- | -------- | ------------------------------------------------------------ |
| `DATABASE_URL` | Yes      | PostgreSQL connection string used by app and Drizzle Kit     |
| `JWT_SECRET`   | Yes      | Secret key used to sign/verify session JWTs                  |
| `SMTP_HOST`    | Optional | SMTP server host (defaults to Ethereal host for development) |
| `SMTP_PORT`    | Optional | SMTP server port (defaults to `587`)                         |
| `SMTP_USER`    | Optional | SMTP authentication user                                     |
| `SMTP_PASS`    | Optional | SMTP authentication password                                 |
| `SMTP_FROM`    | Optional | Sender address for OTP emails                                |

Security recommendations:

- Use a high-entropy `JWT_SECRET` (minimum 32 characters)
- Do not commit `.env` or `.env.local`
- Use a dedicated SMTP account for non-development environments

## Local Development

Install dependencies and start the application:

```bash
pnpm install
pnpm dev
```

Default local URL: `http://localhost:3000`

## Database Schema

The core domain of the application revolves around six main tables:

- **Users (`users`)**: Owns authentication identities and role management (`admin` / `staff`).
- **OTP Tokens (`otp_tokens`)**: Manages short-lived, single-use login codes for email authentication. Token hashes are stored, not raw values.
- **Warehouses (`warehouses`)**: Top-level physical entities allowing multi-warehouse capabilities.
- **Locations (`locations`)**: Granular physical or virtual spaces (like internal shelves or external vendor/customer nodes) inside a warehouse.
- **Products (`products`)**: The master product catalog (SKUs, categories, unit of measure). Note: this table holds NO stock quantities.
- **Stock Moves (`stock_moves`)**: The immutable event-sourced ledger acting as the single source of truth for all inventory calculations. Stock is dynamically calculated by summing inbound and outbound `done` moves.

## Database Operations

Apply schema changes and seed data:

```bash
pnpm db:push
pnpm db:migrate
pnpm db:seed
```

Notes:

- `db:push` synchronizes schema via Drizzle Kit
- `db:migrate` runs migration logic in `lib/db/migrate.ts`
- `db:seed` initializes baseline data from `lib/db/seed.ts`

## Available Scripts

| Script            | Description                               |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | Start development server using Turbopack  |
| `pnpm build`      | Build production artifacts                |
| `pnpm start`      | Run production server                     |
| `pnpm lint`       | Run ESLint checks                         |
| `pnpm typecheck`  | Run TypeScript type checking (`--noEmit`) |
| `pnpm format`     | Format TypeScript/TSX files with Prettier |
| `pnpm db:push`    | Push Drizzle schema changes               |
| `pnpm db:migrate` | Execute migration script                  |
| `pnpm db:seed`    | Execute seed script                       |

## API Surface (High-Level)

Key route groups under `app/api/`:

- `auth/*` for login, logout, signup, OTP, password reset, and current-user session checks
- `inventory/*` for dashboard, KPI, stock, movement, and reference data endpoints
- `products/*`, `warehouses/*`, `locations/*` for master-data CRUD handlers

## Authentication Model

- Session token is issued as JWT and stored in HTTP-only cookie (`ci_session`)
- Middleware enforces authentication for non-public routes
- OTP lifecycle is time-bound (10 minutes) and tokenized via SHA-256 hashing

## Quality Gates

Minimum checks before merge:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Documentation Index

Project documentation lives under `Doc/`:

- `AUTH_SYSTEM.md` for authentication architecture
- `BRD.md`, `FRD.md`, `PRD.MD`, `TRD.MD` for requirements and technical design
- `MIGRATION_GUIDE.md` for migration-related steps

## License

This repository is marked as private. Add or update licensing terms based on organizational policy.
