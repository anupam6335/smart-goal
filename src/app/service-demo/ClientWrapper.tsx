'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  getUsers,
  getUserById,
  ApiError,
  groupByDomain,
  getTopUsers,
} from '@/features/user/services/userService';
import type { User } from '@/features/user/services/userService';
import styles from './page.module.css';

const Card = memo(({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className={styles.card}>
    <h2 className={styles.title}>{title}</h2>
    {children}
  </div>
));
Card.displayName = 'Card';

export default function ClientUsers() {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [single, setSingle] = useState<User | null>(null);
  const [domainStats, setDomainStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadAll = useCallback(async () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const data = await getUsers();
      setAllUsers(data);
      setFilteredUsers(data.slice(0, 5));
      setDomainStats(groupByDomain(data));
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof ApiError ? err.message : 'Fetch failed');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const loadSingle = useCallback(async (id: number) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const user = await getUserById(id);
      setSingle(user);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setError(err instanceof ApiError ? err.message : 'Fetch failed');
      setSingle(null);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const triggerError = useCallback(() => loadSingle(9999), [loadSingle]);

  useEffect(() => {
    loadAll();
    return () => abortControllerRef.current?.abort();
  }, [loadAll]);

  useEffect(() => {
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    if (!searchTerm.trim()) {
      setFilteredUsers(allUsers.slice(0, 5));
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const term = searchTerm.toLowerCase().trim();
      const filtered = allUsers.filter(
        (user) =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
      setFilteredUsers(filtered);
    }, 500);

    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [searchTerm, allUsers]);

  const getCity = (user: User) => {
    const { address: { city = 'No city' } = {} } = user;
    return city;
  };

  const hasSearchTerm = searchTerm.trim().length > 0;

  return (
    <Card title="Client‑side fetch (interactive after page load)">
      <p className={styles.desc}>
        This data is fetched <strong>after</strong> the page loads. We use functional array methods,
        nested destructuring, and complex object operations (group by domain).
      </p>

      <div className={styles.actions}>
        <button onClick={loadAll} className={styles.btn}>Reload all</button>
        <button onClick={() => loadSingle(1)} className={styles.btn}>Fetch user #1</button>
        <button onClick={triggerError} className={styles.btn}>Trigger 404</button>
      </div>

      <div style={{ margin: '0.75rem 0' }}>
        <input
          type="text"
          placeholder="Search by name or email…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.4rem 0.6rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
          }}
        />
        {searchTerm && (
          <small style={{ color: 'var(--text-muted)' }}>
            {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''}
          </small>
        )}
      </div>

      {loading && <p className={styles.loading}>Loading…</p>}
      {error && <p className={styles.error}>⚠ {error}</p>}

      {single && (
        <div className={styles.single}>
          Single user: <strong>{single.name}</strong> ({single.email})
          <span className={styles.city}> – City: {getCity(single)}</span>
        </div>
      )}

      {filteredUsers.length > 0 && (
        <>
          <ul className={styles.list}>
            {filteredUsers.map((u) => (
              <li key={u.id}>
                {u.name} ({u.email}) – {getCity(u)}
              </li>
            ))}
          </ul>
          <div className={styles.domainStats}>
            <h3>Email Domain Distribution (full dataset)</h3>
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

      {hasSearchTerm && filteredUsers.length === 0 && !loading && (
        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.75rem' }}>
          No users found matching your search.
        </p>
      )}
    </Card>
  );
}