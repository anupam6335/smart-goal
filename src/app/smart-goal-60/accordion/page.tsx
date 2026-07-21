'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const items = [
  {
    title: 'What is Redis caching?',
    content:
      'Redis caching stores frequently accessed data in memory for fast retrieval. It reduces the load on your primary database and improves response times.',
  },
  {
    title: 'How does this demo work?',
    content:
      'This demo fetches 15,000 products from an external API. The first fetch takes 7–10 seconds. Once cached in Redis, subsequent fetches take only 1–1.2 seconds – a huge performance gain.',
  },
  {
    title: 'What is the TTL and why does it matter?',
    content:
      'TTL (Time‑To‑Live) defines how long a cached value remains valid. In this demo, the TTL is 60 seconds. After that, the cache expires and a fresh fetch is triggered, ensuring data stays reasonably up‑to‑date.',
  },
  {
    title: 'Can I use this in my own project?',
    content:
      'Absolutely! The code is open‑source and reusable. You can adapt the Redis utility and caching pattern to your own Next.js applications.',
  },
];

export default function Accordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>Frontend Mini‑Challenges</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Accordion</span>
      </div>

      <h1 className={styles.title}>Accordion</h1>
      <p className={styles.subtitle}>Click a question to expand the answer.</p>

      <div className={styles.accordion}>
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className={styles.item}>
              <button
                className={styles.header}
                onClick={() => toggle(index)}
                aria-expanded={isOpen}
              >
                <span className={styles.titleText}>{item.title}</span>
                <span className={styles.icon}>{isOpen ? '−' : '+'}</span>
              </button>
              <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}>
                <div className={styles.content}>{item.content}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}