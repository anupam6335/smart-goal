import { NextRequest, NextResponse } from 'next/server';
import { createTodo, getAllTodos } from '@/app/smart-goal-60/todo/lib/todo-db';
import { CACHE_KEYS, CACHE_TTL, get, set } from '@/app/smart-goal-60/todo/lib/redis';
import {
  checkRateLimit,
  getClientIdentifier,
} from '@/app/smart-goal-60/todo/lib/rate-limit';
import type {
  ApiResponse,
  CreateTodoInput,
  Todo,
  TodoCategory,
  Priority,
} from '@/app/smart-goal-60/todo/types';

export const dynamic = 'force-dynamic';

const CREATE_LIMIT = 30;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;

const VALID_CATEGORIES: readonly TodoCategory[] = [
  'personal',
  'work',
  'shopping',
  'health',
  'finance',
  'other',
];

type ParseResult =
  | { ok: true; value: CreateTodoInput }
  | { ok: false; error: string };

function parseCreateInput(body: unknown): ParseResult {
  if (body === null || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const raw = body as Record<string, unknown>;

  if (typeof raw.title !== 'string') {
    return { ok: false, error: 'Field "title" must be a string' };
  }
  const title = raw.title.trim();
  if (title.length === 0) {
    return { ok: false, error: 'Field "title" must not be empty' };
  }
  if (title.length > MAX_TITLE_LENGTH) {
    return {
      ok: false,
      error: `Field "title" must be at most ${MAX_TITLE_LENGTH} characters`,
    };
  }

  if (typeof raw.description !== 'string') {
    return { ok: false, error: 'Field "description" must be a string' };
  }
  const description = raw.description.trim();
  if (description.length === 0) {
    return { ok: false, error: 'Field "description" must not be empty' };
  }
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `Field "description" must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
    };
  }

  if (
    typeof raw.priority !== 'number' ||
    !Number.isInteger(raw.priority) ||
    raw.priority < 1 ||
    raw.priority > 5
  ) {
    return {
      ok: false,
      error: 'Field "priority" must be an integer between 1 and 5',
    };
  }
  const priority = raw.priority as Priority;

  if (
    typeof raw.category !== 'string' ||
    !VALID_CATEGORIES.includes(raw.category as TodoCategory)
  ) {
    return {
      ok: false,
      error: `Field "category" must be one of: ${VALID_CATEGORIES.join(', ')}`,
    };
  }
  const category = raw.category as TodoCategory;

  let dueDate: string | null = null;
  if (raw.dueDate !== undefined && raw.dueDate !== null) {
    if (typeof raw.dueDate !== 'string') {
      return { ok: false, error: 'Field "dueDate" must be a string or null' };
    }
    if (Number.isNaN(Date.parse(raw.dueDate))) {
      return { ok: false, error: 'Field "dueDate" must be a valid date string' };
    }
    dueDate = raw.dueDate;
  }

  let imageUrl: string | null = null;
  if (raw.imageUrl !== undefined && raw.imageUrl !== null) {
    if (typeof raw.imageUrl !== 'string' || raw.imageUrl.length === 0) {
      return {
        ok: false,
        error: 'Field "imageUrl" must be a non-empty string or null',
      };
    }
    imageUrl = raw.imageUrl;
  }

  let isPrivate = false;
  if (raw.isPrivate !== undefined) {
    if (typeof raw.isPrivate !== 'boolean') {
      return { ok: false, error: 'Field "isPrivate" must be a boolean' };
    }
    isPrivate = raw.isPrivate;
  }

  return {
    ok: true,
    value: { title, description, priority, category, dueDate, imageUrl, isPrivate },
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const refresh = request.nextUrl.searchParams.get('refresh') === 'true';

  try {
    if (!refresh) {
      const cached = await get<Todo[]>(CACHE_KEYS.todoList);
      if (cached !== null) {
        const responseTimeMs = Date.now() - startTime;
        const payload: ApiResponse<Todo[]> = {
          data: cached,
          cached: true,
          source: 'redis',
          responseTimeMs,
          count: cached.length,
        };
        return NextResponse.json(payload);
      }
    }

    const data = await getAllTodos();
    await set(CACHE_KEYS.todoList, data, CACHE_TTL.todoList);

    const responseTimeMs = Date.now() - startTime;
    const payload: ApiResponse<Todo[]> = {
      data,
      cached: false,
      source: 'database',
      responseTimeMs,
      count: data.length,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const payload: ApiResponse<Todo[]> = {
      data: [],
      cached: false,
      source: 'database',
      responseTimeMs,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch todos',
    };
    return NextResponse.json(payload, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const identifier = getClientIdentifier(request.headers);
  const limit = await checkRateLimit(identifier, CREATE_LIMIT);
  if (!limit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((limit.resetAt - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
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
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const parsed = parseCreateInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    const created = await createTodo(parsed.value);

    const cached = await get<Todo[]>(CACHE_KEYS.todoList);
    const nextList = cached === null ? [created] : [...cached, created];
    await set(CACHE_KEYS.todoList, nextList, CACHE_TTL.todoList);

    const responseTimeMs = Date.now() - startTime;
    const payload: ApiResponse<Todo> = {
      data: created,
      cached: false,
      source: 'database',
      responseTimeMs,
      count: nextList.length,
    };
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const payload: ApiResponse<Todo> = {
      data: {} as Todo,
      cached: false,
      source: 'database',
      responseTimeMs,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to create todo',
    };
    return NextResponse.json(payload, { status: 500 });
  }
}