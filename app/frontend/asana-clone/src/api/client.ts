/**
 * Unified API client — all data operations go through POST /step.
 * This ensures every operation works via BOTH the UI and the tool server API.
 */

const BASE_URL = '';  // Same origin, proxied by Vite in dev

export interface StepResponse<T = unknown> {
  observation: {
    is_error: boolean;
    text: string;
    structured_content: T | null;
  };
  reward: null;
  done: boolean;
}

export async function callTool<T = unknown>(
  toolName: string,
  parameters: Record<string, unknown> = {},
): Promise<StepResponse<T>> {
  const res = await fetch(`${BASE_URL}/step`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ action: { tool_name: toolName, parameters } }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

/** Extract the structured_content from a step response, throwing on error. */
export function unwrap<T>(response: StepResponse<T>): T {
  if (response.observation.is_error) {
    throw new Error(response.observation.text);
  }
  return response.observation.structured_content as T;
}

// Auth helpers

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: 'Login failed' }));
    throw new Error(data.error || 'Login failed');
  }
  return res.json();
}

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

export async function logout(): Promise<void> {
  await fetch(`${BASE_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null;
  }
}
