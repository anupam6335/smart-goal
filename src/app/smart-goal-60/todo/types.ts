export type Priority = 1 | 2 | 3 | 4 | 5;

export type TodoCategory =
  | 'personal'
  | 'work'
  | 'shopping'
  | 'health'
  | 'finance'
  | 'other';

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  category: TodoCategory;
  dueDate: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
  description: string;
  priority: Priority;
  category: TodoCategory;
  dueDate: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
}

export type UpdateTodoInput = Partial<CreateTodoInput> & {
  completed?: boolean;
};

export type ApiSource = 'redis' | 'database' | 'external';

export interface ApiResponse<T> {
  data: T;
  cached: boolean;
  source: ApiSource;
  responseTimeMs: number;
  count: number;
  error?: string;
}

export interface AuthSession {
  token: string;
  expiresAt: number;
}

export interface AuthResponse {
  authenticated: boolean;
  expiresAt: number | null;
}

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

export type AccordionGroupKey = 'active' | 'completed' | 'private';

export interface TodoGroup {
  key: AccordionGroupKey;
  label: string;
  todos: Todo[];
  locked: boolean;
}

export type StepperStepId = 'basics' | 'priority' | 'image' | 'review';

export interface StepperStep {
  id: StepperStepId;
  title: string;
  description: string;
}

export interface TodoDraft {
  title: string;
  description: string;
  priority: Priority;
  category: TodoCategory;
  dueDate: string | null;
  imageUrl: string | null;
  isPrivate: boolean;
}

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}