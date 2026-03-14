<div align="center">
  <h1>🏭 Core Inventory Management System</h1>
  <p><strong>Enterprise-grade warehouse operations platform built for speed, accuracy, and scale</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45-C5F74F?logo=drizzle&logoColor=111111)](https://orm.drizzle.team/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/License-Private-6B7280)](https://github.com/JaivishChauhan/core-inventory)
</div>

---

## 📖 Overview

We built Core Inventory as a modern, full-stack inventory management system designed for multi-warehouse operations. Our platform handles everything from product catalog management to complex stock movements across multiple locations, providing real-time visibility into inventory operations.

Unlike traditional inventory systems that rely on third-party services, we maintain complete control over our backend, authentication, and business logic. This gives us the flexibility to customize workflows, ensure data sovereignty, and optimize performance for our specific use cases.

> **Current Status**: This is an actively developed project. We've established a solid foundation with core inventory operations, secure authentication, and an event-sourced ledger system. Due to time constraints during initial development, some advanced features mentioned in our documentation are planned for future releases. We're committed to continuous improvement and will be adding new capabilities regularly.

## ✨ Key Features

### 🏢 Multi-Warehouse Operations
We support complex warehouse hierarchies with granular location management. Each warehouse can have multiple internal locations (shelves, zones) and external nodes (vendors, customers), enabling precise tracking of inventory across your entire supply chain.

### 📦 Product Catalog Management
Our product catalog system provides a centralized master data repository for SKUs, categories, units of measure, and reorder points. We separate product definitions from stock quantities, ensuring data integrity and flexibility.

### 🔄 Stock Movement Workflows
We implement a complete suite of inventory operations:
- **Receipts**: Inbound stock from vendors
- **Deliveries**: Outbound shipments to customers
- **Transfers**: Internal movements between locations
- **Adjustments**: Corrections for discrepancies, damage, or loss

Each movement follows a state machine (draft → waiting → ready → done) with proper authorization controls.

### 📊 Real-Time Analytics & KPIs
Our dashboard provides instant visibility into:
- Total products and stock levels
- Low stock and out-of-stock alerts
- Pending operations requiring attention
- Move history and audit trails
- Operational performance metrics

### 🔐 Secure Authentication
We implement a robust authentication system with:
- Email/username + password login
- OTP-based password recovery
- Role-based access control (admin/staff)
- HTTP-only cookie sessions with JWT
- Secure password hashing with bcrypt

### 🎯 Features In Development

> **Note**: Due to time constraints during initial development, some features mentioned in our documentation are not yet fully implemented. We're actively working on completing these modules and will roll them out in upcoming releases.

Some features that are planned or partially implemented:

**AI Insights** - We're building an AI-powered analytics module that will provide:
- Predictive stock alerts
- Demand forecasting
- Anomaly detection
- Smart reorder suggestions

**Barcode Scanning** - A dedicated barcode module is planned for:
- Quick product lookups
- Mobile scanning capabilities
- Label generation and printing

**Orders Module** - We're developing a comprehensive order management system for:
- Purchase orders
- Sales orders
- Order fulfillment tracking
- Supplier and customer management

**Advanced Analytics** - Enhanced reporting capabilities including:
- Custom date range analysis
- Trend visualization
- Performance benchmarking
- Exportable reports

We prioritized building a solid foundation with core inventory operations, authentication, and the event-sourced ledger system. These advanced features will be added incrementally as we continue development.

## 🛠️ Technology Stack

We carefully selected our technology stack to balance developer experience, performance, and maintainability. Here's what we use and why:

### Frontend & Framework

**Next.js 16 (App Router)**
We chose Next.js for its powerful App Router architecture, which gives us:
- Server-side rendering for optimal performance
- Built-in API routes for backend logic
- File-based routing for intuitive project structure
- Automatic code splitting and optimization
- Seamless TypeScript integration

**React 19**
We leverage the latest React features including:
- Server Components for reduced client-side JavaScript
- Improved hydration and streaming
- Enhanced concurrent rendering
- Better error handling

**TypeScript 5**
We use TypeScript throughout the entire codebase because it:
- Catches errors at compile time
- Provides excellent IDE autocomplete
- Makes refactoring safer and easier
- Serves as living documentation
- Improves team collaboration

### Data Layer

**PostgreSQL**
We selected PostgreSQL as our database because it:
- Provides ACID compliance for data integrity
- Supports complex queries and aggregations
- Offers excellent performance at scale
- Has robust JSON support for flexible schemas
- Is battle-tested in enterprise environments

**Drizzle ORM**
We use Drizzle ORM instead of alternatives like Prisma because it:
- Generates zero runtime overhead
- Provides full TypeScript type safety
- Offers SQL-like query syntax that's easy to understand
- Supports migrations with full control
- Has excellent performance characteristics

### UI & Styling

**Tailwind CSS v4**
We adopted Tailwind CSS for its:
- Utility-first approach that speeds up development
- Consistent design system out of the box
- Excellent performance with automatic purging
- Easy responsive design with mobile-first approach
- No CSS naming conflicts

**Radix UI**
We build our components on Radix UI primitives because they:
- Provide unstyled, accessible components
- Handle complex interactions (dropdowns, dialogs, etc.)
- Follow WAI-ARIA guidelines
- Work seamlessly with Tailwind
- Give us full design control

**shadcn/ui**
We use shadcn/ui as our component library because it:
- Provides copy-paste components we own
- Integrates perfectly with Radix UI and Tailwind
- Allows full customization without ejecting
- Maintains consistent design patterns
- Reduces development time

### State Management & Data Fetching

**TanStack React Query**
We use React Query for server state management because it:
- Handles caching, refetching, and synchronization automatically
- Provides optimistic updates for better UX
- Reduces boilerplate compared to Redux
- Offers excellent DevTools for debugging
- Integrates seamlessly with our API routes

**React Hook Form + Zod**
We chose this combination for form handling because:
- React Hook Form minimizes re-renders for better performance
- Zod provides runtime type validation
- Schema validation is reusable on client and server
- Error handling is straightforward
- TypeScript integration is excellent

### Authentication & Security

**jose**
We use jose for JWT operations because it:
- Implements modern JWT standards
- Provides excellent TypeScript support
- Has zero dependencies
- Offers both signing and verification
- Supports various algorithms

**bcryptjs**
We hash passwords with bcryptjs because it:
- Is specifically designed for password hashing
- Includes automatic salting
- Has configurable work factors
- Is resistant to timing attacks
- Is widely trusted and audited

### Developer Experience

**pnpm**
We use pnpm as our package manager because it:
- Saves disk space with content-addressable storage
- Installs packages faster than npm/yarn
- Creates strict node_modules structure
- Prevents phantom dependencies
- Has excellent monorepo support

**ESLint + Prettier**
We enforce code quality with:
- ESLint for catching bugs and enforcing patterns
- Prettier for consistent code formatting
- Automatic formatting on save
- Pre-commit hooks for quality gates

## 📁 Project Structure

We organize our codebase for maximum clarity and maintainability:

```text
core-inventory/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Shared dashboard layout
│   │   ├── page.tsx              # Dashboard home
│   │   ├── products/             # Product management
│   │   ├── operations/           # Stock operations
│   │   │   ├── receipts/         # Inbound operations
│   │   │   ├── deliveries/       # Outbound operations
│   │   │   ├── transfers/        # Internal movements
│   │   │   └── adjustments/      # Stock corrections
│   │   ├── move-history/         # Audit trail
│   │   ├── analytics/            # Reports & insights
│   │   └── settings/             # Configuration
│   ├── api/                      # API route handlers
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── inventory/            # Inventory operations
│   │   ├── products/             # Product CRUD
│   │   ├── warehouses/           # Warehouse management
│   │   └── locations/            # Location management
│   ├── login/                    # Public login page
│   └── layout.tsx                # Root layout
│
├── components/                   # React components
│   ├── ui/                       # Base UI components (shadcn/ui)
│   ├── dashboard/                # Dashboard-specific components
│   ├── operations/               # Operation workspaces
│   ├── products/                 # Product management UI
│   ├── settings/                 # Settings dialogs
│   └── providers/                # Context providers
│
├── lib/                          # Shared utilities
│   ├── auth/                     # Authentication utilities
│   │   ├── jwt.ts                # JWT signing/verification
│   │   ├── otp.ts                # OTP generation/validation
│   │   ├── password.ts           # Password hashing
│   │   ├── session.ts            # Session management
│   │   └── mail.ts               # Email sending
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # Drizzle schema definitions
│   │   ├── queries.ts            # Reusable queries
│   │   ├── migrate.ts            # Migration runner
│   │   └── seed.ts               # Seed data
│   └── utils.ts                  # General utilities
│
├── hooks/                        # Custom React hooks
├── types/                        # TypeScript type definitions
├── Doc/                          # Documentation
│   ├── BRD.md                    # Business requirements
│   ├── FRD.md                    # Frontend requirements
│   ├── AUTH_SYSTEM.md            # Auth architecture
│   └── core_inventory_plan.md   # Project plan
│
└── public/                       # Static assets
```

### Key Design Decisions

**Route Groups**: We use `(dashboard)` route groups to share layouts without affecting URLs.

**API Colocation**: API routes live alongside their corresponding pages for better discoverability.

**Component Organization**: We separate UI primitives from feature-specific components.

**Type Safety**: Shared types ensure consistency between frontend and backend.

**Documentation**: We maintain comprehensive docs alongside code for better knowledge sharing.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** `20+` - We use modern JavaScript features
- **pnpm** `10+` - Our preferred package manager
- **PostgreSQL** `16+` - Our database engine

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JaivishChauhan/core-inventory.git
   cd core-inventory
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/core_inventory"
   
   # Authentication
   JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
   
   # Email (Optional - defaults to Ethereal for development)
   SMTP_HOST="smtp.ethereal.email"
   SMTP_PORT="587"
   SMTP_USER="your-ethereal-user"
   SMTP_PASS="your-ethereal-password"
   SMTP_FROM="noreply@coreinventory.com"
   ```
   
   **Security Notes**:
   - Generate a strong `JWT_SECRET` (minimum 32 characters)
   - Never commit `.env` or `.env.local` to version control
   - Use environment-specific secrets in production

4. **Initialize the database**
   ```bash
   # Push schema to database
   pnpm db:push
   
   # Run migrations
   pnpm db:migrate
   
   # Seed initial data
   pnpm db:seed
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Credentials

After seeding, you can log in with:

- **Admin Account**: Check the seed script output for credentials
- **Staff Account**: Check the seed script output for credentials

### Development Workflow

```bash
# Start development server with Turbopack
pnpm dev

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Format code
pnpm format

# Build for production
pnpm build

# Start production server
pnpm start
```

## 🗄️ Database Architecture

We designed our database schema around an event-sourced ledger pattern, which provides complete audit trails and accurate stock calculations.

### Core Entities

**Users (`users`)**
Manages authentication identities and role-based access control.
- Supports both admin and staff roles
- Links to active warehouse for context
- Stores hashed passwords (never plaintext)

**OTP Tokens (`otp_tokens`)**
Handles one-time passwords for account recovery.
- Time-limited (10 minutes)
- Single-use tokens
- Stores hashed tokens for security
- Automatically expires unused codes

**Warehouses (`warehouses`)**
Top-level physical entities for multi-warehouse operations.
- Unique warehouse codes
- Physical addresses
- Organizational hierarchy

**Locations (`locations`)**
Granular storage locations within warehouses.
- Internal locations (shelves, zones, bins)
- External nodes (vendors, customers)
- Special locations (loss, adjustment)
- Hierarchical organization

**Products (`products`)**
Master product catalog (SKU definitions).
- Unique SKU identifiers
- Product categories
- Units of measure
- Reorder point thresholds
- **Important**: This table contains NO stock quantities

**Stock Moves (`stock_moves`)** - The Heart of the System
Our immutable event-sourced ledger that serves as the single source of truth.

```sql
stock_moves {
  id                    UUID PRIMARY KEY
  product_id            UUID → products
  source_location_id    UUID → locations
  dest_location_id      UUID → locations
  quantity              INTEGER
  move_type             ENUM (receipt, delivery, transfer, adjustment)
  status                ENUM (draft, waiting, ready, done, canceled)
  reference             TEXT
  created_at            TIMESTAMP
  created_by            UUID → users
}
```

### Why Event Sourcing?

We chose an event-sourced architecture because it:

1. **Provides Complete Audit Trails**: Every stock change is recorded with who, what, when, and why
2. **Enables Time Travel**: We can calculate stock at any point in history
3. **Prevents Data Loss**: Records are immutable once validated
4. **Simplifies Reconciliation**: Discrepancies are easy to trace
5. **Supports Complex Workflows**: Multi-step operations are naturally modeled

### Stock Calculation

We calculate current stock dynamically from the ledger:

```sql
-- Available stock for a product at a location
SELECT 
  product_id,
  dest_location_id as location_id,
  SUM(quantity) as available_stock
FROM stock_moves
WHERE 
  status = 'done'
  AND dest_location_id IN (SELECT id FROM locations WHERE type = 'internal')
GROUP BY product_id, dest_location_id
```

This approach ensures:
- Stock is always accurate
- No separate inventory table to keep in sync
- Historical accuracy is maintained
- Calculations are based on immutable facts

## 🗂️ Database Operations

We provide convenient scripts for managing database schema and data.

### Available Commands

```bash
# Push schema changes to database (development)
pnpm db:push

# Run migration script (production-safe)
pnpm db:migrate

# Seed database with initial data
pnpm db:seed
```

### Migration Strategy

**Development**: We use `db:push` for rapid iteration. It synchronizes the schema directly without creating migration files.

**Production**: We use `db:migrate` which runs the migration logic in `lib/db/migrate.ts`. This ensures controlled, versioned schema changes.

### Seed Data

Our seed script (`lib/db/seed.ts`) creates:
- Default admin and staff users
- Sample warehouses and locations
- Example products across categories
- Initial stock moves for testing

You can customize seed data by editing the seed script before running it.

### Schema Management

We define our schema in `lib/db/schema.ts` using Drizzle ORM:

```typescript
// Example: Products table
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  uom: varchar('uom', { length: 50 }).notNull(),
  reorderPoint: integer('reorder_point').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});
```

### Backup & Recovery

We recommend:
- Regular PostgreSQL backups using `pg_dump`
- Point-in-time recovery configuration
- Testing restore procedures regularly
- Maintaining separate backup storage

## 📜 Available Scripts

We provide a comprehensive set of scripts for development, testing, and deployment.

| Script | Command | Description |
|--------|---------|-------------|
| **Development** | | |
| `dev` | `pnpm dev` | Start development server with Turbopack for fast refresh |
| **Building** | | |
| `build` | `pnpm build` | Create optimized production build |
| `start` | `pnpm start` | Run production server (requires build first) |
| **Code Quality** | | |
| `lint` | `pnpm lint` | Run ESLint to check for code issues |
| `typecheck` | `pnpm typecheck` | Run TypeScript compiler in check mode |
| `format` | `pnpm format` | Format all TypeScript/TSX files with Prettier |
| **Database** | | |
| `db:push` | `pnpm db:push` | Push schema changes to database (development) |
| `db:migrate` | `pnpm db:migrate` | Run migration script (production-safe) |
| `db:seed` | `pnpm db:seed` | Populate database with seed data |

### Pre-Deployment Checklist

Before deploying to production, we run:

```bash
# Check for type errors
pnpm typecheck

# Check for linting issues
pnpm lint

# Ensure build succeeds
pnpm build
```

All checks must pass before merging to main branch.

## 📡 API Reference

We organize our API routes by domain for clarity and maintainability.

### Authentication (`/api/auth/*`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/auth/login` | POST | Authenticate user and create session | No |
| `/api/auth/logout` | POST | Destroy current session | Yes |
| `/api/auth/signup` | POST | Create new user account | No |
| `/api/auth/me` | GET | Get current user profile | Yes |
| `/api/auth/request-otp` | POST | Request password reset OTP | No |
| `/api/auth/verify-otp` | POST | Verify OTP code | No |
| `/api/auth/reset-password` | POST | Reset password with OTP | No |

### Inventory Operations (`/api/inventory/*`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/inventory/dashboard` | GET | Get dashboard overview | Yes |
| `/api/inventory/kpis` | GET | Get key performance indicators | Yes |
| `/api/inventory/stock` | GET | Get current stock levels | Yes |
| `/api/inventory/move` | GET, POST | List or create stock moves | Yes |
| `/api/inventory/move/[id]/validate` | POST | Validate a stock move | Yes |
| `/api/inventory/move/[id]/cancel` | POST | Cancel a stock move | Yes |
| `/api/inventory/adjustment` | POST | Create stock adjustment | Yes |
| `/api/inventory/reference-data` | GET | Get reference data for forms | Yes |

### Products (`/api/products/*`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/products` | GET, POST | List or create products | Yes |
| `/api/products/[id]` | GET, PUT, DELETE | Get, update, or delete product | Yes |

### Warehouses (`/api/warehouses/*`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/warehouses` | GET, POST | List or create warehouses | Yes (Admin) |
| `/api/warehouses/[id]` | GET, PUT, DELETE | Get, update, or delete warehouse | Yes (Admin) |

### Locations (`/api/locations/*`)

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/locations` | GET, POST | List or create locations | Yes (Admin) |
| `/api/locations/[id]` | GET, PUT, DELETE | Get, update, or delete location | Yes (Admin) |

### Request/Response Examples

**Create Stock Move**
```typescript
POST /api/inventory/move
Content-Type: application/json

{
  "productId": "uuid",
  "sourceLocationId": "uuid",
  "destLocationId": "uuid",
  "quantity": 100,
  "moveType": "receipt",
  "reference": "PO-2024-001"
}

// Response
{
  "success": true,
  "move": {
    "id": "uuid",
    "status": "draft",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Get Stock Levels**
```typescript
GET /api/inventory/stock?warehouseId=uuid

// Response
{
  "success": true,
  "stock": [
    {
      "productId": "uuid",
      "productName": "Widget A",
      "sku": "WDG-001",
      "locationId": "uuid",
      "locationName": "Shelf A1",
      "quantity": 150
    }
  ]
}
```

## 🔐 Authentication System

We built a secure, cookie-based authentication system that balances security with user experience.

### How It Works

1. **User Login**
   - User submits email/username and password
   - We verify credentials against hashed passwords
   - On success, we generate a JWT token
   - Token is stored in HTTP-only cookie (`ci_session`)

2. **Session Management**
   - Middleware validates JWT on every request
   - Expired tokens are automatically rejected
   - Users can log out to invalidate sessions

3. **Password Recovery**
   - User requests OTP via email
   - We generate a 6-digit code and hash it
   - Code expires after 10 minutes
   - User verifies OTP and sets new password
   - OTP is marked as used to prevent reuse

### Security Features

**HTTP-Only Cookies**: Tokens are inaccessible to JavaScript, preventing XSS attacks.

**JWT Signing**: We use HMAC-SHA256 to sign tokens, ensuring they can't be tampered with.

**Password Hashing**: We use bcrypt with automatic salting, making rainbow table attacks infeasible.

**OTP Hashing**: Even OTP codes are hashed before storage, protecting against database breaches.

**Role-Based Access**: Admin and staff roles control access to sensitive operations.

**Token Expiration**: Sessions expire automatically, limiting the window for token theft.

### API Endpoints

```typescript
POST   /api/auth/login           // Authenticate user
POST   /api/auth/logout          // End session
POST   /api/auth/signup          // Create account
GET    /api/auth/me              // Get current user
POST   /api/auth/request-otp     // Request password reset
POST   /api/auth/verify-otp      // Verify OTP code
POST   /api/auth/reset-password  // Set new password
```

## 🎨 Design System

We implement a modern, enterprise-grade design system called "Corporate Trust" that balances professionalism with approachability.

### Design Philosophy

Our design system embodies:
- **Trustworthy Yet Vibrant**: Professional structure with energetic gradients
- **Dimensional Depth**: Isometric perspectives and colored shadows
- **Refined Elegance**: Polished micro-interactions and smooth transitions
- **Purposeful Gradients**: Indigo-to-violet as our visual signature
- **Professional Polish**: Generous white space and consistent spacing

### 🎨 UX Principles (The "Anti-Clunky" Manifesto)

We designed Core Inventory to be a joy to use, not a burden. Here are the principles guiding our UX decisions:

**High Data Density**: Warehouse managers need to see massive amounts of information at a glance. We use compact table rows, minimal padding, and clear typography to maximize information density without sacrificing readability.

**Keyboard-First Navigation**: Power users should be able to fly through operations without touching a mouse. We're implementing robust command palettes (Cmd+K) and keyboard shortcuts for common actions *(coming soon)*.

**Zero Layout Shift**: When a worker validates a receipt, the UI should update instantly with optimistic rendering. No jarring loading states or layout jumps *(in progress)*.

**Industrial Aesthetic**: We use a monochromatic slate/zinc base with highly intentional accent colors:
- Red strictly for destructive actions or out-of-stock alerts
- Green for successful validations
- Amber for pending statuses

### Typography

We use **Plus Jakarta Sans** throughout the application because it:
- Balances professional authority with modern approachability
- Provides excellent readability at all sizes
- Has friendly rounded terminals
- Offers comprehensive weight options (400-800)

### Color Palette

**Primary Colors**:
- Indigo 600 (`#4F46E5`) - Our core brand color
- Violet 600 (`#7C3AED`) - For gradients and accents
- Slate 900 (`#0F172A`) - Primary text
- Slate 500 (`#64748B`) - Secondary text

**Functional Colors**:
- Emerald 500 (`#10B981`) - Success states
- Red 500 - Destructive actions
- Amber 500 - Warning states

### Component Patterns

**Cards**: White background with colored shadows that lift on hover

**Buttons**: Gradient backgrounds with subtle lift animations

**Forms**: Clean inputs with indigo focus rings

**Tables**: High data density with clear row separation

**Modals**: Slide-over drawers for contextual actions that never navigate users away from their current context

### Interaction Design

**Slide-Over Drawers**: When creating a new receipt or delivery order, a wide drawer slides in from the right. This keeps users in context and allows them to reference the main view while filling out forms.

**Real-Time Validation**: Forms validate as you type, providing immediate feedback without waiting for submission.

**Dynamic Line Items**: Adding multiple products to a single receipt is intuitive with our dynamic form system.

**Sticky Action Buttons**: Important actions like "Validate" stay visible at the bottom of forms, even when scrolling through long lists.

For complete design system documentation, see `Doc/FRD.md`.

## Documentation Index

Project documentation lives under `Doc/`:

- `AUTH_SYSTEM.md` for authentication architecture
- `BRD.md`, `FRD.md`, `PRD.MD`, `TRD.MD` for requirements and technical design
- `MIGRATION_GUIDE.md` for migration-related steps

## License

This repository is marked as private. Add or update licensing terms based on organizational policy.


## 🚢 Deployment

We designed the application to be deployment-agnostic, supporting various hosting platforms.

### Recommended Platforms

**Vercel** (Recommended)
- Native Next.js support
- Automatic deployments from Git
- Edge network for global performance
- Built-in analytics and monitoring

**Railway**
- Simple PostgreSQL hosting
- Environment variable management
- Automatic HTTPS
- Cost-effective for small teams

**Self-Hosted**
- Full control over infrastructure
- Docker support available
- Requires PostgreSQL instance
- Suitable for enterprise deployments

### Environment Variables

Ensure these are set in your production environment:

```env
DATABASE_URL="postgresql://..."
JWT_SECRET="production-secret-min-32-chars"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"
NODE_ENV="production"
```

### Build & Deploy

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm db:migrate

# Build application
pnpm build

# Start production server
pnpm start
```

### Health Checks

We recommend monitoring:
- `/api/auth/me` - API health
- Database connection pool
- Response times
- Error rates

## 🧪 Testing

We prioritize code quality through:

**Type Safety**: TypeScript catches errors at compile time

**Linting**: ESLint enforces consistent patterns

**Type Checking**: `pnpm typecheck` validates all types

**Manual Testing**: Comprehensive test scenarios for critical flows

Future improvements may include:
- Unit tests with Vitest
- Integration tests for API routes
- E2E tests with Playwright

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow our code style (run `pnpm format`)
   - Add types for new code
   - Update documentation as needed
4. **Run quality checks**
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm build
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

We follow these conventions:
- Use TypeScript for all new code
- Follow the existing component patterns
- Use Tailwind CSS for styling (no custom CSS)
- Write descriptive commit messages
- Keep functions small and focused
- Add comments for complex logic

### Reporting Issues

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

## 📚 Documentation

We maintain comprehensive documentation in the `Doc/` directory:

- **`BRD.md`** - Business Requirements Document
- **`FRD.md`** - Frontend Requirements Document
- **`AUTH_SYSTEM.md`** - Authentication Architecture
- **`core_inventory_plan.md`** - Project Planning
- **`CHANGELOG_AUTH.md`** - Authentication System Changes

## 🗺️ Roadmap & Future Enhancements

> **Development Status**: We built Core Inventory with a focus on establishing a robust foundation first. Due to time constraints, we prioritized core functionality—authentication, inventory operations, and the event-sourced ledger system. Many advanced features are planned and will be implemented in upcoming releases as we continue active development.

We're continuously improving Core Inventory. Here's what we're planning:

### 🎯 High Priority Features

**Command Palette (Cmd+K)**
We plan to implement a keyboard-first navigation system that allows power users to:
- Quickly search for products by SKU or name
- Navigate between pages without touching the mouse
- Execute common actions via keyboard shortcuts
- Access recent items and frequently used operations

**Real-Time Updates**
We're exploring WebSocket integration to provide:
- Live stock level updates across all connected clients
- Real-time notifications when stock moves are validated
- Instant dashboard KPI refreshes
- Collaborative editing indicators

**Advanced Data Tables**
We want to enhance our tables with:
- Server-side pagination for large datasets
- Multi-column sorting
- Column visibility toggling
- Saved filter presets
- Export to CSV/Excel functionality

**Optimistic UI Updates**
We plan to implement optimistic updates for:
- Instant feedback when validating stock moves
- Zero layout shift during operations
- Rollback mechanisms for failed operations
- Loading states that don't block interaction

### 📊 Analytics & Reporting

**Advanced Analytics Dashboard**
- Stock turnover rates by product/category
- Warehouse utilization metrics
- Supplier performance tracking
- Demand forecasting based on historical data
- Custom date range comparisons
- Exportable reports in PDF/Excel

**AI-Powered Insights**
- Predictive low-stock alerts
- Anomaly detection for unusual stock movements
- Automated reorder point suggestions
- Seasonal demand pattern recognition
- Smart categorization of products

### 📱 Mobile & Accessibility

**Mobile-Optimized Interface**
- Progressive Web App (PWA) support
- Offline-first capabilities
- Touch-optimized controls
- Camera integration for barcode scanning
- Voice commands for hands-free operation

**Barcode Integration**
- QR code and barcode generation for products
- Mobile barcode scanning for quick lookups
- Batch scanning for receipts and deliveries
- Print labels directly from the system

### 🔔 Notifications & Alerts

**Smart Notification System**
- Low stock alerts with configurable thresholds
- Pending operation reminders
- Email digests for daily/weekly summaries
- In-app notification center
- Customizable notification preferences per user

### 🔄 Workflow Enhancements

**Batch Operations**
- Bulk product creation via CSV import
- Mass stock adjustments
- Batch location transfers
- Multi-product receipt processing

**Approval Workflows**
- Multi-level approval for high-value operations
- Configurable approval rules by role
- Approval history and audit trail
- Email notifications for pending approvals

**Scheduled Operations**
- Recurring stock counts
- Automated reorder triggers
- Scheduled reports
- Periodic stock reconciliation

### 🌐 Integration & API

**Webhook System**
- Real-time event notifications to external systems
- Configurable webhook endpoints
- Retry logic for failed deliveries
- Event filtering and transformation

**Public API**
- RESTful API for third-party integrations
- API key management
- Rate limiting and usage tracking
- Comprehensive API documentation
- SDKs for popular languages

**ERP Integration**
- SAP connector
- Oracle NetSuite integration
- QuickBooks sync
- Custom integration framework

### 💼 Enterprise Features

**Multi-Tenancy**
- Organization-level isolation
- Tenant-specific branding
- Usage-based billing
- Tenant admin dashboard

**Advanced Security**
- Two-factor authentication (2FA)
- Single Sign-On (SSO) via SAML/OAuth
- IP whitelisting
- Session management dashboard
- Audit log viewer with search

**Compliance & Audit**
- FIFO/LIFO/FEFO tracking
- Lot and serial number management
- Expiration date tracking
- Regulatory compliance reports
- Complete audit trail with tamper detection

### 🎨 UX Improvements

**Customizable Dashboards**
- Drag-and-drop widget arrangement
- Role-based default layouts
- Personal dashboard preferences
- Shareable dashboard templates

**Dark Mode**
- System-preference detection
- Manual toggle
- Consistent theming across all components

**Internationalization (i18n)**
- Multi-language support
- RTL language support
- Localized date/time formats
- Currency localization

### 🔧 Technical Improvements

**Performance Optimization**
- Database query optimization
- Redis caching layer
- CDN for static assets
- Image optimization and lazy loading
- Code splitting and bundle optimization

**Testing Infrastructure**
- Unit tests with Vitest
- Integration tests for API routes
- E2E tests with Playwright
- Visual regression testing
- Performance benchmarking

**DevOps & Monitoring**
- Docker containerization
- Kubernetes deployment configs
- CI/CD pipeline with GitHub Actions
- Application performance monitoring (APM)
- Error tracking with Sentry
- Log aggregation and analysis

### 📦 Additional Features

- [ ] Supplier management module
- [ ] Customer management module
- [ ] Purchase order system
- [ ] Sales order management
- [ ] Shipping integration (FedEx, UPS, DHL)
- [ ] Multi-currency support
- [ ] Tax calculation engine
- [ ] Document attachment system
- [ ] Print templates for labels and documents
- [ ] Stock reservation system
- [ ] Consignment inventory tracking
- [ ] Kitting and bundling support
- [ ] Cycle counting workflows

## 📄 License

This project is private and proprietary. All rights reserved.

For licensing inquiries, please contact the repository owner.

## 👥 Team

Built with ❤️ by the Core Inventory team.

## 🙏 Acknowledgments

We're grateful to the open-source community for the amazing tools that power this project:

- [Next.js](https://nextjs.org/) - The React framework
- [Drizzle ORM](https://orm.drizzle.team/) - TypeScript ORM
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Zod](https://zod.dev/) - Schema validation

## 📞 Support

Need help? Here's how to reach us:

- **Issues**: Open a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the maintainers directly

---

<div align="center">
  <p>Made with TypeScript, Next.js, and PostgreSQL</p>
  <p>⭐ Star us on GitHub if you find this project useful!</p>
</div>
