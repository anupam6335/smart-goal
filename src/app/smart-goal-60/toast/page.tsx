'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type ToastType = 'info' | 'success' | 'error' | 'warning';
type ToastPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

export default function ToastPage() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [position, setPosition] = useState<ToastPosition>('bottom-right');
  const [duration, setDuration] = useState<number>(3500);

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Auto-dismiss based on each toast's duration
  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.duration > 0)
      .map((toast) => setTimeout(() => removeToast(toast.id), toast.duration));
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  const getTypeColor = (type: ToastType) => {
    const colors = { info: '#3b82f6', success: '#22c55e', error: '#ef4444', warning: '#f59e0b' };
    return colors[type];
  };

  const positions: ToastPosition[] = [
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const durationOptions = [
    { label: '2s', value: 2000 },
    { label: '3.5s', value: 3500 },
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Toast</span>
      </div>

      <h1 className={styles.title}>Toast Notifications</h1>
      <p className={styles.subtitle}>Choose position, duration, and click a button.</p>

      <div className={styles.controls}>
        <div className={styles.positionGroup}>
          <span className={styles.positionLabel}>Position:</span>
          <div className={styles.positionButtons}>
            {positions.map((pos) => (
              <button
                key={pos}
                className={`${styles.positionBtn} ${position === pos ? styles.active : ''}`}
                onClick={() => setPosition(pos)}
              >
                {pos.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.durationGroup}>
          <span className={styles.durationLabel}>Duration:</span>
          <div className={styles.durationButtons}>
            {durationOptions.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.durationBtn} ${duration === opt.value ? styles.active : ''}`}
                onClick={() => setDuration(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.triggerGroup}>
          {(['info', 'success', 'error', 'warning'] as ToastType[]).map((type) => (
            <button
              key={type}
              className={`${styles.btn} ${styles[type]}`}
              onClick={() => addToast(`This is a ${type} message.`, type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={`${styles.toastContainer} ${styles[position]}`}>
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            <span className={styles.dot} style={{ background: getTypeColor(toast.type) }} />
            <span className={styles.toastMessage}>{toast.message}</span>
            {toast.duration === 0 && (
              <span className={styles.manualBadge}>Manual</span>
            )}
            <button className={styles.toastClose} onClick={() => removeToast(toast.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}