'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseRecordPanelReturn {
  selectedRecordId: number | null;
  isOpen: boolean;
  openPanel: (id: number) => void;
  closePanel: () => void;
}

export function useRecordPanel(): UseRecordPanelReturn {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = useCallback((id: number) => {
    setSelectedRecordId(id);
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
    setSelectedRecordId(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closePanel();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closePanel]);

  return { selectedRecordId, isOpen, openPanel, closePanel };
}
