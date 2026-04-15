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
