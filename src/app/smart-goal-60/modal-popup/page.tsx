'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

type ModalType = 'info' | 'warning' | 'delete';

const modalConfig = {
  info: {
    title: 'Information',
    body: 'This is an informational message. No action is required.',
    confirmLabel: 'Got it',
    confirmColor: '#3b82f6', 
  },
  warning: {
    title: 'Warning',
    body: 'Please review your input before proceeding. This action may have consequences.',
    confirmLabel: 'Proceed Anyway',
    confirmColor: '#f59e0b', 
  },
  delete: {
    title: 'Delete Item',
    body: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmLabel: 'Delete',
    confirmColor: '#ef4444',
  },
};

export default function ModalPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('info');

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const config = modalConfig[modalType];

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Modal</span>
      </div>

      <h1 className={styles.title}>Modal Popup</h1>
      <p className={styles.subtitle}>Choose a type, then open the modal.</p>

      <div className={styles.settings}>
        <span className={styles.settingsLabel}>Type:</span>
        <div className={styles.typeButtons}>
          {(['info', 'warning', 'delete'] as ModalType[]).map((type) => (
            <button
              key={type}
              className={`${styles.typeBtn} ${modalType === type ? styles.active : ''} ${styles[type]}`}
              onClick={() => setModalType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button className={styles.openButton} onClick={openModal}>
        Open Modal
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={closeModal} />
          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleWrapper}>
                <span
                  className={styles.typeDot}
                  style={{ background: config.confirmColor }}
                />
                <h2 className={styles.modalTitle}>{config.title}</h2>
              </div>
              <button className={styles.modalClose} onClick={closeModal}>×</button>
            </div>
            <p className={styles.modalBody}>{config.body}</p>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeModal}>Cancel</button>
              <button
                className={styles.btnConfirm}
                style={{ color: config.confirmColor }}
                onClick={closeModal}
              >
                {config.confirmLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}