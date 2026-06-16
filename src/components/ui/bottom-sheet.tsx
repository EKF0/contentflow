'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
}

function BottomSheet({ isOpen, onClose, children, className, fullScreen = false }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    setDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      currentY.current = delta;
      setDragOffset(delta);
    }
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
    if (currentY.current > 100) {
      onClose();
    }
    currentY.current = 0;
    setDragOffset(0);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] md:hidden">
      <div
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-label="Bottom sheet"
        className={cn(
          'absolute bottom-0 left-0 right-0 bg-[var(--bg)] rounded-t-2xl shadow-lg',
          fullScreen ? 'max-h-[95vh]' : 'max-h-[80vh]',
          dragging ? '' : 'sheet-enter',
          className,
        )}
        style={{ transform: `translateY(${dragOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="drag-handle" />
        </div>
        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: fullScreen ? 'calc(95vh - 32px)' : 'calc(80vh - 32px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { BottomSheet };
