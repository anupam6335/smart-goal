'use client';

import { useCallback, useId } from 'react';
import { StarRating } from './StarRating';
import styles from '../page.module.css';
import type { Priority, TodoCategory, TodoDraft } from '../types';

export const MAX_TITLE = 200;
export const MAX_DESCRIPTION = 2000;

export const CATEGORIES: readonly TodoCategory[] = [
  'personal',
  'work',
  'shopping',
  'health',
  'finance',
  'other',
];

export type TodoFieldKey =
  | 'title'
  | 'description'
  | 'category'
  | 'dueDate'
  | 'priority'
  | 'isPrivate';

export interface TodoFormProps {
  value: TodoDraft;
  onChange: (updates: Partial<TodoDraft>) => void;
  disabled?: boolean;
  readOnly?: boolean;
  variant?: 'full' | 'compact';
  hideFields?: readonly TodoFieldKey[];
  allowPrivate?: boolean;
  categoryOptions?: readonly TodoCategory[];
}

export function TodoForm({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  variant = 'full',
  hideFields = [],
  allowPrivate = true,
  categoryOptions = CATEGORIES,
}: TodoFormProps) {
  const baseId = useId();
  const hidden = new Set<TodoFieldKey>(hideFields);
  const interactable = !disabled && !readOnly;

  const handleTitle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ title: event.target.value });
    },
    [onChange]
  );

  const handleDescription = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ description: event.target.value });
    },
    [onChange]
  );

  const handleCategory = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onChange({ category: event.target.value as TodoCategory });
    },
    [onChange]
  );

  const handleDueDate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ dueDate: event.target.value || null });
    },
    [onChange]
  );

  const handlePriority = useCallback(
    (next: number) => {
      if (next >= 1 && next <= 5) {
        onChange({ priority: next as Priority });
      }
    },
    [onChange]
  );

  const handlePrivate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ isPrivate: event.target.checked });
    },
    [onChange]
  );

  const showTitle = !hidden.has('title');
  const showDescription = !hidden.has('description');
  const showCategory = !hidden.has('category');
  const showDueDate = !hidden.has('dueDate');
  const showPriority = !hidden.has('priority');
  const showPrivate = allowPrivate && !hidden.has('isPrivate');

  const isCompact = variant === 'compact';

  return (
    <div className={styles.form}>
      {showTitle && (
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label
              className={styles.formLabel}
              htmlFor={`${baseId}-title`}
            >
              Title
            </label>
            <input
              id={`${baseId}-title`}
              type="text"
              className={styles.input}
              value={value.title}
              onChange={handleTitle}
              placeholder="What needs to be done?"
              maxLength={MAX_TITLE}
              disabled={!interactable}
            />
          </div>
        </div>
      )}

      {showDescription && (
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label
              className={styles.formLabel}
              htmlFor={`${baseId}-description`}
            >
              Description
            </label>
            <textarea
              id={`${baseId}-description`}
              className={styles.textarea}
              value={value.description}
              onChange={handleDescription}
              placeholder="Add details so future you remembers what this is."
              maxLength={MAX_DESCRIPTION}
              rows={isCompact ? 2 : 4}
              disabled={!interactable}
            />
          </div>
        </div>
      )}

      {(showCategory || showDueDate) && (
        <div className={styles.formRow}>
          {showCategory && (
            <div className={styles.formField}>
              <label
                className={styles.formLabel}
                htmlFor={`${baseId}-category`}
              >
                Category
              </label>
              <select
                id={`${baseId}-category`}
                className={styles.input}
                value={value.category}
                onChange={handleCategory}
                disabled={!interactable}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showDueDate && (
            <div className={styles.formField}>
              <label
                className={styles.formLabel}
                htmlFor={`${baseId}-dueDate`}
              >
                Due date (optional)
              </label>
              <input
                id={`${baseId}-dueDate`}
                type="date"
                className={styles.input}
                value={value.dueDate ?? ''}
                onChange={handleDueDate}
                disabled={!interactable}
              />
            </div>
          )}
        </div>
      )}

      {showPriority && (
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <span className={styles.formLabel}>Priority</span>
            <StarRating
              value={value.priority}
              onChange={handlePriority}
              readOnly={readOnly}
              disabled={disabled}
              large={!isCompact}
              showLabel
            />
          </div>
        </div>
      )}

      {showPrivate && (
        <div className={styles.checkboxRow}>
          <input
            id={`${baseId}-isPrivate`}
            type="checkbox"
            className={styles.checkbox}
            checked={value.isPrivate}
            onChange={handlePrivate}
            disabled={!interactable}
          />
          <label htmlFor={`${baseId}-isPrivate`}>
            Mark as private (requires password to unlock)
          </label>
        </div>
      )}
    </div>
  );
}