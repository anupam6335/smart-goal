import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  SESSION_COOKIE_NAME,
  changePassword,
  validateSession,
} from '@/app/smart-goal-60/todo/lib/auth';
import {
  checkRateLimit,
  getClientIdentifier,
} from '@/app/smart-goal-60/todo/lib/rate-limit';

export const dynamic = 'force-dynamic';

const CHANGE_LIMIT = 3;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await validateSession(token);

  if (session === null) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  const identifier = getClientIdentifier(request.headers);
  const limit = await checkRateLimit(identifier, CHANGE_LIMIT);

  if (!limit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((limit.resetAt - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': String(Math.floor(limit.resetAt / 1000)),
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const currentPassword =
    body !== null && typeof body === 'object' && 'currentPassword' in body
      ? (body as { currentPassword: unknown }).currentPassword
      : undefined;

  const newPassword =
    body !== null && typeof body === 'object' && 'newPassword' in body
      ? (body as { newPassword: unknown }).newPassword
      : undefined;

  const result = await changePassword(currentPassword, newPassword);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}