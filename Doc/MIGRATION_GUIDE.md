# Migration Guide: OTP Login to Password-Based Auth

## Overview

The authentication system has been updated from OTP-based passwordless login to a traditional password-based system with OTP only for password reset.

## Changes

### Before (OTP-based login)
- Users entered email
- System sent 6-digit OTP code
- Users entered OTP to log in
- No passwords stored

### After (Password-based auth)
- Users sign up with email, name, and password
- Users log in with email and password
- OTP is only used for password reset
- Passwords are securely hashed with bcrypt

## Migration Steps

### 1. Run Database Migration

```bash
pnpm db:migrate
```

This will add the `password_hash` column to the users table.

### 2. Handle Existing Users

Existing users in the database will have `NULL` in the `password_hash` column. You have two options:

#### Option A: Reset All Users (Recommended for Development)
```bash
# Clear existing users and reseed
pnpm db:seed
```

#### Option B: Manual Password Setup for Existing Users

Create a one-time password setup script or have users:
1. Use "Forgot Password" flow on login page
2. Receive OTP via email
3. Set their new password

### 3. Update Environment Variables

Ensure these are set in your `.env` file:

```env
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=postgresql://...
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
```

### 4. Test the New Flow

1. Navigate to `/login`
2. Click "Sign Up" tab
3. Create a new account with name, email, and password
4. Verify you can log in with email and password
5. Test "Forgot Password" flow

## Breaking Changes

### API Endpoints

**Removed:**
- `POST /api/auth/verify-otp` (for login)

**Added:**
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/reset-password` - Reset password with OTP

**Modified:**
- `POST /api/auth/request-otp` - Now only for password reset (no longer creates users)

### Frontend Changes

The login page now has:
- Tabs for "Login" and "Sign Up"
- Password fields instead of OTP input
- "Forgot Password" link for password reset flow

## Rollback Plan

If you need to rollback:

1. Restore the old files from git:
```bash
git checkout HEAD~1 -- app/login/page.tsx
git checkout HEAD~1 -- app/api/auth/
git checkout HEAD~1 -- lib/auth/
git checkout HEAD~1 -- middleware.ts
```

2. Run the old migration script

3. Restart the application

## Support

For issues or questions, refer to:
- `Doc/AUTH_SYSTEM.md` - Complete auth system documentation
- `Doc/core_inventory_plan.md` - Overall project plan
