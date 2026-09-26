'use client';

import { useCallback, useRef, useState } from 'react';
import styles from '../page.module.css';

const STARS = [1, 2, 3, 4, 5] as const;

export interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  readOnly?: boolean;
  disabled?: boolean;
  large?: boolean;
  showLabel?: boolean;
  label?: string;
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  large = false,
  showLabel = false,
  label = 'Priority',
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const starRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusStar = useCallback((index: number) => {
    const target = starRefs.current[index];
    if (target !== null && target !== undefined) {
      target.focus();
    }
  }, []);

  const handleContainerKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (readOnly || disabled) return;

      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        event.preventDefault();
        const next = Math.min(5, value + 1);
        onChange(next);
        focusStar(next - 1);
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        event.preventDefault();
        const next = Math.max(0, value - 1);
        onChange(next);
        if (next > 0) {
          focusStar(next - 1);
        } else if (containerRef.current !== null) {
          containerRef.current.focus();
        }
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        const next = value === 1 ? 0 : 1;
        onChange(next);
        if (next > 0) {
          focusStar(0);
        }
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        onChange(5);
        focusStar(4);
      }
    },
    [readOnly, disabled, value, onChange, focusStar]
  );

  const handleStarClick = useCallback(
    (star: number) => {
      if (readOnly || disabled) return;
      onChange(value === star ? 0 : star);
    },
    [readOnly, disabled, value, onChange]
  );

  const handleMouseEnter = useCallback(
    (star: number) => {
      if (readOnly || disabled) return;
      setHover(star);
    },
    [readOnly, disabled]
  );

  const handleMouseLeave = useCallback(() => {
    if (readOnly || disabled) return;
    setHover(0);
  }, [readOnly, disabled]);

  const displayValue = hover > 0 ? hover : value;
  const containerClass = [
    styles.starRating,
    large ? styles.starLarge : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (readOnly) {
    const ariaLabel =
      value > 0 ? `${label} ${value} of 5` : `No ${label.toLowerCase()}`;
    return (
      <span className={containerClass} role="img" aria-label={ariaLabel}>
        {STARS.map((star) => (
          <span
            key={star}
            className={`${styles.star} ${styles.starReadonly} ${
              star <= value ? styles.starFilled : ''
            }`}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
        {showLabel && (
          <span className={styles.starLabel}>
            {value > 0 ? `${value}/5` : 'None'}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      ref={containerRef}
      className={containerClass}
      role="radiogroup"
      aria-label={label}
      tabIndex={value === 0 ? 0 : -1}
      onKeyDown={handleContainerKeyDown}
      onMouseLeave={handleMouseLeave}
      aria-disabled={disabled || undefined}
    >
      {STARS.map((star, index) => {
        const isActive = star <= displayValue;
        const isFocused = star === value;
        const classNames = [
          styles.star,
          isActive ? styles.starFilled : '',
          hover > 0 && star <= hover ? styles.starHover : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <button
            key={star}
            ref={(el) => {
              starRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} of 5`}
            tabIndex={isFocused ? 0 : -1}
            className={classNames}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onFocus={() => handleMouseEnter(star)}
            onBlur={handleMouseLeave}
            disabled={disabled}
          >
            ★
          </button>
        );
      })}
      {showLabel && (
        <span className={styles.starLabel}>
          {value > 0 ? `${value}/5` : 'None'}
        </span>
      )}
    </div>
  );
}