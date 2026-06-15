'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ContentRecord } from '@/types';
import type { FilterState, SortState, GroupState } from '@/hooks/use-search';
import type { ViewType } from '@/components/layout/app-shell';

export interface ViewState {
  searchQuery: string;
  filters: FilterState;
  sort: SortState;
  group: GroupState;
  viewMode: ViewType;
}

export interface SavedView {
  id: string;
  name: string;
  state: ViewState;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'contentflow-views';

function generateId(): string {
  return `view_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadViews(): SavedView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveViewsToStorage(views: SavedView[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views));
  } catch {
    // Storage full or unavailable
  }
}

function useViews() {
  const [views, setViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);

  // Load views on mount
  useEffect(() => {
    setViews(loadViews());
  }, []);

  const activeView = views.find((v) => v.id === activeViewId) ?? null;

  const saveView = useCallback((name: string, state: ViewState) => {
    const now = new Date().toISOString();
    const view: SavedView = {
      id: generateId(),
      name,
      state,
      createdAt: now,
      updatedAt: now,
    };
    setViews((prev) => {
      const next = [...prev, view];
      saveViewsToStorage(next);
      return next;
    });
    setActiveViewId(view.id);
    return view;
  }, []);

  const loadView = useCallback(
    (id: string) => {
      const view = views.find((v) => v.id === id);
      if (view) {
        setActiveViewId(id);
        return view.state;
      }
      return null;
    },
    [views],
  );

  const deleteView = useCallback(
    (id: string) => {
      setViews((prev) => {
        const next = prev.filter((v) => v.id !== id);
        saveViewsToStorage(next);
        return next;
      });
      if (activeViewId === id) {
        setActiveViewId(null);
      }
    },
    [activeViewId],
  );

  const renameView = useCallback(
    (id: string, name: string) => {
      setViews((prev) => {
        const next = prev.map((v) =>
          v.id === id ? { ...v, name, updatedAt: new Date().toISOString() } : v,
        );
        saveViewsToStorage(next);
        return next;
      });
    },
    [],
  );

  const resetView = useCallback(() => {
    setActiveViewId(null);
  }, []);

  return {
    views,
    activeViewId,
    activeView,
    saveView,
    loadView,
    deleteView,
    renameView,
    resetView,
  };
}

export { useViews };
