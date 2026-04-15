# Auth Registration & Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add user registration with bcrypt password hashing to the existing login-only auth flow.

**Architecture:** Add bcrypt hashing to `app/auth.py`, a `POST /auth/register` endpoint to `app/server.py`, a `register()` function to the frontend API client, and convert `LoginPage.tsx` into a combined login/register page with an Asana-like UI. Seed data will hash passwords on insert.

**Tech Stack:** Python/FastAPI, bcrypt, SQLAlchemy, React/TypeScript, Vite

---

### Task 1: Add bcrypt password hashing to backend

**Files:**
- Modify: `requirements.txt`
- Modify: `app/auth.py`

- [ ] **Step 1: Add bcrypt dependency**

In `requirements.txt`, add a new line at the end:

```
bcrypt>=4.0.0
```

Then install it:

```bash
cd /Users/jackfan/conductor/workspaces/asana-clone-v2/krakow && pip install bcrypt>=4.0.0
```

- [ ] **Step 2: Add hash_password and verify_password functions to auth.py**

Add these two functions after the existing imports in `app/auth.py` (after line 8, before `create_session`):

```python
import bcrypt


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, stored_hash: str) -> bool:
    """Verify a password against a stored hash. Supports both bcrypt and legacy plaintext."""
    if stored_hash.startswith("$2b$") or stored_hash.startswith("$2a$"):
        return bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8"))
    # Legacy plaintext fallback for existing seed data
    return password == stored_hash
```

- [ ] **Step 3: Update authenticate_user to use verify_password**

Replace the `authenticate_user` function (lines 50-59 in `app/auth.py`) with:

```python
def authenticate_user(db: DBSession, username: str, password: str) -> User | None:
    """Check username/password, return user or None."""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    return user
```

- [ ] **Step 4: Run existing auth tests to verify backward compatibility**

```bash
cd /Users/jackfan/conductor/workspaces/asana-clone-v2/krakow && python -m pytest app/tests/test_auth.py -v
```

Expected: All 5 existing tests pass (plaintext fallback handles existing test data).

- [ ] **Step 5: Commit**

```bash
git add requirements.txt app/auth.py
git commit -m "feat: add bcrypt password hashing with legacy plaintext fallback"
```

---

### Task 2: Add registration endpoint

**Files:**
- Modify: `app/schema.py` (add RegisterRequest)
- Modify: `app/server.py` (add POST /auth/register)

- [ ] **Step 1: Add RegisterRequest schema to schema.py**

Add after the existing `# Module 1: Users & Auth` section (after line 33 in `app/schema.py`):

```python
class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str
```

- [ ] **Step 2: Add the register endpoint to server.py**

First, update the imports at the top of `server.py`. Add `hash_password` to the auth imports (line 19-25):

```python
from auth import (
    authenticate_user,
    create_session,
    delete_session,
    get_current_user,
    get_session_token,
    hash_password,
)
```

Add a new import for the User and Organization models after the existing imports:

```python
from models import User, Organization
```

Then add the register endpoint after the login endpoint (after line 208 in `server.py`):

```python
class RegisterRequest(BaseModel):
    username: str
    password: str
    name: str
    email: str


@app.post("/auth/register")
def register(req: RegisterRequest, db: DBSession = Depends(get_db)):
    # Validate input
    errors = []
    if len(req.username) < 3:
        errors.append("Username must be at least 3 characters")
    if not all(c.isalnum() or c in "._" for c in req.username):
        errors.append("Username can only contain letters, numbers, dots, and underscores")
    if len(req.password) < 8:
        errors.append("Password must be at least 8 characters")
    if not req.name.strip():
        errors.append("Name is required")
    if not req.email or "@" not in req.email:
        errors.append("Valid email is required")
    if errors:
        return JSONResponse(status_code=400, content={"error": errors[0]})

    # Check uniqueness
    if db.query(User).filter(User.username == req.username).first():
        return JSONResponse(status_code=409, content={"error": "Username already taken"})
    if db.query(User).filter(User.email == req.email).first():
        return JSONResponse(status_code=409, content={"error": "Email already taken"})

    # Generate next user ID
    from sqlalchemy import func as sa_func
    max_id = db.query(sa_func.max(User.id)).scalar()
    if max_id and max_id.startswith("usr_"):
        next_num = int(max_id.split("_")[1]) + 1
    else:
        next_num = 1
    user_id = f"usr_{next_num:03d}"

    # Create user
    user = User(
        id=user_id,
        username=req.username,
        password_hash=hash_password(req.password),
        name=req.name.strip(),
        email=req.email.strip().lower(),
        role="standard",
        organization_id="org_001",
    )
    db.add(user)
    db.commit()

    # Auto-login: create session
    token = create_session(db, user.id)
    response = JSONResponse(content={
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "avatar_url": user.avatar_url,
        },
    })
    response.set_cookie("session_token", token, httponly=True, samesite="lax", max_age=7 * 24 * 3600)
    return response
```

