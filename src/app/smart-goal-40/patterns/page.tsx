'use client';

import React, { useState, useEffect } from 'react';
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

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

export default function PatternsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [isCached, setIsCached] = useState<boolean | null>(null);
  const [lastOperation, setLastOperation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [selectedPattern, setSelectedPattern] = useState<
    'write-through' | 'write-behind-simple' | 'write-behind-queue'
  >('write-through');
  const [expandedPattern, setExpandedPattern] = useState<
    'write-through' | 'write-behind-simple' | 'write-behind-queue' | null
  >('write-through');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    brand: '',
    category: '',
    discountPercentage: 0,
    stock: 0,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);

  const addToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getTypeColor = (type: Toast['type']) => {
    const colors = { info: '#3b82f6', success: '#22c55e', error: '#ef4444' };
    return colors[type];
  };

  const openDeleteModal = (id: number, title: string) => {
    setDeleteTarget({ id, title });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setShowDeleteModal(false);
    setDeleteTarget(null);
  };

  const fetchProducts = async (refresh: boolean = false, silent: boolean = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const url = refresh ? '/api/products/patterns?refresh=true' : '/api/products/patterns';
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setProducts(data.data);
      setIsCached(data.cached);
      setResponseTime(data.responseTimeMs);
      setLastOperation(
        `Fetched ${data.count} products ${data.cached ? '(cached)' : '(fresh)'} in ${data.responseTimeMs}ms`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(true);
  }, []);

  const createProduct = async () => {
    const { title, description, price, brand, category, discountPercentage, stock } = formData;
    if (!title || !description || !price || !brand || !category) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    let endpoint = '/api/products/through';
    let patternName = 'Write-Through';
    if (selectedPattern === 'write-behind-simple') {
      endpoint = '/api/products/behind?variant=simple';
      patternName = 'Write-Behind (Simple)';
    } else if (selectedPattern === 'write-behind-queue') {
      endpoint = '/api/products/behind?variant=queue';
      patternName = 'Write-Behind (Queue)';
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: Number(price),
          brand,
          category,
          discountPercentage: Number(discountPercentage || 0),
          stock: Number(stock || 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');

      const newProduct = data.data as Product;
      setProducts((prev) => [...prev, newProduct]);
      setLastOperation(`Created "${newProduct.title}" in ${data.responseTimeMs}ms`);
      setResponseTime(data.responseTimeMs);
      setFormData({ title: '', description: '', price: 0, brand: '', category: '', discountPercentage: 0, stock: 0 });

      addToast(data.message || `Product "${newProduct.title}" created`, 'success');

      setTimeout(() => {
        fetchProducts(true, true);
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditData({
      title: product.title,
      description: product.description,
      price: product.price,
      brand: product.brand,
      category: product.category,
      discountPercentage: product.discountPercentage,
      stock: product.stock,
    });
  };

  const cancelEdit = () => {
    if (isSaving) return;
    setEditingId(null);
    setEditData({});
  };

  const updateProduct = async (id: number) => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');

      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...editData } : p)));
      setLastOperation(`Updated in ${data.responseTimeMs}ms`);
      setResponseTime(data.responseTimeMs);
      setEditingId(null);
      setEditData({});

      addToast(data.message || 'Product updated', 'success');
      setTimeout(() => {
        fetchProducts(true, true);
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!deleteTarget) return;
    const { id, title } = deleteTarget;

    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setLastOperation(`Deleted in ${data.responseTimeMs}ms`);
      setResponseTime(data.responseTimeMs);

      addToast(data.message || `"${title}" deleted`, 'success');
      setTimeout(() => {
        fetchProducts(true, true);
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setDeleteTarget(null);
    }
  };

  const invalidateCache = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/products/patterns?refresh=true');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to invalidate');
      setProducts(data.data);
      setIsCached(data.cached);
      setResponseTime(data.responseTimeMs);
      setLastOperation(`Cache invalidated – fresh data loaded in ${data.responseTimeMs}ms`);
      addToast('Cache invalidated – fresh data loaded', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to invalidate';
      setError(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  const togglePatternDetail = () => {
    setExpandedPattern(expandedPattern === selectedPattern ? null : selectedPattern);
  };

  const handleTabChange = (
    pattern: 'write-through' | 'write-behind-simple' | 'write-behind-queue'
  ) => {
    setSelectedPattern(pattern);
    setExpandedPattern(pattern);
  };

  const renderActivePatternDetail = () => {
    const isExpanded = expandedPattern === selectedPattern;

    if (selectedPattern === 'write-through') {
      return (
        <div className={styles.patternDetailItem}>
          <button className={styles.patternDetailHeader} onClick={togglePatternDetail}>
            <span>
              {isExpanded ? '▾' : '▸'} <strong>Write-Through</strong>
              <span className={styles.patternSummary}>— DB + Cache together, always consistent.</span>
            </span>
            <span className={styles.patternDetailToggle}>
              {isExpanded ? 'Hide details' : 'Show details'}
            </span>
          </button>
          {isExpanded && (
            <div className={styles.patternDetailContent}>
              <p><strong>What it does:</strong> Writes to database and cache at the same time.</p>
              <p><strong>How it works:</strong></p>
              <ol>
                <li>User submits data</li>
                <li>Database is updated</li>
                <li>Cache is updated</li>
                <li>Response is sent to user</li>
              </ol>
              <p><strong>Pros:</strong> Always consistent.</p>
              <p><strong>Cons:</strong> Slower writes.</p>
              <p><strong>When to use:</strong> Inventory, user profiles, financial data.</p>
            </div>
          )}
        </div>
      );
    }

    if (selectedPattern === 'write-behind-simple') {
      return (
        <div className={styles.patternDetailItem}>
          <button className={styles.patternDetailHeader} onClick={togglePatternDetail}>
            <span>
              {isExpanded ? '▾' : '▸'} <strong>Write-Behind (Simple)</strong>
              <span className={styles.patternSummary}>— Cache first, DB later (async).</span>
            </span>
            <span className={styles.patternDetailToggle}>
              {isExpanded ? 'Hide details' : 'Show details'}
            </span>
          </button>
          {isExpanded && (
            <div className={styles.patternDetailContent}>
              <p><strong>What it does:</strong> Writes to cache immediately, updates database asynchronously.</p>
              <p><strong>How it works:</strong></p>
              <ol>
                <li>User submits data</li>
                <li>Cache is updated immediately</li>
                <li>Response is sent to user</li>
                <li>Database is updated in the background</li>
              </ol>
              <p><strong>Pros:</strong> Very fast writes.</p>
              <p><strong>Cons:</strong> Eventual consistency – data may be lost if server crashes.</p>
              <p><strong>When to use:</strong> Logs, analytics, non-critical data.</p>
            </div>
          )}
        </div>
      );
    }

    if (selectedPattern === 'write-behind-queue') {
      return (
        <div className={styles.patternDetailItem}>
          <button className={styles.patternDetailHeader} onClick={togglePatternDetail}>
            <span>
              {isExpanded ? '▾' : '▸'} <strong>Write-Behind (Queue)</strong>
              <span className={styles.patternSummary}>— Cache first, batched DB writes.</span>
            </span>
            <span className={styles.patternDetailToggle}>
              {isExpanded ? 'Hide details' : 'Show details'}
            </span>
          </button>
          {isExpanded && (
            <div className={styles.patternDetailContent}>
              <p><strong>What it does:</strong> Writes to cache immediately, batches database writes.</p>
              <p><strong>How it works:</strong></p>
              <ol>
                <li>User submits data</li>
                <li>Cache is updated immediately</li>
                <li>Response is sent to user</li>
                <li>Writes are queued and processed in batches (e.g., every 2 seconds)</li>
              </ol>
              <p><strong>Pros:</strong> Fastest writes, reduces database load.</p>
              <p><strong>Cons:</strong> Eventual consistency, more complex.</p>
              <p><strong>When to use:</strong> High-traffic social media, real-time analytics.</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div key={toast.id} className={styles.toast}>
            <span className={styles.dot} style={{ background: getTypeColor(toast.type) }} />
            <span className={styles.toastMessage}>{toast.message}</span>
            <button className={styles.toastClose} onClick={() => removeToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>

      {showDeleteModal && deleteTarget && (
        <>
          <div className={styles.modalOverlay} onClick={closeDeleteModal} />
          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Delete Product</h2>
              <button className={styles.modalClose} onClick={closeDeleteModal} disabled={isDeleting}>
                ×
              </button>
            </div>
            <p className={styles.modalBody}>
              Are you sure you want to delete <strong>“{deleteTarget.title}”</strong>? This cannot be undone.
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeDeleteModal} disabled={isDeleting}>
                Cancel
              </button>
              <button
                className={`${styles.btnConfirmDelete} ${isDeleting ? styles.btnLoading : ''}`}
                onClick={deleteProduct}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </>
      )}

      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>Home</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-40" className={styles.breadcrumbLink}>Smart Goal 40</Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Caching Patterns</span>
      </div>

      <h1 className={styles.title}>Caching Patterns Demo</h1>
      <p className={styles.subtitle}>
        Cache-Aside (reads), Write-Through (writes), and Write-Behind (writes) patterns.
      </p>

      <div className={styles.controls}>
        <button onClick={() => fetchProducts(false)} disabled={loading} className={styles.btn}>
          Fetch from Cache
        </button>
        <button onClick={() => fetchProducts(true)} disabled={loading} className={styles.btn}>
          Refresh List
        </button>
        <button onClick={invalidateCache} disabled={loading} className={styles.btn}>
          Invalidate Cache
        </button>
      </div>

      {error && <div className={styles.errorBox}>Error: {error}</div>}

      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span>Last operation:</span>
          <strong>{lastOperation || 'None'}</strong>
        </div>
        {responseTime !== null && (
          <div className={styles.statusItem}>
            <span>Response time:</span>
            <strong>{formatTime(responseTime)}</strong>
          </div>
        )}
        {isCached !== null && (
          <div className={styles.statusItem}>
            <span>Data source:</span>
            <strong className={isCached ? styles.cached : styles.fresh}>
              {isCached ? 'Cached' : 'Fresh'}
            </strong>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Create Product</h2>

        <div className={styles.patternTabs}>
          <button
            className={`${styles.patternTab} ${selectedPattern === 'write-through' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('write-through')}
          >
            Write-Through
          </button>
          <button
            className={`${styles.patternTab} ${selectedPattern === 'write-behind-simple' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('write-behind-simple')}
          >
            Write-Behind (Simple)
          </button>
          <button
            className={`${styles.patternTab} ${selectedPattern === 'write-behind-queue' ? styles.activeTab : ''}`}
            onClick={() => handleTabChange('write-behind-queue')}
          >
            Write-Behind (Queue)
          </button>
        </div>

        <div className={styles.patternDetailsWrapper}>
          {renderActivePatternDetail()}
        </div>

        <div className={styles.form}>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Title*"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Description*"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={styles.input}
            />
            <input
              type="number"
              placeholder="Price*"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
              className={styles.input}
            />
          </div>
          <div className={styles.formRow}>
            <input
              type="text"
              placeholder="Brand*"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className={styles.input}
            />
            <input
              type="text"
              placeholder="Category*"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className={styles.input}
            />
            <input
              type="number"
              placeholder="Discount %"
              value={formData.discountPercentage || ''}
              onChange={(e) => setFormData({ ...formData, discountPercentage: Number(e.target.value) })}
              className={styles.input}
            />
          </div>
          <div className={styles.formRow}>
            <button onClick={createProduct} disabled={loading} className={styles.btnPrimary}>
              {loading ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Product List ({products.length})</h2>
        {loading && <div className={styles.loading}>Loading...</div>}
        <div className={styles.productGrid}>
          {products.map((product) => (
            <div key={product.id} className={styles.productCard}>
              {editingId === product.id ? (
                <div className={styles.editForm}>
                  <input
                    type="text"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className={styles.input}
                    placeholder="Title"
                  />
                  <input
                    type="text"
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className={styles.input}
                    placeholder="Description"
                  />
                  <input
                    type="number"
                    value={editData.price || ''}
                    onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                    className={styles.input}
                    placeholder="Price"
                  />
                  <div className={styles.editActions}>
                    <button
                      onClick={() => updateProduct(product.id)}
                      disabled={isSaving}
                      className={styles.btnPrimary}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button onClick={cancelEdit} disabled={isSaving} className={styles.btn}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={product.thumbnail}
                    alt={product.title}
                    className={styles.productImage}
                    loading="lazy"
                  />
                  <h3 className={styles.productTitle}>{product.title}</h3>
                  <p className={styles.productMeta}>{product.brand} · {product.category}</p>
                  <p className={styles.productPrice}>${product.price}</p>
                  <div className={styles.productActions}>
                    <button onClick={() => startEdit(product)} className={styles.btn}>
                      Edit
                    </button>
                    <button onClick={() => openDeleteModal(product.id, product.title)} className={styles.btnDanger}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}