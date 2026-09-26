import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  deleteTodo,
  getTodoById,
  updateTodo,
} from '@/app/smart-goal-60/todo/lib/todo-db';
import {
  CACHE_KEYS,
  CACHE_TTL,
  del,
  get,
  set,
} from '@/app/smart-goal-60/todo/lib/redis';
import {
  checkRateLimit,
  getClientIdentifier,
} from '@/app/smart-goal-60/todo/lib/rate-limit';
import {
  SESSION_COOKIE_NAME,
  validateSession,
} from '@/app/smart-goal-60/todo/lib/auth';
import type {
  ApiResponse,
  Priority,
  Todo,
  TodoCategory,
  UpdateTodoInput,
} from '@/app/smart-goal-60/todo/types';

export const dynamic = 'force-dynamic';

const MUTATION_LIMIT = 30;
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

type UpdateParseResult =
  | { ok: true; value: UpdateTodoInput }
  | { ok: false; error: string };

function parseUpdateInput(body: unknown): UpdateParseResult {
  if (body === null || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object' };
  }

  const raw = body as Record<string, unknown>;
  const value: UpdateTodoInput = {};

  if (raw.title !== undefined) {
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
    value.title = title;
  }

  if (raw.description !== undefined) {
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
    value.description = description;
  }

  if (raw.priority !== undefined) {
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
    value.priority = raw.priority as Priority;
  }

  if (raw.category !== undefined) {
    if (
      typeof raw.category !== 'string' ||
      !VALID_CATEGORIES.includes(raw.category as TodoCategory)
    ) {
      return {
        ok: false,
        error: `Field "category" must be one of: ${VALID_CATEGORIES.join(', ')}`,
      };
    }
    value.category = raw.category as TodoCategory;
  }

  if (raw.dueDate !== undefined) {
    if (raw.dueDate === null) {
      value.dueDate = null;
    } else if (typeof raw.dueDate === 'string') {
      if (Number.isNaN(Date.parse(raw.dueDate))) {
        return {
          ok: false,
          error: 'Field "dueDate" must be a valid date string or null',
        };
      }
      value.dueDate = raw.dueDate;
    } else {
      return { ok: false, error: 'Field "dueDate" must be a string or null' };
    }
  }

  if (raw.imageUrl !== undefined) {
    if (raw.imageUrl === null) {
      value.imageUrl = null;
    } else if (typeof raw.imageUrl === 'string' && raw.imageUrl.length > 0) {
      value.imageUrl = raw.imageUrl;
    } else {
      return {
        ok: false,
        error: 'Field "imageUrl" must be a non-empty string or null',
      };
    }
  }

  if (raw.isPrivate !== undefined) {
    if (typeof raw.isPrivate !== 'boolean') {
      return { ok: false, error: 'Field "isPrivate" must be a boolean' };
    }
    value.isPrivate = raw.isPrivate;
  }

  if (raw.completed !== undefined) {
    if (typeof raw.completed !== 'boolean') {
      return { ok: false, error: 'Field "completed" must be a boolean' };
    }
    value.completed = raw.completed;
  }

  if (Object.keys(value).length === 0) {
    return { ok: false, error: 'No updatable fields provided' };
  }

  return { ok: true, value };
}

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await validateSession(token);
  return session !== null;
}

function errorPayload(
  responseTimeMs: number,
  message: string
): ApiResponse<Todo> {
  return {
    data: {} as Todo,
    cached: false,
    source: 'database',
    responseTimeMs,
    count: 0,
    error: message,
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Invalid todo id'),
        { status: 400 }
      );
    }

    const cached = await get<Todo>(CACHE_KEYS.todoById(id));
    if (cached !== null) {
      if (cached.isPrivate && !(await isAuthenticated())) {
        return NextResponse.json(
          errorPayload(Date.now() - startTime, 'Authentication required'),
          { status: 401 }
        );
      }
      const responseTimeMs = Date.now() - startTime;
      const payload: ApiResponse<Todo> = {
        data: cached,
        cached: true,
        source: 'redis',
        responseTimeMs,
        count: 1,
      };
      return NextResponse.json(payload);
    }

    const todo = await getTodoById(id);
    if (todo === null) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Todo not found'),
        { status: 404 }
      );
    }

    if (todo.isPrivate && !(await isAuthenticated())) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Authentication required'),
        { status: 401 }
      );
    }

    await set(CACHE_KEYS.todoById(id), todo, CACHE_TTL.todoById);

    const responseTimeMs = Date.now() - startTime;
    const payload: ApiResponse<Todo> = {
      data: todo,
      cached: false,
      source: 'database',
      responseTimeMs,
      count: 1,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      errorPayload(
        responseTimeMs,
        error instanceof Error ? error.message : 'Failed to fetch todo'
      ),
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  const identifier = getClientIdentifier(request.headers);
  const limit = await checkRateLimit(identifier, MUTATION_LIMIT);
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

  try {
    const { id } = await params;
    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Invalid todo id'),
        { status: 400 }
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

    const parsed = parseUpdateInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const existing = await getTodoById(id);
    if (existing === null) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Todo not found'),
        { status: 404 }
      );
    }

    const touchesPrivate =
      existing.isPrivate || parsed.value.isPrivate === true;

    if (touchesPrivate && !(await isAuthenticated())) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Authentication required'),
        { status: 401 }
      );
    }

    const updated = await updateTodo(id, parsed.value);
    if (updated === null) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Todo not found'),
        { status: 404 }
      );
    }

    await set(CACHE_KEYS.todoById(id), updated, CACHE_TTL.todoById);

    const cachedList = await get<Todo[]>(CACHE_KEYS.todoList);
    if (cachedList !== null) {
      const nextList = cachedList.map((item) =>
        item.id === id ? updated : item
      );
      await set(CACHE_KEYS.todoList, nextList, CACHE_TTL.todoList);
    }

    const responseTimeMs = Date.now() - startTime;
    const payload: ApiResponse<Todo> = {
      data: updated,
      cached: false,
      source: 'database',
      responseTimeMs,
      count: 1,
    };
    return NextResponse.json(payload);
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      errorPayload(
        responseTimeMs,
        error instanceof Error ? error.message : 'Failed to update todo'
      ),
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  const identifier = getClientIdentifier(request.headers);
  const limit = await checkRateLimit(identifier, MUTATION_LIMIT);
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

  try {
    const { id } = await params;
    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Invalid todo id'),
        { status: 400 }
      );
    }

    const existing = await getTodoById(id);
    if (existing === null) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Todo not found'),
        { status: 404 }
      );
    }

    if (existing.isPrivate && !(await isAuthenticated())) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Authentication required'),
        { status: 401 }
      );
    }

    const removed = await deleteTodo(id);
    if (!removed) {
      return NextResponse.json(
        errorPayload(Date.now() - startTime, 'Todo not found'),
        { status: 404 }
      );
    }

    await del(CACHE_KEYS.todoById(id));

    const cachedList = await get<Todo[]>(CACHE_KEYS.todoList);
    if (cachedList !== null) {
      const nextList = cachedList.filter((item) => item.id !== id);
      await set(CACHE_KEYS.todoList, nextList, CACHE_TTL.todoList);
    }

    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json({
      data: { id },
      cached: false,
      source: 'database',
      responseTimeMs,
      count: 0,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      errorPayload(
        responseTimeMs,
        error instanceof Error ? error.message : 'Failed to delete todo'
      ),
      { status: 500 }
    );
  }
}