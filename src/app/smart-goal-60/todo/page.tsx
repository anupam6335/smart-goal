'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ToastProvider, useToast } from './components/ToastProvider';
import { Modal } from './components/Modal';
import { StatusBar } from './components/StatusBar';
import { Accordion, type AccordionGroup } from './components/Accordion';
import { Stepper } from './components/Stepper';
import { TodoCard } from './components/TodoCard';
import { PasswordGate } from './components/PasswordGate';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { useAuth } from './hooks/useAuth';
import { useTodos } from './hooks/useTodos';
import styles from './page.module.css';
import type { Todo, TodoDraft, UpdateTodoInput } from './types';

export default function TodoPage() {
  return (
    <ToastProvider>
      <TodoPageInner />
    </ToastProvider>
  );
}

function TodoPageInner() {
  const toast = useToast();
  const auth = useAuth();
  const todos = useTodos({ onAuthRequired: auth.refresh });

  const [showNewModal, setShowNewModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingMutation, setPendingMutation] = useState<{
    id: string;
    action: 'update' | 'delete';
  } | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) {
      setEditingId(null);
      setShowChangePasswordModal(false);
    }
  }, [auth.isAuthenticated]);

  const handleRefresh = useCallback(async () => {
    await todos.refresh(false);
  }, [todos]);

  const handleInvalidate = useCallback(async () => {
    await todos.invalidateCache();
    toast.push('Cache invalidated — fresh data loaded', 'info');
  }, [todos, toast]);

  const handleLogout = useCallback(async () => {
    await auth.logout();
    toast.push('Logged out', 'info');
  }, [auth, toast]);

  const handleChangePasswordSubmit = useCallback(
    async (currentPassword: string, newPassword: string) => {
      const outcome = await auth.changePassword(currentPassword, newPassword);
      if (outcome.ok) {
        toast.push('Password changed successfully', 'success');
      }
      return outcome;
    },
    [auth, toast]
  );

  const handleCardUpdate = useCallback(
    async (
      id: string,
      updates: UpdateTodoInput
    ): Promise<Todo | null> => {
      setPendingMutation({ id, action: 'update' });
      try {
        const result = await todos.updateTodo(id, updates);
        if (result !== null) {
          toast.push(`Updated "${result.title}"`, 'success');
        }
        return result;
      } finally {
        setPendingMutation(null);
      }
    },
    [todos, toast]
  );

  const handleCardToggle = useCallback(
    async (id: string, completed: boolean): Promise<void> => {
      setPendingMutation({ id, action: 'update' });
      try {
        await todos.toggleComplete(id, completed);
      } finally {
        setPendingMutation(null);
      }
    },
    [todos]
  );

  const handleRequestDelete = useCallback((id: string, title: string) => {
    setDeleteTarget({ id, title });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget === null) return;
    const target = deleteTarget;
    setPendingMutation({ id: target.id, action: 'delete' });
    const ok = await todos.deleteTodo(target.id);
    setPendingMutation(null);
    setDeleteTarget(null);
    if (ok) {
      toast.push(`Deleted "${target.title}"`, 'success');
    }
  }, [deleteTarget, todos, toast]);

  const handleCreate = useCallback(
    async (draft: TodoDraft): Promise<boolean> => {
      const result = await todos.createTodo({
        title: draft.title,
        description: draft.description,
        priority: draft.priority,
        category: draft.category,
        dueDate: draft.dueDate,
        imageUrl: draft.imageUrl,
        isPrivate: draft.isPrivate,
      });
      if (result === null) {
        return false;
      }
      toast.push(`Created "${result.title}"`, 'success');
      setShowNewModal(false);
      return true;
    },
    [todos, toast]
  );

  const handleCancelNew = useCallback(() => {
    setShowNewModal(false);
  }, []);

  const handleUnlocked = useCallback(() => {
    toast.push('Private todos unlocked', 'success');
  }, [toast]);

  const activeTodos = todos.todos.filter(
    (todo) => !todo.completed && !todo.isPrivate
  );
  const completedTodos = todos.todos.filter(
    (todo) => todo.completed && !todo.isPrivate
  );
  const privateTodos = todos.todos.filter((todo) => todo.isPrivate);

  const renderCard = (todo: Todo) => (
    <TodoCard
      key={todo.id}
      todo={todo}
      editing={editingId === todo.id}
      busy={pendingMutation !== null}
      pendingAction={
        pendingMutation !== null && pendingMutation.id === todo.id
          ? pendingMutation.action
          : null
      }
      onEnterEdit={setEditingId}
      onExitEdit={() => setEditingId(null)}
      onUpdate={handleCardUpdate}
      onToggleComplete={handleCardToggle}
      onRequestDelete={handleRequestDelete}
    />
  );

  const groups: AccordionGroup[] = [
    {
      key: 'active',
      label: 'Active',
      count: activeTodos.length,
      emptyMessage: 'Nothing active. Create a todo to get started.',
      content: <>{activeTodos.map(renderCard)}</>,
    },
    {
      key: 'completed',
      label: 'Completed',
      count: completedTodos.length,
      emptyMessage: 'Nothing completed yet.',
      content: <>{completedTodos.map(renderCard)}</>,
    },
    {
      key: 'private',
      label: 'Private',
      count: privateTodos.length,
      locked: !auth.isAuthenticated,
      lockContent: (
        <div className={styles.lockContent}>
          <PasswordGate
            onUnlocked={handleUnlocked}
            onLogin={auth.login}
            onClearError={auth.clearError}
            loading={auth.loading}
            error={auth.error}
            hint="Default password: dummy1234"
          />
        </div>
      ),
      emptyMessage: 'No private todos yet.',
      content: <>{privateTodos.map(renderCard)}</>,
    },
  ];

  const snapshot = {
    lastOperation:
      todos.lastOperation.length > 0 ? todos.lastOperation : null,
    responseTimeMs: todos.responseTime,
    source: todos.source,
    cached: todos.cached,
    totalCount: todos.hydrated ? todos.todos.length : null,
  };

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/" className={styles.breadcrumbLink}>
          Home
        </Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <Link href="/smart-goal-60" className={styles.breadcrumbLink}>
          Smart Goal 60
        </Link>
        <span className={styles.breadcrumbSeparator}> / </span>
        <span className={styles.breadcrumbCurrent}>Todo</span>
      </div>

      <h1 className={styles.title}>Todo</h1>
      <p className={styles.subtitle}>
        Manage tasks with Redis caching, local persistence, and rich
        interactions.
      </p>

      <div className={styles.controls}>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className={`${styles.btn} ${styles.btnFresh}`}
        >
          New Todo
        </button>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={todos.loading}
          className={`${styles.btn} ${styles.btnCache}`}
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={handleInvalidate}
          disabled={todos.loading}
          className={`${styles.btn} ${styles.btnCache}`}
        >
          Invalidate Cache
        </button>
        {auth.isAuthenticated && (
          <button
            type="button"
            onClick={() => setShowChangePasswordModal(true)}
            disabled={auth.loading}
            className={`${styles.btn} ${styles.btnCache}`}
          >
            Change Password
          </button>
        )}
        {auth.isAuthenticated && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={auth.loading}
            className={`${styles.btn} ${styles.btnInvalidate}`}
          >
            Logout
          </button>
        )}
      </div>

      {todos.error !== null && (
        <div className={styles.errorBox}>Error: {todos.error}</div>
      )}

      <StatusBar snapshot={snapshot} />

      {!todos.hydrated && (
        <div className={styles.loading}>Loading todos…</div>
      )}

      {todos.hydrated && <Accordion groups={groups} />}

      <Modal
        open={showNewModal}
        onClose={handleCancelNew}
        title="New Todo"
      >
        <Stepper onSubmit={handleCreate} onCancel={handleCancelNew} />
      </Modal>

      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSubmit={handleChangePasswordSubmit}
        parentLoading={auth.loading}
      />

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Delete Todo"
        onConfirm={handleConfirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        busy={pendingMutation !== null && pendingMutation.action === 'delete'}
        busyLabel="Deleting…"
      >
        {deleteTarget !== null && (
          <p>
            Are you sure you want to delete{' '}
            <strong>&ldquo;{deleteTarget.title}&rdquo;</strong>? This action
            cannot be undone.
          </p>
        )}
      </Modal>
    </div>
  );
}