# Core Inventory IMS

Core Inventory IMS is a warehouse inventory management system built with Next.js, React, Tailwind CSS, and `shadcn/ui`. The product is designed around an event-sourced stock ledger, where inventory is derived from stock movements instead of a mutable quantity column.

## Overview

The project focuses on:

- Real-time warehouse visibility through a dashboard command center
- Product catalog management with SKU, category, and unit-of-measure support
- Ledger-driven stock operations for receipts, deliveries, transfers, and adjustments
- Immutable move history for auditability
- Multi-warehouse and nested location support

The current app already includes scaffolded dashboard and operations screens, with a local PostgreSQL-backed backend planned as the next implementation step.

## Core Product Model

The docs define a ledger-first inventory model:

- `products` stores the catalog and reorder metadata
- `warehouses` and `locations` model physical storage structure
- `stock_moves` acts as the source of truth for all inventory activity
- Current stock is calculated from completed moves, not stored directly on products

This approach supports traceability, real-time updates, and reliable audit history.

## Current App Sections

The Next.js app currently includes pages for:

- Dashboard
- Products
- Receipts
- Deliveries
- Internal Transfers
- Inventory Adjustments
- Move History
- Settings

These pages are scaffolded as server-rendered route entries and are ready to be connected to backend data.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- PostgreSQL
- Tailwind CSS 4
- `shadcn/ui`
- TanStack Query
- Lucide React
- pnpm

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

### Install dependencies

```bash
pnpm install
```

### Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Helpful scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm format
```

## Project Structure

```text
app/                 Next.js routes and layouts
components/          Shared UI and layout components
hooks/               Reusable React hooks
lib/                 Constants and utilities
types/               Shared TypeScript types
public/              Static assets
Doc/                 Product and technical documentation
```

## Documentation

Project requirements and architecture notes live in [`Doc/`](./Doc):

- [`Doc/PRD.MD`](./Doc/PRD.MD) - product vision, users, and workflows
- [`Doc/BRD.md`](./Doc/BRD.md) - backend architecture and ledger model
- [`Doc/FRD.md`](./Doc/FRD.md) - frontend requirements and UX direction
- [`Doc/TRD.MD`](./Doc/TRD.MD) - technical stack and implementation requirements

## Planned Backend Direction

Based on the docs, the intended backend architecture includes:

- Local PostgreSQL as the only system database
- No Backend-as-a-Service or third-party auth dependency
- OTP-based password reset and in-app authentication flows
- PostgreSQL tables for products, warehouses, locations, users, and stock moves
- Database views, triggers, and stored procedures for stock calculations and validation

## Status

This repository is currently in the UI scaffold phase:

- Core dashboard and operation routes exist
- Styling system and component library are set up
- Backend data integration is still to be implemented

## Notes

- Keep secrets in local `.env` files only
- Commit the lockfile (`pnpm-lock.yaml`) for reproducible installs
- Do not commit generated folders such as `.next/` or `node_modules/`
