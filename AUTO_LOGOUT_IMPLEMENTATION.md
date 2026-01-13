# Auto-Logout with NextAuth - Implementation Guide

## Overview

This implementation provides a comprehensive auto-logout system with NextAuth where:

- ✅ All active sessions are stored in the database (`Usersession` table)
- ✅ Sessions are verified against the database on every request
- ✅ Expired or invalid sessions automatically log users out
- ✅ Sessions can be manually invalidated from the database
- ✅ Automatic cleanup of expired sessions via cron job

## How It Works

### 1. Session Creation

When a user logs in:

- A session record is created in the `Usersession` table with a unique `session_id`
- The `expireAt` field is set (default: 7 days from creation)
- The `session_id` is stored in the JWT token

### 2. Session Verification

On every request, sessions are verified at multiple layers:

- **Middleware** (`src/middleware.ts`) checks if JWT token exists (Edge Runtime compatible - NO database calls)
- **Session callback** in NextAuth (`src/app/api/auth/[...nextauth]/route.ts`) verifies session in database on every session access
- **getUser()** function (`src/lib/session.ts`) verifies session for server components and server actions

**Important**: Middleware runs on Edge Runtime and cannot use Prisma. Database verification only happens when sessions are accessed through NextAuth or server components.

### 3. Auto-Logout

Users are automatically logged out when:

- Session has expired (`expireAt < current time`)
- Session is deleted from database (manual invalidation)
- Session doesn't exist in database

## Key Files Modified/Created

### Modified Files

1. **`src/app/api/auth/[...nextauth]/route.ts`**

   - Fixed session expiration check (was using `lte` instead of `gte`)
   - Enhanced session callback to verify DB session on every request
   - Added detailed logging for session validation

2. **`src/middleware.ts`**

   - Checks for JWT token existence only (Edge Runtime compatible)
   - **Does NOT use Prisma** - Edge Runtime limitation
   - Redirects to login if no token present
   - Database verification delegated to NextAuth session callback

3. **`src/lib/session.ts`**
   - Added `verifySessionInDB()` helper function
   - Updated `getUser()` to verify session in database
   - Added comprehensive documentation

### New Files Created

4. **`src/lib/sessionCleanup.ts`**

   - `cleanupExpiredSessions()` - Remove all expired sessions
   - `invalidateUserSession()` - Force logout a specific session
   - `invalidateAllUserSessions()` - Force logout all user's sessions
   - `getUserActiveSessions()` - Get list of active sessions
   - `extendSessionExpiration()` - Extend session lifetime

5. **`src/app/api/session/route.ts`**

   - REST API for session management
   - GET `/api/session` - Get user's active sessions
   - POST `/api/session?action=invalidate` - Logout specific session
   - POST `/api/session?action=invalidate-all` - Logout all sessions
   - POST `/api/session?action=cleanup` - Admin only, cleanup expired

6. **`src/app/api/cron/cleanup-sessions/route.ts`**

   - Cron job endpoint for automated cleanup
   - Runs daily to remove expired sessions
   - Secured with authorization header

7. **`vercel.json`**
   - Vercel cron configuration
   - Scheduled to run daily at midnight

## Architecture & Edge Runtime Considerations

### Why No Database Calls in Middleware?

Next.js middleware runs on the **Edge Runtime**, which is a lightweight runtime that doesn't support:

- Node.js-specific modules
- Prisma Client
- File system access
- Many npm packages

**Our Solution:**

1. **Middleware** → Only checks JWT token existence (fast, Edge compatible)
2. **NextAuth Session Callback** → Verifies session in database when accessed
3. **Server Components/Actions** → Use `getUser()` which verifies DB session

This layered approach ensures:

- ✅ Fast middleware execution on Edge
- ✅ Database verification when it matters
- ✅ Automatic logout on invalid sessions
- ✅ No Edge Runtime compatibility issues

### Session Verification Flow

```
Request → Middleware (JWT check) → NextAuth Session Callback (DB verify) → Return session or null
```

If database session is invalid:

- NextAuth session callback returns `null`
- User is automatically logged out
- Redirected to login page

## Database Schema

The existing `Usersession` model in Prisma:

