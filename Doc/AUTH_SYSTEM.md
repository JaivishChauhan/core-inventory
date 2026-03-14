# Authentication System

## Overview

The Core Inventory system uses a password-based authentication system with OTP (One-Time Password) for password reset functionality.

## Features

### 1. User Signup
- Users can create a new account with:
  - Full name
  - Email address
  - Password (minimum 8 characters)
- Passwords are hashed using bcrypt before storage
- Upon successful signup, users are automatically logged in

**API Endpoint:** `POST /api/auth/signup`

### 2. User Login
- Users authenticate with:
  - Email address
  - Password
- Session is created via JWT stored in HTTP-only cookie
- Session expires after 7 days

**API Endpoint:** `POST /api/auth/login`

### 3. Password Reset (OTP-based)
- Users can reset their password using a 6-digit OTP code
- Flow:
  1. User requests reset code by providing email
  2. System sends 6-digit code to email
  3. User enters code and new password
  4. Password is updated

**API Endpoints:**
- `POST /api/auth/request-otp` - Request reset code
- `POST /api/auth/reset-password` - Verify code and reset password

### 4. Session Management
- Sessions are stored as JWT tokens in HTTP-only cookies
- Cookie name: `ci_session`
- Session duration: 7 days
- Automatic session validation on protected routes

## Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- OTP tokens hashed with SHA-256 before storage
- HTTP-only cookies prevent XSS attacks
- Secure flag enabled in production
- SameSite=Lax for CSRF protection
- OTP tokens are single-use and expire after 10 minutes
- All previous OTP tokens invalidated when new one is requested

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'staff' NOT NULL,
  active_warehouse_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

### OTP Tokens Table
```sql
CREATE TABLE otp_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  hashed_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

## Migration

To apply the authentication schema changes, run:

```bash
pnpm db:migrate
```

This will:
- Add `password_hash` column to users table
- Create `otp_tokens` table for password reset
- Set up necessary constraints and defaults

## Environment Variables

Required environment variables:

```env
# JWT Secret (minimum 32 characters)
JWT_SECRET=your-secret-key-min-32-chars

# Database connection
DATABASE_URL=postgresql://user:password@host:port/database

# Email configuration (for OTP delivery)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
```

## Usage Examples

### Frontend - Login
```typescript
const response = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "securepassword123"
  })
});
```

### Frontend - Signup
```typescript
const response = await fetch("/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "John Doe",
    email: "john@example.com",
    password: "securepassword123"
  })
});
```

### Frontend - Password Reset
```typescript
// Step 1: Request OTP
await fetch("/api/auth/request-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "user@example.com" })
});

// Step 2: Reset password with OTP
await fetch("/api/auth/reset-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    otp: "123456",
    newPassword: "newsecurepassword123"
  })
});
```

## Protected Routes

All routes except the following require authentication:
- `/login`
- `/api/auth/login`
- `/api/auth/signup`
- `/api/auth/request-otp`
- `/api/auth/reset-password`

Unauthenticated users are automatically redirected to `/login`.
