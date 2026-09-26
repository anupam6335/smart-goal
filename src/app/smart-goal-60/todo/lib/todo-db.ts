import { get as redisGet, set as redisSet } from './redis';
import type { CreateTodoInput, Todo, UpdateTodoInput } from '../types';

const GLOBAL_KEY = Symbol.for('sg60.todo.db');

const DB_KEY = 'sg60:todo:db';
const DB_TTL_SECONDS = 60 * 60 * 24 * 365;

type GlobalWithTodoDb = typeof globalThis & {
  [GLOBAL_KEY]?: Todo[];
};

let hydrationPromise: Promise<Todo[]> | null = null;

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `todo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function seed(): Todo[] {
  const now = new Date().toISOString();
  return [
    {
      id: generateId(),
      title: 'Review smart goal progress',
      description: 'Check the 40% and 60% deliverables before the weekly sync.',
      completed: false,
      priority: 4,
      category: 'work',
      dueDate: null,
      imageUrl: null,
      isPrivate: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Buy groceries',
      description: 'Milk, eggs, bread, coffee beans.',
      completed: false,
      priority: 3,
      category: 'shopping',
      dueDate: null,
      imageUrl: null,
      isPrivate: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Renew gym membership',
      description: 'Quarterly plan, expires end of month.',
      completed: true,
      priority: 2,
      category: 'health',
      dueDate: null,
      imageUrl: null,
      isPrivate: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Personal journal entry',
      description: 'Private reflection for the week.',
      completed: false,
      priority: 3,
      category: 'personal',
      dueDate: null,
      imageUrl: null,
      isPrivate: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

async function hydrate(): Promise<Todo[]> {
  const g = globalThis as GlobalWithTodoDb;

  if (g[GLOBAL_KEY] !== undefined) {
    return g[GLOBAL_KEY]!;
  }

  if (hydrationPromise === null) {
    hydrationPromise = (async () => {
      const stored = await redisGet<Todo[]>(DB_KEY);

      if (stored !== null && Array.isArray(stored)) {
        g[GLOBAL_KEY] = stored;
        return stored;
      }

      const seeded = seed();
      g[GLOBAL_KEY] = seeded;
      await redisSet(DB_KEY, seeded, DB_TTL_SECONDS);
      return seeded;
    })();
  }

  return hydrationPromise;
}

async function persist(store: Todo[]): Promise<void> {
  await redisSet(DB_KEY, store, DB_TTL_SECONDS);
}

export async function getAllTodos(): Promise<Todo[]> {
  const store = await hydrate();
  return [...store];
}

export async function getTodoById(id: string): Promise<Todo | null> {
  const store = await hydrate();
  const todo = store.find((t) => t.id === id);
  return todo ? { ...todo } : null;
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const store = await hydrate();
  const now = new Date().toISOString();
  const todo: Todo = {
    id: generateId(),
    title: input.title.trim(),
    description: input.description.trim(),
    completed: false,
    priority: input.priority,
    category: input.category,
    dueDate: input.dueDate,
    imageUrl: input.imageUrl,
    isPrivate: input.isPrivate,
    createdAt: now,
    updatedAt: now,
  };
  store.push(todo);
  await persist(store);
  return { ...todo };
}

export async function updateTodo(
  id: string,
  updates: UpdateTodoInput
): Promise<Todo | null> {
  const store = await hydrate();
  const index = store.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const current = store[index];
  const next: Todo = {
    ...current,
    ...(updates.title !== undefined ? { title: updates.title.trim() } : {}),
    ...(updates.description !== undefined
      ? { description: updates.description.trim() }
      : {}),
    ...(updates.priority !== undefined ? { priority: updates.priority } : {}),
    ...(updates.category !== undefined ? { category: updates.category } : {}),
    ...(updates.dueDate !== undefined ? { dueDate: updates.dueDate } : {}),
    ...(updates.imageUrl !== undefined ? { imageUrl: updates.imageUrl } : {}),
    ...(updates.isPrivate !== undefined ? { isPrivate: updates.isPrivate } : {}),
    ...(updates.completed !== undefined ? { completed: updates.completed } : {}),
    updatedAt: new Date().toISOString(),
  };

  store[index] = next;
  await persist(store);
  return { ...next };
}

export async function deleteTodo(id: string): Promise<boolean> {
  const store = await hydrate();
  const index = store.findIndex((t) => t.id === id);
  if (index === -1) return false;
  store.splice(index, 1);
  await persist(store);
  return true;
}