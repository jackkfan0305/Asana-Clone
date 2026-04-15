# Auth: Registration & Login Improvement

## Summary

Add user registration to the existing login-only auth flow. Hash passwords with bcrypt (replacing plaintext storage). New users auto-join the default organization. The frontend combines login and registration into a single Asana-styled page with a toggle between modes.

## Decisions

- **Security level:** Solid but simple -- bcrypt hashing, basic validation, no email verification or rate limiting.
- **Organization assignment:** Auto-assign new users to org_001 (default org).
- **UI approach:** Toggle on the existing login page ("Don't have an account? Sign up"), not a separate route.
- **UI style:** Match Asana's auth page aesthetic -- same fonts, colors, spacing, and layout conventions already in the app.

## Backend Changes

### 1. Add bcrypt password hashing (`app/auth.py`)

Add two functions:
- `hash_password(password: str) -> str` -- returns bcrypt hash
- `verify_password(password: str, hashed: str) -> bool` -- verifies against hash

Update `authenticate_user()` to use `verify_password()`. Support legacy plaintext passwords during transition: if the stored hash does not start with `$2b$`, fall back to direct comparison (so existing seed users still work until their passwords are re-hashed).

**Dependency:** Add `bcrypt>=4.0.0` to `requirements.txt`.

### 2. Add registration endpoint (`app/server.py`)

`POST /auth/register`

**Request body:**
```json
{
  "username": "string (min 3 chars, alphanumeric + underscores + dots)",
  "password": "string (min 8 chars)",
  "name": "string (required)",
  "email": "string (valid email format, required)"
}
```

**Behavior:**
1. Validate input (lengths, format, required fields).
2. Check username and email uniqueness (return 409 if taken).
3. Generate user ID: `usr_` + 3-digit zero-padded number (matching existing ID pattern). Query max existing ID to determine next.
4. Hash password with bcrypt.
5. Insert user with role `standard`, organization_id `org_001`.
6. Create session (reuse existing `create_session()`).
7. Return `{token, user}` + set HTTP-only cookie (same as login).

**Error responses:**
- 400: Validation errors (short password, invalid email, missing fields)
- 409: Username or email already taken

### 3. Update seed password hashing

Update `app/seed/` logic to hash seed user passwords with bcrypt so all stored passwords use the same format. The seed JSON files keep plaintext passwords (they're the "input"), but the seeding code hashes them before inserting.

## Database Changes

No schema changes required. The existing `users` table has all needed columns. The `password_hash` column will now store actual bcrypt hashes instead of plaintext strings.

## Frontend Changes

### 4. Refactor LoginPage into combined auth page

Convert `LoginPage.tsx` to support two modes: `login` and `register`.

**Login mode (existing, minor tweaks):**
- Username + password fields
- "Log in" button
- "Don't have an account? Sign up" link below

**Register mode (new):**
- Full name, email, username, password, confirm password fields
- "Sign up" button
- "Already have an account? Log in" link below

**Asana-like styling:**
- Keep the existing CSS variable system (`--bg-content`, `--bg-card`, `--text-primary`, etc.)
- Same card layout: centered card on dark background, 12px border radius, 40px padding
- Same input styling: `--bg-input` background, 6px radius, 14px font
- Same button styling: `--color-primary` background, white text, 600 weight
- Add the Asana gradient dots/circles decorative element at the top of the card (the colored circles Asana uses on their login page)
- Smooth transition between login/register modes
- Client-side validation with inline error messages per field (red text below the field)
- Password match validation on confirm password field

### 5. Update API client (`client.ts`)

Add:
```typescript
export async function register(username: string, password: string, name: string, email: string) {
  // POST /auth/register, return {token, user}
}
```

## What stays the same

- Session management (DB-backed hex tokens, 7-day expiry, HTTP-only cookies)
- All existing routes and auth middleware (`get_current_user`, `require_auth`)
- CORS configuration
- Pydantic schemas for AuthUser
- React auth context / store

## Files to modify

| File | Change |
|------|--------|
| `requirements.txt` | Add `bcrypt>=4.0.0` |
| `app/auth.py` | Add hash/verify functions, update authenticate_user |
| `app/server.py` | Add POST /auth/register endpoint |
| `app/schema.py` | Add RegisterRequest pydantic model |
| `app/seed/seeder.py` (or equivalent) | Hash passwords during seeding |
| `app/frontend/.../auth/LoginPage.tsx` | Add register mode toggle + form |
| `app/frontend/.../api/client.ts` | Add register() function |

## Testing

- Existing login tests should still pass (bcrypt transition is backward-compatible).
- New test: register with valid data, verify user created and session returned.
- New test: register with duplicate username/email, verify 409.
- New test: register with short password, verify 400.
- Frontend: verify toggle between login/register modes, form validation.
