import { useState, type FormEvent } from 'react';
import { login } from '../../../api/client';
import { useAuth } from '../../../api/authStore';

export function LoginPage() {
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

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
        width: '360px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <h1 style={{
          color: 'var(--text-primary, #f1f1f1)',
          fontSize: '24px',
          fontWeight: 600,
          textAlign: 'center',
          margin: 0,
        }}>
          Asana Clone
        </h1>
        <p style={{
          color: 'var(--text-secondary, #a2a0a2)',
          fontSize: '14px',
          textAlign: 'center',
          margin: 0,
        }}>
          Sign in to continue
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

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          autoFocus
          style={{
            background: 'var(--bg-input, #353638)',
            border: '1px solid transparent',
            borderRadius: '6px',
            padding: '10px 12px',
            color: 'var(--text-primary, #f1f1f1)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            background: 'var(--bg-input, #353638)',
            border: '1px solid transparent',
            borderRadius: '6px',
            padding: '10px 12px',
            color: 'var(--text-primary, #f1f1f1)',
            fontSize: '14px',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          disabled={loading || !username}
          style={{
            background: 'var(--color-primary, #4573d2)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            padding: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading || !username ? 0.6 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        <div style={{
          color: 'var(--text-placeholder, #6d6e6f)',
          fontSize: '12px',
          textAlign: 'center',
        }}>
          Try: admin / admin
        </div>
      </form>
    </div>
  );
}
