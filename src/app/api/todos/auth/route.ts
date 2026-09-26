import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  createSession,
  destroySession,
  validateSession,
  verifyPassword,
} from '@/app/smart-goal-60/todo/lib/auth';
import {
  checkRateLimit,
  getClientIdentifier,
} from '@/app/smart-goal-60/todo/lib/rate-limit';

export const dynamic = 'force-dynamic';

const LOGIN_LIMIT = 5;

function applySessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
}

function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

function rateLimitHeaders(result: {
  remaining: number;
  resetAt: number;
}): Record<string, string> {
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((result.resetAt - Date.now()) / 1000)
  );
  return {
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
    'Retry-After': String(retryAfterSeconds),
  };
}

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request.headers);
  const limit = await checkRateLimit(identifier, LOGIN_LIMIT);
  const headers = rateLimitHeaders(limit);

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers }
    );
  }

  const password =
    body !== null && typeof body === 'object' && 'password' in body
      ? (body as { password: unknown }).password
      : undefined;

  const valid = await verifyPassword(password);

  if (!valid) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401, headers }
    );
  }

  try {
    const session = await createSession();
    const response = NextResponse.json(
      { authenticated: true, expiresAt: session.expiresAt },
      { headers }
    );
    applySessionCookie(response, session.token);
    return response;
  } catch {
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503, headers }
    );
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await validateSession(token);

  if (session === null) {
    return NextResponse.json(
      { authenticated: false, expiresAt: null },
      { status: 200 }
    );
  }

  return NextResponse.json(
    { authenticated: true, expiresAt: session.expiresAt },
    { status: 200 }
  );
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  await destroySession(token);

  const response = NextResponse.json(
    { authenticated: false, expiresAt: null },
    { status: 200 }
  );
  clearSessionCookie(response);
  return response;
}