'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

const steps = [
  {
    title: '1. Why Use Redis Cache?',
    description: 'Understand the benefits of caching and when to use Redis in your Node.js project.',
    details: [
      ' Speed: Redis stores data in memory, so reads are extremely fast (microseconds).',
      ' Reduce database load: Cache frequent queries – fewer calls to your primary DB.',
      ' Reusable data: Store session data, API responses, or computed results.',
      ' Simple key‑value store with optional TTL (time‑to‑live) for automatic expiration.',
      ' Perfect for high‑traffic apps, rate limiting, and real‑time features.',
    ],
  },
  {
    title: '2. Installing Redis',
    description: 'Get Redis up and running on your machine – we cover both Windows and Linux.',
    details: [
      ' Linux (Ubuntu/Debian): `sudo apt update && sudo apt install redis-server`',
      ' Windows: Use WSL2 (recommended) – run `sudo apt install redis-server` inside WSL, or download the official MSI from the Redis website.',
      ' After installation, start Redis: `sudo systemctl start redis` (Linux) or run `redis-server` (WSL).',
      ' Verify it works: `redis-cli ping` should reply with `PONG`.',
      ' Alternatively, use Docker: `docker run -d -p 6379:6379 redis` (works everywhere).',
    ],
  },
  {
    title: '3. Connecting to Redis in Node.js',
    description: 'Install the client library and set up a connection using environment variables.',
    details: [
      '1. Install `ioredis`: `npm install ioredis`',
      '2. Create a `.env` file: `REDIS_URL=redis://localhost:6379` (or your cloud URL).',
      '3. Import and create a client:',
        '   const Redis = require("ioredis");',
        '   const redis = new Redis(process.env.REDIS_URL);',
      '4. Add error handling: `redis.on("error", (err) => console.error(err));`',
      ' Use a connection pool or singleton pattern for production.',
    ],
  },
  {
    title: '4. Basic Cache Operations (Get, Set, Delete)',
    description: 'Learn the three essential functions with practical examples.',
    details: [
      ' Set a value with TTL (expires in 60 seconds):',
      '   `await redis.set("key", "value", "EX", 60);`',
      ' Get a value: `const data = await redis.get("key");`',
      ' Delete a key: `await redis.del("key");`',
      ' For objects, use `JSON.stringify()` when storing and `JSON.parse()` when retrieving.',
      ' Example: caching a user profile:',
      '   `await redis.set(`user:${userId}`, JSON.stringify(user), "EX", 300);`',
    ],
  },
  {
    title: '5. Integrating Redis with Your Express/Node.js App',
    description: 'Practical patterns to reduce database load and speed up responses.',
    details: [
      ' Cache‑aside (lazy loading): Check cache first; if missing, query DB and store.',
      '   const cached = await redis.get(`post:${id}`);',
      '   if (cached) return JSON.parse(cached);',
      '   const post = await db.getPost(id);',
      '   await redis.set(`post:${id}`, JSON.stringify(post), "EX", 60);',
      '   return post;',
      ' Invalidate on update: delete or update the cache when data changes.',
      ' Middleware for caching entire API responses (e.g., `app.use(cacheMiddleware)`).',
      ' Use TTL wisely – longer for static data, shorter for dynamic content.',
    ],
  },
  {
    title: '6. Error Handling, Monitoring & Best Practices',
    description: 'Make your caching layer robust and observable in production.',
    details: [
      ' Handle Redis failures gracefully – fallback to direct database queries.',
      ' Log cache hits/misses to monitor effectiveness.',
      ' Use Redis Insight or `redis-cli` to inspect keys and memory usage.',
      ' Set up alerts for connection errors or high memory usage.',
      ' Write unit tests with a mock Redis client to test your cache logic.',
      ' Always use environment variables for connection strings – never hardcode.',
    ],
  },
];

export default function StepperPage() {
  const [activeStep, setActiveStep] = useState(0);
  const totalSteps = steps.length;

  const goNext = () => {
    if (activeStep < totalSteps - 1) setActiveStep(activeStep + 1);
  };
  const goPrev = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const step = steps[activeStep];

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
        <span className={styles.breadcrumbCurrent}>steppwrn</span>
      </div>

      <h1 className={styles.pageTitle}>Redis Cache Setup in Node.js</h1>

      {/* Step progress indicator */}
      <div className={styles.progress}>
        {steps.map((_, idx) => (
          <div key={idx} className={styles.stepDotWrapper}>
            <div
              className={`${styles.stepDot} ${idx <= activeStep ? styles.active : ''}`}
            >
              {idx + 1}
            </div>
            {idx < totalSteps - 1 && (
              <div
                className={`${styles.stepLine} ${idx < activeStep ? styles.done : ''}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className={styles.stepContent}>
        <h2 className={styles.stepTitle}>{step.title}</h2>
        <p className={styles.stepDescription}>{step.description}</p>
        <ul className={styles.detailsList}>
          {step.details.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>

        <div className={styles.navigation}>
          <button
            onClick={goPrev}
            disabled={activeStep === 0}
            className={styles.navButton}
          >
            ← Previous
          </button>
          <span className={styles.stepCounter}>
            Step {activeStep + 1} of {totalSteps}
          </span>
          <button
            onClick={goNext}
            disabled={activeStep === totalSteps - 1}
            className={styles.navButton}
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}