# Authentication System Update

## Summary

Replaced OTP-based passwordless login with traditional password-based authentication. OTP is now only used for password reset functionality.

## Files Changed

### New Files
- `lib/auth/password.ts` - Password hashing utilities using bcrypt
- `app/api/auth/login/route.ts` - Login endpoint with email/password
- `app/api/auth/signup/route.ts` - User registration endpoint
- `app/api/auth/reset-password/route.ts` - Password reset with OTP verification
- `Doc/AUTH_SYSTEM.md` - Complete authentication documentation
- `Doc/MIGRATION_GUIDE.md` - Migration guide for existing installations

### Modified Files
- `lib/db/schema.ts` - Added `password_hash` column to users table
- `lib/db/migrate.ts` - Updated migration to add password_hash column
- `app/login/page.tsx` - Complete redesign with Login/Signup tabs and forgot password flow
- `app/api/auth/request-otp/route.ts` - Now only for password reset (removed user creation)
- `middleware.ts` - Updated public routes for new auth endpoints

### Deleted Files
- `app/api/auth/verify-otp/route.ts` - Replaced by login and reset-password endpoints

## Database Changes

### Users Table
```sql
ALTER TABLE users
  ADD COLUMN password_hash TEXT NOT NULL;
```

### OTP Tokens Table
- No schema changes
- Usage changed: now only for password reset, not login

## API Changes

### New Endpoints
- `POST /api/auth/login` - Authenticate with email and password
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/reset-password` - Reset password using OTP

### Modified Endpoints
- `POST /api/auth/request-otp` - Now only sends reset codes (doesn't create users)

### Removed Endpoints
- `POST /api/auth/verify-otp` - Functionality split into login and reset-password

## Security Improvements

1. Passwords hashed with bcrypt (10 salt rounds)
2. OTP tokens remain hashed with SHA-256
3. HTTP-only cookies for session management
4. Secure flag in production
5. SameSite=Lax for CSRF protection
6. Single-use OTP tokens with 10-minute expiration

## User Experience Changes

### Login Page
- Tabbed interface: "Login" and "Sign Up"
- Login tab: email + password fields
- Sign Up tab: name + email + password fields
- "Forgot Password" link for password reset

### Password Reset Flow
1. Click "Forgot Password" on login page
2. Enter email address
3. Receive 6-digit OTP via email
4. Enter OTP and new password
5. Password updated, return to login

## Next Steps

1. Run database migration: `pnpm db:migrate`
2. Test signup flow
3. Test login flow
4. Test password reset flow
5. Update any existing users (see MIGRATION_GUIDE.md)

## Dependencies

All required dependencies already installed:
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types
- `jose` - JWT handling
- `zod` - Validation
- `nodemailer` - Email sending
