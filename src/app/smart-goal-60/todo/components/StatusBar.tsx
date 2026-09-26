'use client';

import styles from '../page.module.css';
import type { ApiSource } from '../types';

export interface StatusSnapshot {
  lastOperation: string | null;
  responseTimeMs: number | null;
  source: ApiSource | null;
  cached: boolean | null;
  totalCount: number | null;
}

export interface StatusBarProps {
  snapshot: StatusSnapshot;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function sourceLabel(source: ApiSource): string {
  if (source === 'redis') return 'Redis';
  if (source === 'database') return 'Database';
  return 'External API';
}

function sourceClass(source: ApiSource): string {
  return source === 'redis' ? styles.cached : styles.fresh;
}

export function StatusBar({ snapshot }: StatusBarProps) {
  const {
    lastOperation,
    responseTimeMs,
    source,
    cached,
    totalCount,
  } = snapshot;

  const hasAnyValue =
    lastOperation !== null ||
    responseTimeMs !== null ||
    source !== null ||
    totalCount !== null;

  if (!hasAnyValue) {
    return null;
  }

  return (
    <div
      className={styles.statusBar}
      role="status"
      aria-live="polite"
    >
      {lastOperation !== null && (
        <div className={styles.statusItem}>
          <span>Last operation:</span>
          <strong>{lastOperation}</strong>
        </div>
      )}

      {responseTimeMs !== null && (
        <div className={styles.statusItem}>
          <span>Response time:</span>
          <strong>{formatTime(responseTimeMs)}</strong>
        </div>
      )}

      {source !== null && (
        <div className={styles.statusItem}>
          <span>Data source:</span>
          <strong className={sourceClass(source)}>{sourceLabel(source)}</strong>
        </div>
      )}

      {cached !== null && (
        <div className={styles.statusItem}>
          <span>Status:</span>
          <strong className={cached ? styles.cached : styles.fresh}>
            {cached ? 'Cached' : 'Fresh'}
          </strong>
        </div>
      )}

      {totalCount !== null && (
        <div className={styles.statusItem}>
          <span>Total:</span>
          <strong>{totalCount}</strong>
        </div>
      )}
    </div>
  );
}