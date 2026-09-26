'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { StarRating } from './StarRating';
import { ImageUpload } from './ImageUpload';
import styles from '../page.module.css';
import type {
  Priority,
  StepperStep,
  StepperStepId,
  TodoCategory,
  TodoDraft,
} from '../types';

const STORAGE_KEY = 'sg60:todo:draft';

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

const DEFAULT_DRAFT: TodoDraft = {
  title: '',
  description: '',
  priority: 3,
  category: 'personal',
  dueDate: null,
  imageUrl: null,
  isPrivate: false,
};

const STEPS: readonly StepperStep[] = [
  {
    id: 'basics',
    title: 'Basics',
    description: 'Give the todo a clear title, description, and category.',
  },
  {
    id: 'priority',
    title: 'Priority',
    description: 'Rate the importance and choose whether to protect it.',
  },
  {
    id: 'image',
    title: 'Image',
    description: 'Attach an optional image to help recognise this todo.',
  },
  {
    id: 'review',
    title: 'Review',
    description: 'Confirm the details before creating the todo.',
  },
];

type ValidationResult = { ok: true } | { ok: false; error: string };

function validateStep(stepId: StepperStepId, draft: TodoDraft): ValidationResult {
  if (stepId === 'basics') {
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
    if (draft.dueDate !== null && Number.isNaN(Date.parse(draft.dueDate))) {
      return { ok: false, error: 'Due date is not a valid date' };
    }
  }

  if (stepId === 'priority') {
    if (!Number.isInteger(draft.priority) || draft.priority < 1 || draft.priority > 5) {
      return { ok: false, error: 'Priority must be between 1 and 5' };
    }
  }

  return { ok: true };
}

export interface StepperProps {
  onSubmit: (draft: TodoDraft) => Promise<boolean>;
  onCancel?: () => void;
  storageKey?: string;
}

