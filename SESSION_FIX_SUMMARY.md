# Session Management Fix - Sliding Expiration Implementation

## Problem Identified

Users were being signed out after 7 days regardless of activity because the session `expireAt` field was never being renewed during active use. Only the `cexp` (15-minute access token) was being renewed, creating a hard 7-day timeout even for active users.

## Root Cause

The session renewal logic was only updating:

- `refresh_token_hash` (new session ID)
- `lastUsed` (timestamp)
- `cexp` (15-minute access token expiration)

But **NOT** updating:

- `expireAt` (7-day session expiration) ⚠️

This meant that even active users would be forcibly logged out after 7 days from initial login, regardless of activity.

## Solution Implemented

Implemented **sliding expiration** pattern across all session renewal points to extend the session expiration whenever a user is actively using the application.

### Files Modified

#### 1. `/src/app/api/auth/[...nextauth]/route.ts`

**Changes:**

- Added `generateExpirationDate` import
- Updated JWT callback to extend `expireAt` by 7 days during token renewal
- Added comment: "Generate new session ID and update with sliding expiration"

```typescript
data: {
  refresh_token_hash: hashToken(newSessionId),
  lastUsed: new Date(),
  expireAt: generateExpirationDate(7, "days"), // NEW: Extend session by 7 days
}
```

#### 2. `/src/app/api/auth/access/action.ts`

**Changes:**

- Added `generateExpirationDate` import
- Updated `RenewAccessToken` function to extend `expireAt` during token renewal
- Added comment: "Update usersession with sliding expiration"

```typescript
data: {
  refresh_token_hash: hashToken(newSessionId),
  lastUsed: new Date(),
  expireAt: generateExpirationDate(7, "days"), // NEW: Extend session by 7 days
}
```

#### 3. `/src/app/api/session/route.ts`

**Changes:**

- Added `generateExpirationDate` import
- Updated session renewal endpoint to extend `expireAt`
- Added comment: "Renew access token with sliding expiration"

```typescript
data: {
  refresh_token_hash: hashToken(newSession),
  lastUsed: new Date(),
  expireAt: generateExpirationDate(7, "days"), // NEW: Extend session by 7 days
}
```

## How It Works Now

### Session Flow:

1. **User logs in** → Session created with:
   - `expireAt`: 7 days from now
   - `cexp`: 15 minutes from now

2. **User is active (within 15 minutes)** → Access token still valid, no renewal needed

3. **User returns after 15+ minutes** → Access token expired:
   - `useCheckSession` hook detects `cexp` expiration
   - Calls `update()` → Triggers NextAuth JWT callback
   - JWT callback renews session:
     - Creates new `refresh_token_hash`
     - Updates `lastUsed`
     - **Extends `expireAt` by 7 more days** ✅
   - Updates `cexp` to 15 minutes from now

4. **User remains active** → Step 3 repeats every ~15 minutes
   - Session stays alive indefinitely while user is active
   - `expireAt` keeps sliding forward

5. **User inactive for 7 days** → Session expires:
   - `expireAt` date passes
   - Session cleanup can safely delete it
   - User must log in again

## Benefits

✅ **Active users stay logged in** - No forced signouts for active users  
✅ **Inactive sessions expire** - Security preserved (7-day inactivity timeout)  
✅ **Sliding expiration** - Industry-standard pattern  
✅ **No breaking changes** - Existing logic still works  
✅ **Cleanup safe** - Expired sessions still properly cleaned up

## Session Lifecycle

```
Initial Login:
└─ expireAt: Now + 7 days
   └─ cexp: Now + 15 minutes

After 16 minutes (first renewal):
└─ expireAt: Now + 7 days (EXTENDED) ✅
   └─ cexp: Now + 15 minutes

After 30+ days of active use:
└─ expireAt: Always ~7 days ahead ✅
   └─ cexp: Always ~15 minutes ahead

After 7 days inactive:
└─ expireAt: In the past ⚠️
   └─ Session expired, cleanup eligible
```

## Testing Recommendations

1. **Test active user retention:**
   - Log in and verify session works
   - Wait 16+ minutes (past cexp)
   - Trigger any protected action
   - Verify user NOT signed out
   - Check DB: `expireAt` should be updated

2. **Test inactive timeout:**
   - Log in
   - Don't use app for 7+ days
   - Try to access protected route
   - Verify user IS signed out

3. **Test session cleanup:**
   - Create sessions
   - Wait for expiration without activity
   - Run cleanup function
   - Verify expired sessions deleted

## Notes

- The 7-day extension is configurable via `generateExpirationDate(7, "days")`
- The 15-minute access token expiration remains unchanged
- Session cleanup (`cleanupExpiredSessions`) still works correctly
- No changes needed to `useCheckSession` hook - it already handles renewal properly

## Related Files (No changes needed)

- `/src/hooks/useCheckSession.ts` - Already handles renewal via `update()`
- `/src/lib/sessionCleanup.ts` - Already cleans based on `expireAt`
- `/src/lib/session.ts` - `verifySessionInDB` checks `expireAt` correctly
