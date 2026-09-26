'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import styles from '../page.module.css';

export interface PasswordGateProps {
  onUnlocked: () => void;
  onLogin: (password: string) => Promise<boolean>;
  onClearError: () => void;
  loading: boolean;
  error: string | null;
  submitLabel?: string;
  placeholder?: string;
  autoFocus?: boolean;
  hint?: string;
}

export function PasswordGate({
  onUnlocked,
  onLogin,
  onClearError,
  loading,
  error,
  submitLabel = 'Unlock',
  placeholder = 'Enter password',
  autoFocus = true,
  hint,
}: PasswordGateProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorId = useId();

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current !== null) {
        clearTimeout(shakeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoFocus && inputRef.current !== null) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const triggerShake = useCallback(() => {
    const form = formRef.current;
    if (form === null) return;
    form.classList.remove(styles.shake);
    void form.offsetWidth;
    form.classList.add(styles.shake);
    if (shakeTimerRef.current !== null) {
      clearTimeout(shakeTimerRef.current);
    }
    shakeTimerRef.current = setTimeout(() => {
      form.classList.remove(styles.shake);
      shakeTimerRef.current = null;
    }, 400);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (loading || password.length === 0) return;
      const ok = await onLogin(password);
      if (ok) {
        setPassword('');
        onUnlocked();
        return;
      }
      setPassword('');
      triggerShake();
      inputRef.current?.focus();
    },
    [loading, password, onLogin, onUnlocked, triggerShake]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (error !== null) {
        onClearError();
      }
      setPassword(event.target.value);
    },
    [error, onClearError]
  );

  const handleToggleShow = useCallback(() => {
    setShowPassword((prev) => !prev);
    inputRef.current?.focus();
  }, []);

  return (
    <form
      ref={formRef}
      className={styles.passwordForm}
      onSubmit={handleSubmit}
      noValidate
    >
      <div className={styles.passwordInputWrap}>
        <input
          ref={inputRef}
          type={showPassword ? 'text' : 'password'}
          className={`${styles.input} ${styles.passwordInput}`}
          value={password}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete="current-password"
          aria-label="Password"
          aria-invalid={error !== null || undefined}
          aria-describedby={error !== null ? errorId : undefined}
          disabled={loading}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={handleToggleShow}
          disabled={loading}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? 'Hide' : 'Show'}
        </button>
      </div>

      {hint !== undefined && hint.length > 0 && (
        <p className={styles.passwordHint}>{hint}</p>
      )}

      {error !== null && (
        <p id={errorId} className={styles.fieldError} role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        className={styles.btnPrimary}
        disabled={loading || password.length === 0}
      >
        {loading ? 'Unlocking…' : submitLabel}
      </button>
    </form>
  );
}