\`\`\`prisma
model Usersession {
session_id String @id @default(uuid())
user_id Int
user User @relation(fields: [user_id], references: [id], onDelete: Cascade)
createdAt DateTime @default(now())
expireAt DateTime
}
\`\`\`

## Usage Examples

### 1. Force Logout a User (Admin)

\`\`\`typescript
// Invalidate all sessions for a user
const result = await fetch('/api/session?action=invalidate-all', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ user_id: 123 })
});
\`\`\`

### 2. Get Active Sessions

\`\`\`typescript
// Get all active sessions for current user
const response = await fetch('/api/session');
const { sessions } = await response.json();

// Display sessions to user
sessions.forEach(session => {
console.log(\`Session: \${session.session_id}\`);
console.log(\`Created: \${session.createdAt}\`);
console.log(\`Expires: \${session.expireAt}\`);
console.log(\`Current: \${session.isCurrent}\`);
});
\`\`\`

### 3. Logout from Specific Device

\`\`\`typescript
// User wants to logout from a different device
await fetch('/api/session?action=invalidate', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ session_id: 'abc-123-def' })
});
\`\`\`

### 4. Manual Cleanup (Server-side)

\`\`\`typescript
import { cleanupExpiredSessions } from '@/src/lib/sessionCleanup';

// In a server action or API route
const count = await cleanupExpiredSessions();
console.log(\`Cleaned up \${count} expired sessions\`);
\`\`\`

### 5. Extend Session (Remember Me)

\`\`\`typescript
import { extendSessionExpiration } from '@/src/lib/sessionCleanup';

// Extend session for 30 days
await extendSessionExpiration(session_id, 30);
\`\`\`

## Security Features

1. **Session Validation**: Every request validates session in database
2. **Automatic Cleanup**: Expired sessions are automatically removed
3. **Manual Invalidation**: Admins can force logout any user
4. **Cascade Delete**: Sessions are deleted when user is deleted
5. **Secure Endpoints**: Session management APIs are protected

## Environment Variables

Add to your `.env` file:

\`\`\`env

# Optional: Secure your cron endpoint

CRON_SECRET=your-secret-key-here
\`\`\`

Then use in requests:
\`\`\`bash
curl -H "Authorization: Bearer your-secret-key-here" \\
https://yourapp.com/api/cron/cleanup-sessions
\`\`\`

## Cron Job Setup

### Vercel (Automatic)

The `vercel.json` file is already configured. Vercel will automatically call the cleanup endpoint daily.

### Other Platforms

#### Using GitHub Actions

\`\`\`yaml
name: Cleanup Sessions
on:
schedule: - cron: '0 0 \* \* \*' # Daily at midnight

jobs:
cleanup:
runs-on: ubuntu-latest
steps: - name: Call cleanup endpoint
run: |
curl -X GET \\
-H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \\
https://yourapp.com/api/cron/cleanup-sessions
\`\`\`

#### Using System Cron (Linux/Mac)

\`\`\`bash

# Edit crontab

crontab -e

# Add this line (runs daily at midnight)

0 0 \* \* \* curl -H "Authorization: Bearer YOUR_SECRET" https://yourapp.com/api/cron/cleanup-sessions
\`\`\`

#### Manual Trigger (Development)

\`\`\`bash

# Call cleanup endpoint manually

curl -H "Authorization: Bearer your-secret" \\
http://localhost:3000/api/cron/cleanup-sessions
\`\`\`

## Testing

### Test Session Expiration

\`\`\`typescript
// Create a session that expires immediately (for testing)
const session = await Prisma.usersession.create({
data: {
user_id: userId,
expireAt: new Date(Date.now() - 1000), // Already expired
},
});

// Try to use this session - should be logged out
\`\`\`

### Test Manual Invalidation

\`\`\`bash

# Get active sessions

curl http://localhost:3000/api/session \\
-H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Invalidate a session

curl -X POST http://localhost:3000/api/session?action=invalidate \\
-H "Cookie: next-auth.session-token=YOUR_TOKEN" \\
-H "Content-Type: application/json" \\
-d '{"session_id": "SESSION_ID"}'
\`\`\`

## Performance Considerations

1. **Database Queries**: Each request makes 1 DB query to verify session

   - Consider adding Redis cache for high-traffic apps
   - Use database indexes (already on `session_id` as primary key)

2. **Cleanup Frequency**: Daily cleanup is usually sufficient

   - Adjust cron schedule based on your needs
   - More frequent cleanups use more resources

3. **Session Expiration**: Default 7 days
   - Adjust in `getOneWeekFromToday()` utility
   - Shorter = more secure, longer = better UX

## Troubleshooting

### Sessions Not Being Cleaned Up

- Check if cron job is running: `vercel logs` or check platform logs
- Manually trigger: `curl /api/cron/cleanup-sessions`
- Verify `CRON_SECRET` is set correctly

### Users Not Being Logged Out

- Check middleware is running: add console.logs
- Verify session expiration logic in NextAuth callback
- Check database for session records

### Session Verification Too Slow

- Add database indexes (already present)
- Consider Redis caching layer
- Profile with `console.time()` calls

## Future Enhancements

Potential improvements:

- [ ] Add Redis cache for session verification
- [ ] IP-based session tracking
- [ ] Device fingerprinting
- [ ] Session activity logs
- [ ] Rate limiting on session creation
- [ ] Email notifications for new login locations
- [ ] "Trust this device" functionality

## Summary

Your NextAuth implementation now has:
✅ Database-backed session storage
✅ Real-time session verification
✅ Automatic logout on expiration/invalidation
✅ Manual session management
✅ Automated cleanup
✅ Multi-device support
✅ Security logging

All session checks are now synchronized with the database, enabling centralized session control and instant logout capabilities.
