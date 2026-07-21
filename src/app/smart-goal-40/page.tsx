'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

interface ApiResponse {
  data: Product[];
  cached: boolean;
  source: 'cache' | 'external';
  responseTimeMs: number;
  count: number;
  error?: string;
}

const ITEMS_PER_PAGE = 20;

export default function Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isCached, setIsCached] = useState<boolean | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [lastFreshTime, setLastFreshTime] = useState<number | null>(null);

  const totalPages = useMemo(() => Math.ceil(products.length / ITEMS_PER_PAGE), [products]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProducts = products.slice(startIndex, endIndex);

  const fetchProducts = async (refresh: boolean) => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const url = refresh ? '/api/products?refresh=true' : '/api/products';
      const res = await fetch(url);
      const data: ApiResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setProducts(data.data);
      setIsCached(data.cached);
      setResponseTime(data.responseTimeMs);
      setLastFetched(new Date().toLocaleTimeString());

      if (refresh) {
        setLastFreshTime(data.responseTimeMs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      setProducts([]);
      setIsCached(null);
      setResponseTime(null);
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      alert(`Cache invalidated: ${data.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invalidate cache');
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Smart Goal 40</span>
      </div>

      <h1 className={styles.title}>Redis Caching Demo – 15,000 Products | SMART GOAL 40%</h1>
      <p className={styles.subtitle}>
        Compare the speed of fetching fresh data vs. loading from cache.
      </p>

      <div className={styles.controls}>
        <button
          onClick={() => fetchProducts(true)}
          disabled={loading}
          className={`${styles.btn} ${styles.btnFresh}`}
        >
          Fresh Fetch
        </button>
        <button
          onClick={() => fetchProducts(false)}
          disabled={loading}
          className={`${styles.btn} ${styles.btnCache}`}
        >
          Load from Cache
        </button>
        <button
          onClick={invalidateCache}
          disabled={loading}
          className={`${styles.btn} ${styles.btnInvalidate}`}
        >
          Invalidate Cache
        </button>
      </div>

      {loading && (
        <div className={styles.loading}>Loading products...</div>
      )}

      {error && (
        <div className={styles.errorBox}>
          Error: {error}
        </div>
      )}

      {!loading && responseTime !== null && (
        <div className={styles.statusBar}>
          <div className={styles.statusItem}>
            Response time:
            <span className={`${styles.responseTime} ${isCached ? styles.responseTimeCached : styles.responseTimeFresh}`}>
              {formatTime(responseTime)}
            </span>
          </div>
          <div className={styles.statusItem}>
            Status:
            <span className={`${styles.statusBadge} ${isCached ? styles.statusBadgeCached : styles.statusBadgeFresh}`}>
              <span className={styles.statusDot}></span>
              {isCached ? 'Cached' : 'Fresh'}
            </span>
          </div>
          <div className={styles.statusItem}>
            Source:
            <strong>{isCached ? 'Redis' : 'External API'}</strong>
          </div>
          <div className={styles.statusItem}>
            Total Products:
            <strong>{products.length}</strong>
          </div>
          {lastFetched && (
            <div className={styles.statusItem}>
              Last fetched:
              <strong>{lastFetched}</strong>
            </div>
          )}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className={styles.insightBox}>
          <strong>Performance Insight:</strong>{' '}
          {isCached ? (
            <>
              This data was served from Redis cache in <strong>{formatTime(responseTime!)}</strong>.
              {lastFreshTime !== null ? (
                <>
                  {' '}The last fresh fetch took <strong>{formatTime(lastFreshTime)}</strong>.
                  Thats a speedup of <strong>{(lastFreshTime / responseTime!).toFixed(0)}x</strong>!
                </>
              ) : (
                <> Perform a fresh fetch first to see the speed comparison.</>
              )}
            </>
          ) : (
            <>
              This data was freshly fetched from the external API in <strong>{formatTime(responseTime!)}</strong>.
              Click <strong>“Load from Cache”</strong> now to see how much faster the cached version is!
            </>
          )}
        </div>
      )}

      {products.length > 0 && (
        <>
          <div className={styles.productGrid}>
            {currentProducts.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className={styles.productImage}
                  loading="lazy"
                />
                <h3 className={styles.productTitle}>{product.title}</h3>
                <p className={styles.productMeta}>{product.brand} · {product.category}</p>
                <p className={styles.productPrice}>${product.price}</p>
              </div>
            ))}
          </div>

          <div className={styles.pagination}>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.paginationBtn}
            >
              ← Previous
            </button>
            <span className={styles.paginationInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={styles.paginationBtn}
            >
              Next →
            </button>
          </div>
        </>
      )}

      {!loading && products.length === 0 && !error && (
        <div className={styles.emptyState}>
          Click a Fresh Fetch button above to load products.
        </div>
      )}

      <div className={styles.footerInfo}>
        <p>Cache TTL: 60 seconds · Cache key: <code>products:all</code></p>
        <p>
          <a href="/api/products">View API response</a>
        </p>
      </div>
    </div>
  );
}