- [ ] **Step 3: Run existing tests to make sure nothing broke**

```bash
cd /Users/jackfan/conductor/workspaces/asana-clone-v2/krakow && python -m pytest app/tests/test_auth.py -v
```

Expected: All existing tests still pass.

- [ ] **Step 4: Commit**

```bash
git add app/server.py app/schema.py
git commit -m "feat: add POST /auth/register endpoint with validation"
```

---

### Task 3: Write registration tests

**Files:**
- Modify: `app/tests/test_auth.py`

- [ ] **Step 1: Add registration tests to test_auth.py**

Append these tests to the end of `app/tests/test_auth.py`:

```python
def test_register_success(client, db_session):
    from models import Organization
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.commit()

    resp = client.post("/auth/register", json={
        "username": "newuser",
        "password": "securepass123",
        "name": "New User",
        "email": "new@example.com",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "token" in data
    assert data["token"].startswith("sess_")
    assert data["user"]["username"] == "newuser"
    assert data["user"]["name"] == "New User"
    assert data["user"]["email"] == "new@example.com"
    assert data["user"]["role"] == "standard"


def test_register_duplicate_username(client, db_session):
    from models import Organization, User
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="taken", password_hash="x", name="X", email="x@x.com", role="standard", organization_id="org_001"))
    db_session.commit()

    resp = client.post("/auth/register", json={
        "username": "taken",
        "password": "securepass123",
        "name": "Another",
        "email": "another@example.com",
    })
    assert resp.status_code == 409
    assert "Username already taken" in resp.json()["error"]


def test_register_duplicate_email(client, db_session):
    from models import Organization, User
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.add(User(id="usr_001", username="existing", password_hash="x", name="X", email="taken@x.com", role="standard", organization_id="org_001"))
    db_session.commit()

    resp = client.post("/auth/register", json={
        "username": "newuser",
        "password": "securepass123",
        "name": "New",
        "email": "taken@x.com",
    })
    assert resp.status_code == 409
    assert "Email already taken" in resp.json()["error"]


def test_register_short_password(client, db_session):
    from models import Organization
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.commit()

    resp = client.post("/auth/register", json={
        "username": "newuser",
        "password": "short",
        "name": "New User",
        "email": "new@example.com",
    })
    assert resp.status_code == 400
    assert "Password must be at least 8 characters" in resp.json()["error"]


def test_register_short_username(client, db_session):
    from models import Organization
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.commit()

    resp = client.post("/auth/register", json={
        "username": "ab",
        "password": "securepass123",
        "name": "New User",
        "email": "new@example.com",
    })
    assert resp.status_code == 400
    assert "Username must be at least 3 characters" in resp.json()["error"]


def test_register_invalid_email(client, db_session):
    from models import Organization
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.commit()

    resp = client.post("/auth/register", json={
        "username": "newuser",
        "password": "securepass123",
        "name": "New User",
        "email": "notanemail",
    })
    assert resp.status_code == 400
    assert "Valid email is required" in resp.json()["error"]


def test_register_then_login_with_bcrypt(client, db_session):
    """Verify that a registered user can log in (bcrypt hash is stored and verified)."""
    from models import Organization
    db_session.add(Organization(id="org_001", name="Acme"))
    db_session.commit()

    # Register
    client.post("/auth/register", json={
        "username": "bcryptuser",
        "password": "mypassword123",
        "name": "Bcrypt User",
        "email": "bcrypt@example.com",
    })

    # Login with same credentials
    resp = client.post("/auth/login", json={"username": "bcryptuser", "password": "mypassword123"})
    assert resp.status_code == 200
    assert resp.json()["user"]["username"] == "bcryptuser"

    # Login with wrong password
    resp = client.post("/auth/login", json={"username": "bcryptuser", "password": "wrongpassword"})
    assert resp.status_code == 401
```

