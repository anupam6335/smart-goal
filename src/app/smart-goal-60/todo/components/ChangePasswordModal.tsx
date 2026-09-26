'use client';

import { useCallback, useId, useState } from 'react';
import { Modal } from './Modal';
import styles from '../page.module.css';

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 100;

export interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    currentPassword: string,
    newPassword: string
  ) => Promise<{ ok: boolean; error: string | null }>;
  parentLoading: boolean;
}

type ValidationResult = { ok: true } | { ok: false; error: string };

function validate(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
): ValidationResult {
  if (currentPassword.length === 0) {
    return { ok: false, error: 'Current password is required' };
  }
  if (newPassword.length === 0) {
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
  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'Passwords do not match' };
  }
  if (newPassword === currentPassword) {
    return {
      ok: false,
      error: 'New password must be different from current password',
    };
  }
  return { ok: true };
}

export function ChangePasswordModal({
  open,
  onClose,
  onSubmit,
  parentLoading,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseId = useId();

  const busy = submitting || parentLoading;

  const resetAndClose = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async () => {
    if (busy) return;

    const result = validate(currentPassword, newPassword, confirmPassword);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const outcome = await onSubmit(currentPassword, newPassword);
      if (!outcome.ok) {
        setError(outcome.error ?? 'Failed to change password');
        return;
      }
      resetAndClose();
    } finally {
      setSubmitting(false);
    }
  }, [
    busy,
    currentPassword,
    newPassword,
    confirmPassword,
    onSubmit,
    resetAndClose,
  ]);

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : resetAndClose}
      title="Change Password"
      onConfirm={handleSubmit}
      confirmLabel="Change password"
      cancelLabel="Cancel"
      busy={busy}
      busyLabel="Saving…"
    >
      <div className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor={`${baseId}-current`}>
              Current password
            </label>
            <input
              id={`${baseId}-current`}
              type="password"
              className={styles.input}
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                if (error !== null) setError(null);
              }}
              autoComplete="current-password"
              disabled={busy}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor={`${baseId}-new`}>
              New password
            </label>
            <input
              id={`${baseId}-new`}
              type="password"
              className={styles.input}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error !== null) setError(null);
              }}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor={`${baseId}-confirm`}>
              Confirm new password
            </label>
            <input
              id={`${baseId}-confirm`}
              type="password"
              className={styles.input}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error !== null) setError(null);
              }}
              autoComplete="new-password"
              disabled={busy}
            />
          </div>
        </div>

        <p className={styles.passwordHint}>
          Minimum {MIN_PASSWORD_LENGTH} characters. The new password is stored
          in Redis and overrides the initial value from the environment file.
        </p>

        {error !== null && (
          <p className={styles.fieldError} role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}