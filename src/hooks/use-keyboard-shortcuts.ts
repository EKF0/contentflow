'use client';

import { useEffect, useCallback, useRef } from 'react';

type Modifier = 'meta' | 'ctrl' | 'shift' | 'alt';

interface Shortcut {
  key: string;
  modifiers: Modifier[];
  handler: (e: KeyboardEvent) => void;
  description: string;
  category: string;
}

interface ShortcutRegistration {
  id: string;
  enabled: boolean;
}

function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const shortcutsRef = useRef(shortcuts);
  const registrationsRef = useRef<Map<string, ShortcutRegistration>>(new Map());
  const enabledRef = useRef(true);

  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabledRef.current) return;

    for (const shortcut of shortcutsRef.current) {
      const reg = registrationsRef.current.get(shortcut.description);
      if (reg && !reg.enabled) continue;

      const isMeta = e.metaKey || e.ctrlKey;
      const needsMeta = shortcut.modifiers.includes('meta') || shortcut.modifiers.includes('ctrl');
      const needsShift = shortcut.modifiers.includes('shift');
      const needsAlt = shortcut.modifiers.includes('alt');

      if (needsMeta && !isMeta) continue;
      if (needsShift && !e.shiftKey) continue;
      if (needsAlt && !e.altKey) continue;
      if (!needsMeta && isMeta) continue;

      const key = e.key.toLowerCase();
      if (key !== shortcut.key.toLowerCase()) continue;

      e.preventDefault();
      shortcut.handler(e);
      return;
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const enable = useCallback((id: string) => {
    registrationsRef.current.set(id, { id, enabled: true });
  }, []);

  const disable = useCallback((id: string) => {
    registrationsRef.current.set(id, { id, enabled: false });
  }, []);

  const toggle = useCallback((id: string) => {
    const reg = registrationsRef.current.get(id);
    if (reg) {
      registrationsRef.current.set(id, { ...reg, enabled: !reg.enabled });
    }
  }, []);

  return { enable, disable, toggle };
}

function getModifierSymbol(modifier: Modifier): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac');
  switch (modifier) {
    case 'meta':
      return isMac ? '\u2318' : 'Ctrl';
    case 'ctrl':
      return isMac ? '\u2303' : 'Ctrl';
    case 'shift':
      return isMac ? '\u21E7' : 'Shift';
    case 'alt':
      return isMac ? '\u2325' : 'Alt';
    default:
      return modifier;
  }
}

function formatShortcut(modifiers: Modifier[], key: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.startsWith('Mac');
  const parts = modifiers.map(getModifierSymbol);
  const keyDisplay = key.length === 1 ? key.toUpperCase() : key.charAt(0).toUpperCase() + key.slice(1);
  return isMac
    ? [...parts, keyDisplay].join('')
    : [...parts, keyDisplay].join('+');
}

export { useKeyboardShortcuts, getModifierSymbol, formatShortcut };
export type { Shortcut, Modifier };
