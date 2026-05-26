import { Suspense } from 'react';
import styles from './page.module.css';
import ClientWrapper from './ClientWrapper';
import { getUsers, groupByDomain, getTopUsers } from '@/features/user/services/userServiceTemp';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </div>
  );
}

async function ServerUsers() {
  try {
    const users = await getUsers();
    const topUsers = getTopUsers(users, 5);
    const domainGroups = groupByDomain(users);

    return (
      <Card title="Server-side fetch (shown during page load)">
        <p className={styles.desc}>
          This data is fetched <strong>on the server</strong>. We also apply functional pipelines
          and complex object operations here.
        </p>
        <ul className={styles.list}>
          {topUsers.map((user) => (
            <li key={user.id}>
              {user.displayName} ({user.email})
            </li>
          ))}
        </ul>
        <div className={styles.domainStats}>
          <h3>Domain Stats (server)</h3>
          <ul>
            {Object.entries(domainGroups).map(([domain, count]) => (
              <li key={domain}>{domain}: {count}</li>
            ))}
          </ul>
        </div>
      </Card>
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return (
      <Card title="Server-side fetch">
        <p className={styles.error}>Error: {message}</p>
      </Card>
    );
  }
}

export default function ServiceDemoPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.mainTitle}>SMART GOAL REVIEW 2</h1>
      <div className={styles.grid}>
        <Suspense fallback={<Card title="Server-side fetch......"><p>Loading…</p></Card>}>
          <ServerUsers />
        </Suspense>
        <ClientWrapper />
      </div>
      {/* Decision guide table remains same */}
      <section className={styles.guide}>
        <h2>When to use server vs. client?</h2>
        <table className={styles.table}>
          <thead><tr><th>Criteria</th><th>Server</th><th>Client</th></tr></thead>
          <tbody>
            <tr><td>SEO / initial load</td><td>✅ Better</td><td>❌ Slower</td></tr>
            <tr><td>User-specific data</td><td>🟡 Needs cookies/headers</td><td>✅ Natural fit</td></tr>
            <tr><td>Interactive state</td><td>❌ Complex</td><td>✅ Easy</td></tr>
            <tr><td>Security (hide tokens)</td><td>✅ Safe</td><td>❌ Risky</td></tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}