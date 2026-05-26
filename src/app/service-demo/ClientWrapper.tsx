'use client';

import { useEffect, useState } from 'react';
import {
  getUsers,
  getUserById,
  ApiError,
  groupByDomain,
  getTopUsers,
} from '@/features/user/services/userServiceTemp';
import type { User } from '@/features/user/services/userServiceTemp';
import styles from './page.module.css';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      {children}
    </div>
  );
}

export default function ClientUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [single, setSingle] = useState<User | null>(null);
  const [domainStats, setDomainStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getUsers();
      // Convert back to full User objects for rendering
      const fullUsers = data.filter((_, idx) => idx < 5);
      setUsers(fullUsers);
      //  Complex object operation: group by domain
      const grouped = groupByDomain(data);
      setDomainStats(grouped);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const loadSingle = async (id: number) => {
    setLoading(true);
    setError('');
    try {
      const user = await getUserById(id);
      setSingle(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Fetch failed');
      setSingle(null);
    } finally {
      setLoading(false);
    }
  };

  const triggerError = () => loadSingle(9999);

  useEffect(() => {
    loadAll();
  }, []);

  //  Safe property access for nested address
  const getCity = (user: User) => {
    const { address: { city = 'No city' } = {} } = user;
    return city;
  };

  return (
    <Card title=" Client-side fetch (user can interact here through button after page load)">
      <p className={styles.desc}>
        This data is fetched <strong>after</strong> the page loads. We use functional array methods,
        nested destructuring, and complex object operations (group by domain).
      </p>
      <div className={styles.actions}>
        <button onClick={loadAll} className={styles.btn}>
          Reload all
        </button>
        <button onClick={() => loadSingle(1)} className={styles.btn}>
          Fetch user #1
        </button>
        <button onClick={triggerError} className={styles.btn}>
          Trigger 404
        </button>
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.error}>⚠ {error}</p>}

      {single && (
        <div className={styles.single}>
          Single user: <strong>{single.name}</strong> ({single.email})
          <span className={styles.city}> – City: {getCity(single)}</span>
        </div>
      )}

      {users.length > 0 && (
        <>
          <ul className={styles.list}>
            {users.map((u) => (
              <li key={u.id}>
                {u.name} ({u.email}) – {getCity(u)}
              </li>
            ))}
          </ul>

          {/*  Display domain statistics */}
          <div className={styles.domainStats}>
            <h3>Email Domain Distribution</h3>
            <ul>
              {Object.entries(domainStats).map(([domain, count]) => (
                <li key={domain}>
                  {domain}: {count} user{count !== 1 ? 's' : ''}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}