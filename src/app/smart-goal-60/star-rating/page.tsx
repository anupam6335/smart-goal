'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function StarRating() {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  const handleClick = (value: number) => {
    setRating(value === rating ? 0 : value);
  };

  const handleMouseEnter = (value: number) => {
    setHover(value);
  };

  const handleMouseLeave = () => {
    setHover(0);
  };

  const displayRating = hover || rating;

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Star Rating</span>
      </div>

      <h1 className={styles.title}>Star Rating</h1>

      <div className={styles.card}>
        <div className={styles.stars}>
          {[1, 2, 3, 4, 5].map((value) => (
            <span
              key={value}
              className={`${styles.star} ${value <= displayRating ? styles.active : ''}`}
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
            >
              ★
            </span>
          ))}
        </div>

        <div className={styles.info}>
          <span className={styles.ratingText}>
            {rating > 0 ? `${rating} / 5` : 'No rating yet'}
          </span>
          {rating > 0 && (
            <button
              className={styles.clearButton}
              onClick={() => setRating(0)}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}