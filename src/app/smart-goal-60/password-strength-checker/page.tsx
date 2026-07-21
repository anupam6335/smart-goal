'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function PasswordStrengthPage() {
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: 'Weak', color: '#ff4d4d' });

  const checkStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    let label = 'Weak';
    let color = '#ff4d4d';
    if (score >= 4) {
      label = 'Strong';
      color = '#2ecc71';
    } else if (score >= 3) {
      label = 'Medium';
      color = '#f1c40f';
    }
    setStrength({ score, label, color });
  };

  const handleChange = (e: any) => {
    const val = e.target.value;
    setPassword(val);
    checkStrength(val);
  };

  const barWidth = (strength.score / 5) * 100;

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>
          Frontend Mini‑Challenges
        </Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Password Strength</span>
      </div>

      <h1 className={styles.pageTitle}>Password Strength Checker</h1>

      <div className={styles.card}>
        <input
          type="password"
          value={password}
          onChange={handleChange}
          placeholder="Enter your password"
          className={styles.input}
        />

        <div className={styles.feedback}>
          <div className={styles.strengthRow}>
            <span className={styles.strengthLabel}>
              Strength: <strong style={{ color: strength.color }}>{strength.label}</strong>
            </span>
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${barWidth}%`, backgroundColor: strength.color }}
              />
            </div>
          </div>

          <ul className={styles.criteriaList}>
            <li>{password.length >= 8 ? '✓' : '✗'} At least 8 characters</li>
            <li>{password.length >= 12 ? '✓' : '✗'} At least 12 characters (recommended for better security)</li>
            <li>{/[a-z]/.test(password) && /[A-Z]/.test(password) ? '✓' : '✗'} Uppercase & lowercase</li>
            <li>{/\d/.test(password) ? '✓' : '✗'} Contains a number</li>
            <li>{/[^a-zA-Z0-9]/.test(password) ? '✓' : '✗'} Contains a special character</li>
          </ul>
        </div>
      </div>
    </div>
  );
}