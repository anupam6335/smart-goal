'use client';

import { useCallback, useId, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import styles from '../page.module.css';
import type { AccordionGroupKey } from '../types';

export interface AccordionGroup {
  key: AccordionGroupKey;
  label: string;
  count: number;
  locked?: boolean;
  lockContent?: ReactNode;
  emptyMessage?: string;
  content: ReactNode;
}

export interface AccordionProps {
  groups: AccordionGroup[];
  storageKey?: string;
  defaultOpen?: Partial<Record<AccordionGroupKey, boolean>>;
}

type OpenState = Record<AccordionGroupKey, boolean>;

const FALLBACK_OPEN: OpenState = {
  active: true,
  completed: false,
  private: false,
};

function resolveDefault(
  override: Partial<Record<AccordionGroupKey, boolean>> | undefined
): OpenState {
  return {
    active: override?.active ?? FALLBACK_OPEN.active,
    completed: override?.completed ?? FALLBACK_OPEN.completed,
    private: override?.private ?? FALLBACK_OPEN.private,
  };
}

export function Accordion({
  groups,
  storageKey = 'sg60:todo:accordion',
  defaultOpen,
}: AccordionProps) {
  const initial = resolveDefault(defaultOpen);
  const [openState, setOpenState, hydrated] = useLocalStorage<OpenState>(
    storageKey,
    initial
  );
  const baseId = useId();

  const handleToggle = useCallback(
    (key: AccordionGroupKey) => {
      setOpenState((prev) => {
        const current = prev?.[key] ?? FALLBACK_OPEN[key];
        return { ...prev, [key]: !current };
      });
    },
    [setOpenState]
  );

  const effective = hydrated ? openState : initial;

  return (
    <div className={styles.accordion}>
      {groups.map((group) => {
        const isOpen = effective[group.key] ?? FALLBACK_OPEN[group.key];
        const bodyId = `${baseId}-${group.key}-body`;
        const headerId = `${baseId}-${group.key}-header`;

        return (
          <section key={group.key} className={styles.accordionGroup}>
            <button
              type="button"
              id={headerId}
              className={styles.accordionHeader}
              onClick={() => handleToggle(group.key)}
              aria-expanded={isOpen}
              aria-controls={bodyId}
            >
              <span
                className={`${styles.accordionChevron} ${
                  isOpen ? styles.accordionChevronOpen : ''
                }`}
                aria-hidden="true"
              >
                ▸
              </span>
              <span>{group.label}</span>
              {group.locked && (
                <span className={styles.accordionLock} aria-hidden="true">
                  🔒
                </span>
              )}
              <span className={styles.accordionCount}>{group.count}</span>
            </button>

            <div
              id={bodyId}
              role="region"
              aria-labelledby={headerId}
              className={`${styles.accordionBody} ${
                isOpen ? styles.accordionBodyOpen : ''
              }`}
            >
              <div className={styles.accordionBodyInner}>
                {group.locked ? (
                  <div className={styles.accordionLocked}>
                    {group.lockContent}
                  </div>
                ) : group.count === 0 ? (
                  <div className={styles.accordionLocked}>
                    {group.emptyMessage ?? 'Nothing here yet.'}
                  </div>
                ) : (
                  <div className={styles.accordionList}>{group.content}</div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}