export function Stepper({
  onSubmit,
  onCancel,
  storageKey = STORAGE_KEY,
}: StepperProps) {
  const [draft, setDraft] = useLocalStorage<TodoDraft>(storageKey, DEFAULT_DRAFT);
  const [activeStep, setActiveStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const baseId = useId();

  const currentStep = STEPS[activeStep];
  const isLastStep = activeStep === STEPS.length - 1;

  const stepValidation = useMemo(
    () => validateStep(currentStep.id, draft),
    [currentStep.id, draft]
  );

  const updateDraft = useCallback(
    (updates: Partial<TodoDraft>) => {
      setDraft((prev) => ({ ...prev, ...updates }));
      setValidationError(null);
    },
    [setDraft]
  );

  const clearDraft = useCallback(() => {
    setDraft(DEFAULT_DRAFT);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // localStorage unavailable; state reset above is sufficient.
    }
  }, [setDraft, storageKey]);

  const goNext = useCallback(() => {
    if (!stepValidation.ok) {
      setValidationError(stepValidation.error);
      return;
    }
    setValidationError(null);
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [stepValidation]);

  const goPrev = useCallback(() => {
    setValidationError(null);
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleFinish = useCallback(async () => {
    const finalCheck = validateStep('basics', draft);
    if (!finalCheck.ok) {
      setValidationError(finalCheck.error);
      setActiveStep(0);
      return;
    }

    setSubmitting(true);
    setValidationError(null);
    try {
      const ok = await onSubmit(draft);
      if (ok) {
        clearDraft();
        setActiveStep(0);
      }
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Failed to create todo'
      );
    } finally {
      setSubmitting(false);
    }
  }, [draft, onSubmit, clearDraft]);

  const renderStep = () => {
    if (currentStep.id === 'basics') {
      return (
        <div className={styles.form}>
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
                value={draft.title}
                onChange={(e) => updateDraft({ title: e.target.value })}
                placeholder="What needs to be done?"
                maxLength={MAX_TITLE}
                disabled={submitting}
              />
            </div>
          </div>

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
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                placeholder="Add details so future you remembers what this is."
                maxLength={MAX_DESCRIPTION}
                rows={4}
                disabled={submitting}
              />
            </div>
          </div>

          <div className={styles.formRow}>
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
                value={draft.category}
                onChange={(e) =>
                  updateDraft({ category: e.target.value as TodoCategory })
                }
                disabled={submitting}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

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
                value={draft.dueDate ?? ''}
                onChange={(e) =>
                  updateDraft({ dueDate: e.target.value || null })
                }
                disabled={submitting}
              />
            </div>
          </div>
        </div>
      );
    }

    if (currentStep.id === 'priority') {
      return (
        <div className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <span className={styles.formLabel}>Priority</span>
              <StarRating
                value={draft.priority}
                onChange={(value) => {
                  if (value >= 1 && value <= 5) {
                    updateDraft({ priority: value as Priority });
                  }
                }}
                disabled={submitting}
                large
                showLabel
              />
            </div>
          </div>

          <div className={styles.checkboxRow}>
            <input
              id={`${baseId}-isPrivate`}
              type="checkbox"
              className={styles.checkbox}
              checked={draft.isPrivate}
              onChange={(e) => updateDraft({ isPrivate: e.target.checked })}
              disabled={submitting}
            />
            <label htmlFor={`${baseId}-isPrivate`}>
              Mark as private (requires password to unlock)
            </label>
          </div>
        </div>
      );
    }

    if (currentStep.id === 'image') {
      return (
        <div className={styles.form}>
          <ImageUpload
            value={draft.imageUrl}
            onChange={(url) => updateDraft({ imageUrl: url })}
            disabled={submitting}
          />
        </div>
      );
    }

    return (
      <div className={styles.form}>
        <ul className={styles.reviewList}>
          <li>
            <span>Title</span>
            <span>{draft.title || '—'}</span>
          </li>
          <li>
            <span>Description</span>
            <span>{draft.description || '—'}</span>
          </li>
          <li>
            <span>Category</span>
            <span>{draft.category}</span>
          </li>
          <li>
            <span>Priority</span>
            <span>{draft.priority} / 5</span>
          </li>
          <li>
            <span>Due date</span>
            <span>{draft.dueDate ?? 'Not set'}</span>
          </li>
          <li>
            <span>Image</span>
            <span>{draft.imageUrl ? 'Attached' : 'None'}</span>
          </li>
          <li>
            <span>Private</span>
            <span>{draft.isPrivate ? 'Yes' : 'No'}</span>
          </li>
        </ul>
      </div>
    );
  };

  return (
    <div>
      <div className={styles.stepperProgress}>
        {STEPS.map((step, idx) => (
          <div key={step.id} className={styles.stepperStepWrapper}>
            <div
              className={[
                styles.stepperDot,
                idx <= activeStep ? styles.stepperDotActive : '',
                idx < activeStep ? styles.stepperDotDone : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {idx + 1}
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={[
                  styles.stepperLine,
                  idx < activeStep ? styles.stepperLineDone : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </div>

      <div className={styles.stepperContent}>
        <h3 className={styles.stepperTitle}>{currentStep.title}</h3>
        <p className={styles.stepperDescription}>{currentStep.description}</p>

        {renderStep()}

        {validationError !== null && (
          <p className={styles.fieldError} role="alert">
            {validationError}
          </p>
        )}
      </div>

      <div className={styles.stepperFooter}>
        {onCancel !== undefined && (
          <button
            type="button"
            className={styles.btn}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        )}

        <button
          type="button"
          className={styles.btn}
          onClick={goPrev}
          disabled={activeStep === 0 || submitting}
        >
          ← Previous
        </button>

        <span className={styles.stepperCounter}>
          Step {activeStep + 1} of {STEPS.length}
        </span>

        {isLastStep ? (
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleFinish}
            disabled={submitting}
          >
            {submitting ? 'Creating…' : 'Create Todo'}
          </button>
        ) : (
          <button
            type="button"
            className={styles.btn}
            onClick={goNext}
            disabled={!stepValidation.ok || submitting}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}