- [ ] **Step 2: Run all auth tests**

```bash
cd /Users/jackfan/conductor/workspaces/asana-clone-v2/krakow && python -m pytest app/tests/test_auth.py -v
```

Expected: All 12 tests pass (5 existing + 7 new).

- [ ] **Step 3: Commit**

```bash
git add app/tests/test_auth.py
git commit -m "test: add registration endpoint tests"
```

---

### Task 4: Update seed to hash passwords

**Files:**
- Modify: `app/seed/seed_app.py`

- [ ] **Step 1: Add bcrypt hashing to seed_app.py**

In `app/seed/seed_app.py`, add an import after line 18 (`import models`):

```python
from auth import hash_password
```

Then in the `seed_direct()` function, add password hashing logic inside the record loop. Replace the block at lines 96-108:

```python
            inserted = 0
            for record in records:
                # Filter to only columns that exist in the table
                valid_cols = {c.name for c in table.columns}
                filtered = {k: v for k, v in record.items() if k in valid_cols}
                if not filtered:
                    continue

                # Hash passwords for users table
                if table_name == "users" and "password_hash" in filtered:
                    filtered["password_hash"] = hash_password(filtered["password_hash"])

                try:
                    db.execute(table.insert().values(**filtered))
                    inserted += 1
                except Exception as e:
                    db.rollback()
                    print(f"  ERROR inserting into {table_name}: {e}")
                    # Try to continue with remaining records
                    continue
```

- [ ] **Step 2: Commit**

```bash
git add app/seed/seed_app.py
git commit -m "feat: hash seed user passwords with bcrypt on insert"
```

---

### Task 5: Add register function to frontend API client

**Files:**
- Modify: `app/frontend/asana-clone/src/api/client.ts`

- [ ] **Step 1: Add register function**

Add this after the `login` function (after line 70) in `app/frontend/asana-clone/src/api/client.ts`:

```typescript
export async function register(
  username: string,
  password: string,
  name: string,
  email: string,
): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password, name, email }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Registration failed' }));
    throw new Error(data.error || 'Registration failed');
  }
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add app/frontend/asana-clone/src/api/client.ts
git commit -m "feat: add register() function to frontend API client"
```

---

### Task 6: Convert LoginPage into combined auth page with Asana-like UI

**Files:**
- Modify: `app/frontend/asana-clone/src/components/features/auth/LoginPage.tsx`

- [ ] **Step 1: Rewrite LoginPage.tsx with login/register toggle**

Replace the entire contents of `app/frontend/asana-clone/src/components/features/auth/LoginPage.tsx` with:

```tsx
import { useState, type FormEvent } from 'react';
import { login, register } from '../../../api/client';
import { useAuth } from '../../../api/authStore';

type Mode = 'login' | 'register';

export function LoginPage() {
  const { setUser } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  function switchMode(newMode: Mode) {
    setMode(newMode);
    setError('');
    setFieldErrors({});
  }

  function validateRegister(): boolean {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!email.includes('@')) errors.email = 'Enter a valid email address';
    if (username.length < 3) errors.username = 'Username must be at least 3 characters';
    if (password.length < 8) errors.password = 'Password must be at least 8 characters';
    if (password !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (mode === 'register' && !validateRegister()) return;

    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await login(username, password);
        setUser(data.user);
      } else {
        const data = await register(username, password, name, email);
        setUser(data.user);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `${mode === 'login' ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  }

  const isLoginDisabled = loading || !username;
  const isRegisterDisabled = loading || !username || !password || !name || !email;
  const isDisabled = mode === 'login' ? isLoginDisabled : isRegisterDisabled;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-content, #1e1f21)',
    }}>
      <form onSubmit={handleSubmit} style={{
        background: 'var(--bg-card, #2a2b2d)',
        borderRadius: '12px',
        padding: '40px',
        width: '380px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Decorative Asana-style color dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px',
        }}>
          {['#f06a6a', '#f1bd6c', '#5da283', '#4573d2', '#9b7ddb'].map((color) => (
            <div
              key={color}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: color,
              }}
            />
          ))}
        </div>

        <h1 style={{
          color: 'var(--text-primary, #f1f1f1)',
          fontSize: '24px',
          fontWeight: 600,
          textAlign: 'center',
          margin: 0,
        }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{
          color: 'var(--text-secondary, #a2a0a2)',
          fontSize: '14px',
          textAlign: 'center',
          margin: '0 0 8px 0',
        }}>
          {mode === 'login'
            ? 'Sign in to your Asana Clone account'
            : 'Get started with Asana Clone for free'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(232, 56, 79, 0.15)',
            color: 'var(--color-error, #e8384f)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        {mode === 'register' && (
          <>
            <div>
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                style={inputStyle}
              />
              {fieldErrors.name && <FieldError message={fieldErrors.name} />}
            </div>
            <div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
              />
              {fieldErrors.email && <FieldError message={fieldErrors.email} />}
            </div>
          </>
        )}

        <div>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoFocus={mode === 'login'}
            style={inputStyle}
          />
          {fieldErrors.username && <FieldError message={fieldErrors.username} />}
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
          {fieldErrors.password && <FieldError message={fieldErrors.password} />}
        </div>

        {mode === 'register' && (
          <div>
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              style={inputStyle}
            />
            {fieldErrors.confirmPassword && <FieldError message={fieldErrors.confirmPassword} />}
          </div>
        )}

        <button
          type="submit"
          disabled={isDisabled}
          style={{
            background: 'var(--color-primary, #4573d2)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: isDisabled ? 0.6 : 1,
            marginTop: '4px',
          }}
        >
          {loading
            ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
            : (mode === 'login' ? 'Log in' : 'Sign up')}
        </button>

        <div style={{
          color: 'var(--text-secondary, #a2a0a2)',
          fontSize: '13px',
          textAlign: 'center',
          marginTop: '8px',
        }}>
          {mode === 'login' ? (
            <>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                style={linkButtonStyle}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                style={linkButtonStyle}
              >
                Log in
              </button>
            </>
          )}
        </div>

        {mode === 'login' && (
          <div style={{
            color: 'var(--text-placeholder, #6d6e6f)',
            fontSize: '12px',
            textAlign: 'center',
          }}>
            Try: admin / admin
          </div>
        )}
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg-input, #353638)',
  border: '1px solid transparent',
  borderRadius: '6px',
  padding: '10px 12px',
  color: 'var(--text-primary, #f1f1f1)',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

const linkButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary, #4573d2)',
  cursor: 'pointer',
  fontSize: '13px',
  padding: 0,
  fontWeight: 500,
};

function FieldError({ message }: { message: string }) {
  return (
    <div style={{
      color: 'var(--color-error, #e8384f)',
      fontSize: '12px',
      marginTop: '4px',
      paddingLeft: '2px',
    }}>
      {message}
    </div>
  );
}
```

- [ ] **Step 2: Build the frontend to verify no TypeScript errors**

```bash
cd /Users/jackfan/conductor/workspaces/asana-clone-v2/krakow/app/frontend/asana-clone && npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add app/frontend/asana-clone/src/components/features/auth/LoginPage.tsx
git commit -m "feat: add Asana-styled registration UI with login/register toggle"
```

---

### Task 7: Run full test suite and verify

**Files:** None (verification only)

- [ ] **Step 1: Run all backend tests**

```bash
cd /Users/jackfan/conductor/workspaces/asana-clone-v2/krakow && python -m pytest app/tests/ -v
```

Expected: All tests pass, including the 7 new registration tests.

- [ ] **Step 2: Build frontend**

```bash
cd /Users/jackfan/conductor/workspaces/asana-clone-v2/krakow/app/frontend/asana-clone && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Final commit if any fixups needed**

Only if previous steps required fixes. Otherwise, skip.
