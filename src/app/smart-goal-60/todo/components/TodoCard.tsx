'use client';

import { useCallback, useMemo, useState } from 'react';
import { StarRating } from './StarRating';
import styles from '../page.module.css';
import type {
  Priority,
  Todo,
  TodoCategory,
  UpdateTodoInput,
} from '../types';

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 2000;

const CATEGORIES: readonly TodoCategory[] = [
  'personal',
  'work',
  'shopping',
  'health',
  'finance',
  'other',
];

const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

type Draft = {
  title: string;
  description: string;
  priority: Priority;
  category: TodoCategory;
  dueDate: string | null;
};

type ValidationResult = { ok: true } | { ok: false; error: string };

function validateDraft(draft: Draft): ValidationResult {
  const title = draft.title.trim();
  if (title.length === 0) {
    return { ok: false, error: 'Title is required' };
  }
  if (title.length > MAX_TITLE) {
    return { ok: false, error: `Title must be at most ${MAX_TITLE} characters` };
  }
  const description = draft.description.trim();
  if (description.length === 0) {
    return { ok: false, error: 'Description is required' };
  }
  if (description.length > MAX_DESCRIPTION) {
    return {
      ok: false,
      error: `Description must be at most ${MAX_DESCRIPTION} characters`,
    };
  }
  if (!Number.isInteger(draft.priority) || draft.priority < 1 || draft.priority > 5) {
    return { ok: false, error: 'Priority must be between 1 and 5' };
  }
  if (!CATEGORIES.includes(draft.category)) {
    return { ok: false, error: 'Category is invalid' };
  }
  if (draft.dueDate !== null && Number.isNaN(Date.parse(draft.dueDate))) {
    return { ok: false, error: 'Due date is not a valid date' };
  }
  return { ok: true };
}

function formatMeta(todo: Todo): string {
  const parts: string[] = [todo.category];
  if (todo.dueDate !== null) {
    const parsed = new Date(todo.dueDate);
    if (!Number.isNaN(parsed.getTime())) {
      parts.push(`Due ${DATE_FORMATTER.format(parsed)}`);
    }
  }
  if (todo.isPrivate) {
    parts.push('Private');
  }
  return parts.join(' · ');
}

export interface TodoCardProps {
  todo: Todo;
  editing: boolean;
  busy: boolean;
  pendingAction: 'update' | 'delete' | null;
  onEnterEdit: (id: string) => void;
  onExitEdit: () => void;
  onUpdate: (id: string, updates: UpdateTodoInput) => Promise<Todo | null>;
  onToggleComplete: (id: string, completed: boolean) => Promise<void>;
  onRequestDelete: (id: string, title: string) => void;
}

