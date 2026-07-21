import Link from 'next/link';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <span className={styles.breadcrumbCurrent}>Home</span>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Service Layer Demo</h1>
        <p className={styles.subtitle}>
          A collection of full‑stack experiments and frontend mini‑challenges.
        </p>
      </header>

      <div className={styles.grid}>
        <Link href="/smart-goal-40" className={styles.card}>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Smart Goal 40</h2>
            <p className={styles.cardDescription}>
              Redis caching demo with 15,000 products – compare fresh vs cached response times.
            </p>
            <span className={styles.cardTag}>Performance</span>
          </div>
        </Link>

        <Link href="/smart-goal-60" className={styles.card}>
          <div className={styles.cardContent}>
            <h2 className={styles.cardTitle}>Smart Goal 60</h2>
            <p className={styles.cardDescription}>
              Frontend mini‑challenges – interactive UI components built with React.
            </p>
            <span className={styles.cardTag}>UI/UX</span>
          </div>
        </Link>
      </div>
    </div>
  );
}