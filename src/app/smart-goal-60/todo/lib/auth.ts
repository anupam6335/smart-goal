import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { CACHE_KEYS, CACHE_TTL, del, get, set } from './redis';
import type { AuthSession } from '../types';

const SESSION_TTL_SECONDS = CACHE_TTL.session;
const PASSWORD_TTL_SECONDS = CACHE_TTL.authPassword;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 100;

export const SESSION_COOKIE_NAME = 'sg60_todo_session';
export const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

async function getConfiguredPassword(): Promise<string | null> {
  const stored = await get<string>(CACHE_KEYS.authPassword);
  if (typeof stored === 'string' && stored.length > 0) {
    return stored;
  }

  const envPassword = process.env.TODO_PASSWORD;
  if (typeof envPassword !== 'string' || envPassword.length === 0) {
    return null;
  }
  return envPassword;
}

function safeCompare(a: string, b: string): boolean {
  const hashA = createHash('sha256').update(a, 'utf8').digest();
  const hashB = createHash('sha256').update(b, 'utf8').digest();
  return timingSafeEqual(hashA, hashB);
}

export async function isAuthConfigured(): Promise<boolean> {
  return (await getConfiguredPassword()) !== null;
}

export async function verifyPassword(password: unknown): Promise<boolean> {
  if (typeof password !== 'string' || password.length === 0) {
    return false;
  }
  const expected = await getConfiguredPassword();
  if (expected === null) {
    return false;
  }
  return safeCompare(password, expected);
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export async function createSession(): Promise<AuthSession> {
  const token = generateToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const session: AuthSession = { token, expiresAt };
  const stored = await set(CACHE_KEYS.session(token), session, SESSION_TTL_SECONDS);
  if (!stored) {
    throw new Error('Failed to persist session');
  }
  return session;
}

export async function validateSession(token: unknown): Promise<AuthSession | null> {
  if (typeof token !== 'string' || token.length === 0) {
    return null;
  }
  const session = await get<AuthSession>(CACHE_KEYS.session(token));
  if (session === null) {
    return null;
  }
  if (
    typeof session.token !== 'string' ||
    typeof session.expiresAt !== 'number' ||
    session.expiresAt <= Date.now()
  ) {
    await del(CACHE_KEYS.session(token));
    return null;
  }
  return session;
}

export async function destroySession(token: unknown): Promise<boolean> {
  if (typeof token !== 'string' || token.length === 0) {
    return false;
  }
  return del(CACHE_KEYS.session(token));
}

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; error: string };

export async function changePassword(
  currentPassword: unknown,
  newPassword: unknown
): Promise<ChangePasswordResult> {
  if (typeof currentPassword !== 'string' || currentPassword.length === 0) {
    return { ok: false, error: 'Current password is required' };
  }

  if (typeof newPassword !== 'string') {
    return { ok: false, error: 'New password is required' };
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    };
  }

  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `New password must be at most ${MAX_PASSWORD_LENGTH} characters`,
    };
  }

  if (newPassword === currentPassword) {
    return {
      ok: false,
      error: 'New password must be different from current password',
    };
  }

  const expected = await getConfiguredPassword();
  if (expected === null) {
    return { ok: false, error: 'Authentication is not configured' };
  }

  if (!safeCompare(currentPassword, expected)) {
    return { ok: false, error: 'Current password is incorrect' };
  }

  const stored = await set(
    CACHE_KEYS.authPassword,
    newPassword,
    PASSWORD_TTL_SECONDS
  );

  if (!stored) {
    return { ok: false, error: 'Failed to save new password' };
  }

  return { ok: true };
}