export function TodoCard({
  todo,
  editing,
  busy,
  pendingAction,
  onEnterEdit,
  onExitEdit,
  onUpdate,
  onToggleComplete,
  onRequestDelete,
}: TodoCardProps) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const isMutating = pendingAction !== null && busy;
  const actionsDisabled = busy;

  const startEdit = useCallback(() => {
    setDraft({
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      category: todo.category,
      dueDate: todo.dueDate,
    });
    setLocalError(null);
    onEnterEdit(todo.id);
  }, [todo, onEnterEdit]);

  const cancelEdit = useCallback(() => {
    if (isMutating) return;
    setDraft(null);
    setLocalError(null);
    onExitEdit();
  }, [isMutating, onExitEdit]);

  const updateDraft = useCallback((updates: Partial<Draft>) => {
    setDraft((prev) => (prev === null ? prev : { ...prev, ...updates }));
    setLocalError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (draft === null || isMutating) return;

    const validation = validateDraft(draft);
    if (!validation.ok) {
      setLocalError(validation.error);
      return;
    }

    const patch: UpdateTodoInput = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      priority: draft.priority,
      category: draft.category,
      dueDate: draft.dueDate,
    };

    const updated = await onUpdate(todo.id, patch);
    if (updated === null) {
      setLocalError('Failed to save changes');
      return;
    }

    setDraft(null);
    setLocalError(null);
    onExitEdit();
  }, [draft, isMutating, onUpdate, todo.id, onExitEdit]);

  const handleToggle = useCallback(() => {
    if (actionsDisabled) return;
    void onToggleComplete(todo.id, !todo.completed);
  }, [actionsDisabled, onToggleComplete, todo.id, todo.completed]);

  const handleDelete = useCallback(() => {
    if (actionsDisabled) return;
    onRequestDelete(todo.id, todo.title);
  }, [actionsDisabled, onRequestDelete, todo.id, todo.title]);

  const metaText = useMemo(() => formatMeta(todo), [todo]);

  if (editing && draft !== null) {
    return (
      <article className={styles.card}>
        {todo.imageUrl !== null ? (
          <img
            src={todo.imageUrl}
            alt=""
            className={styles.cardImage}
            loading="lazy"
          />
        ) : (
          <div className={styles.cardImagePlaceholder}>No image</div>
        )}

        <div className={styles.cardBody}>
          <div className={styles.editForm}>
            <input
              type="text"
              className={styles.input}
              value={draft.title}
              onChange={(e) => updateDraft({ title: e.target.value })}
              placeholder="Title"
              maxLength={MAX_TITLE}
              disabled={isMutating}
              aria-label="Title"
            />

            <textarea
              className={styles.textarea}
              value={draft.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
              placeholder="Description"
              maxLength={MAX_DESCRIPTION}
              rows={3}
              disabled={isMutating}
              aria-label="Description"
            />

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Category</label>
                <select
                  className={styles.input}
                  value={draft.category}
                  onChange={(e) =>
                    updateDraft({ category: e.target.value as TodoCategory })
                  }
                  disabled={isMutating}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Due date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={draft.dueDate ?? ''}
                  onChange={(e) =>
                    updateDraft({ dueDate: e.target.value || null })
                  }
                  disabled={isMutating}
                />
              </div>
            </div>

            <div className={styles.formField}>
              <span className={styles.formLabel}>Priority</span>
              <StarRating
                value={draft.priority}
                onChange={(value) => {
                  if (value >= 1 && value <= 5) {
                    updateDraft({ priority: value as Priority });
                  }
                }}
                disabled={isMutating}
              />
            </div>

            {localError !== null && (
              <p className={styles.fieldError} role="alert">
                {localError}
              </p>
            )}

            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={handleSave}
                disabled={isMutating}
              >
                {isMutating && pendingAction === 'update' ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                className={styles.btn}
                onClick={cancelEdit}
                disabled={isMutating}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={`${styles.card} ${todo.completed ? styles.cardDone : ''}`}
    >
      {todo.imageUrl !== null ? (
        <img
          src={todo.imageUrl}
          alt=""
          className={styles.cardImage}
          loading="lazy"
        />
      ) : (
        <div className={styles.cardImagePlaceholder}>No image</div>
      )}

      <div className={styles.cardBody}>
        <h3
          className={`${styles.cardTitle} ${
            todo.completed ? styles.cardTitleDone : ''
          }`}
        >
          {todo.title}
        </h3>

        <p className={styles.cardDescription}>{todo.description}</p>

        <div className={styles.cardMeta}>
          <span className={styles.cardMetaTag}>{metaText}</span>
          <StarRating
            value={todo.priority}
            onChange={() => {}}
            readOnly
            showLabel
          />
        </div>

        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.btn}
            onClick={startEdit}
            disabled={actionsDisabled}
          >
            Edit
          </button>
          <button
            type="button"
            className={styles.btn}
            onClick={handleToggle}
            disabled={actionsDisabled}
          >
            {todo.completed ? 'Reopen' : 'Complete'}
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={handleDelete}
            disabled={actionsDisabled}
          >
            {isMutating && pendingAction === 'delete' ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </article>
  );
}