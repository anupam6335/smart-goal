'use client';

import { useState } from 'react';
import styles from './page.module.css';

const steps = [
  {
    title: 'Install Redis Server & Node.js Client',
    description: 'Get Redis running locally or via a cloud service, and install the Node.js client library.',
    details: [
      'Install Redis on your machine (or use a Docker container).',
      'For production, consider a managed service like Redis Cloud or AWS ElastiCache.',
      'In your Node.js project, run: `npm install ioredis` (or `redis` package).',
    ],
  },
  {
    title: 'Configure Connection & Create Client',
    description: 'Set up the Redis client with connection parameters and best practices.',
    details: [
      'Create a Redis client instance with host, port, password (if any), and database index.',
      'Use environment variables for sensitive data (e.g., `REDIS_URL`).',
      'Enable retry strategy and connection timeout handling.',
      'Example: `new Redis({ host: \'localhost\', port: 6379, retryStrategy: (times) => Math.min(times * 50, 2000) })`',
    ],
  },
  {
    title: 'Implement Core Cache Functions',
    description: 'Write reusable functions for get, set, and delete with TTL support.',
    details: [
      '`get(key)` – returns parsed JSON or raw value.',
      '`set(key, value, ttl)` – stores value with an expiration time in seconds.',
      '`del(key)` – removes a key from cache.',
      'Use `JSON.stringify` for objects and `JSON.parse` when retrieving.',
      'Consider using a wrapper that handles serialization/deserialization automatically.',
    ],
  },
  {
    title: 'Integrate with Your Application',
    description: 'Use the cache in your business logic to reduce database load and improve performance.',
    details: [
      'Wrap database queries with cache: check cache first, if miss, query DB and store result.',
      'Implement a middleware for caching API responses (e.g., Express middleware).',
      'Invalidate cache when data changes (write‑through or cache‑aside patterns).',
      'Example: cache user profile data for 5 minutes.',
    ],
  },
  {
    title: 'Error Handling & Monitoring',
    description: 'Make your caching layer resilient and observable.',
    details: [
      'Handle Redis connection errors gracefully – fallback to direct DB calls.',
      'Log cache hits/misses for performance analysis.',
      'Set up monitoring with tools like Redis Insight or Prometheus.',
      'Consider using a circuit breaker to avoid cascading failures.',
      'Test your cache logic thoroughly with unit and integration tests.',
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