import Link from 'next/link';
import styles from './page.module.css';

export default function SmartGoal60() {
  const projects = [
    {
      id: 'image-galary',
      title: 'Image Gallery',
      description: 'Click thumbnails to view larger images – cats and pandas included.',
      path: '/smart-goal-60/image-galary',
      tag: 'React',
    },
    {
      id: 'accordion',
      title: 'Accordion',
      description: 'Expandable FAQ‑style accordion.',
      path: '/smart-goal-60/accordion',
      tag: 'React',
    },
    {
      id: 'stepper',
      title: 'Stepper',
      description: 'A multi‑step wizard with clean navigation and progress tracking.',
      path: '/smart-goal-60/stepper',
      tag: 'React',
    },
    {
      id: 'password-strength-checker',
      title: 'Password Strength Checker',
      description: 'Evaluate password strength with real-time feedback.',
      path: '/smart-goal-60/password-strength-checker',
      tag: 'React',
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Frontend Mini‑Challenges</span>
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Frontend Mini‑Challenges | SMART GOAL 60%</h1>
      </header>

      <div className={styles.grid}>
        {projects.map((project) => (
          <Link href={project.path} key={project.id} className={styles.card}>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>{project.title}</h2>
              <p className={styles.cardDescription}>{project.description}</p>
              <span className={styles.cardTag}>{project.tag}</span>
            </div>
          </Link>
        ))}
      </div>

      {projects.length === 0 && (
        <div className={styles.emptyState}>
          <p>No mini‑projects added yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}