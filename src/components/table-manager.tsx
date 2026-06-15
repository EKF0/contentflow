'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TableManagerProps {
  workspaceId: string;
  activeTableId?: string;
  onSelectTable: (tableId: string) => void;
}

export function TableManager({ workspaceId, activeTableId, onSelectTable }: TableManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingTableId, setDeletingTableId] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: tables } = trpc.table.list.useQuery({ workspaceId });

  const createMutation = trpc.table.create.useMutation({
    onSuccess: (table) => {
      utils.table.list.invalidate({ workspaceId });
      setNewTableName('');
      setIsAdding(false);
      onSelectTable(table.id);
    },
  });

  const updateMutation = trpc.table.update.useMutation({
    onSuccess: () => {
      utils.table.list.invalidate({ workspaceId });
      setEditingTableId(null);
    },
  });

  const deleteMutation = trpc.table.delete.useMutation({
    onSuccess: () => {
      utils.table.list.invalidate({ workspaceId });
      setDeletingTableId(null);
    },
  });

  const handleCreate = () => {
    if (newTableName.trim()) {
      createMutation.mutate({
        workspaceId,
        name: newTableName.trim(),
      });
    }
  };

  const handleRename = (tableId: string) => {
    if (editName.trim()) {
      updateMutation.mutate({ tableId, name: editName.trim() });
    }
  };

  const handleDelete = (tableId: string) => {
    deleteMutation.mutate({ tableId });
  };

  return (
    <div className="space-y-1">
      {tables?.map((table) => (
        <div
          key={table.id}
          className={cn(
            'group flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] cursor-pointer transition-colors',
            activeTableId === table.id
              ? 'bg-[var(--primary-soft)] text-[var(--primary)] font-medium'
              : 'text-[var(--fg-weak)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'
          )}
          onClick={() => onSelectTable(table.id)}
        >
          {table.icon && <span className="text-[14px]">{table.icon}</span>}

          {editingTableId === table.id ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleRename(table.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(table.id);
                if (e.key === 'Escape') setEditingTableId(null);
              }}
              autoFocus
              className="h-6 py-0 px-1 text-[13px]"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="flex-1 truncate"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setEditingTableId(table.id);
                setEditName(table.name);
              }}
            >
              {table.name}
            </span>
          )}

          <div className="hidden group-hover:flex items-center gap-1">
            <button
              className="text-[var(--fg-muted)] hover:text-[var(--fg)] p-0.5 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setEditingTableId(table.id);
                setEditName(table.name);
              }}
              title="Rename"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              className="text-[var(--fg-muted)] hover:text-red-500 p-0.5 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setDeletingTableId(table.id);
              }}
              title="Delete"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {isAdding ? (
        <div className="flex gap-2 px-2 py-1">
          <Input
            value={newTableName}
            onChange={(e) => setNewTableName(e.target.value)}
            placeholder="Table name"
            autoFocus
            className="h-7 text-[13px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') { setIsAdding(false); setNewTableName(''); }
            }}
          />
          <Button size="sm" onClick={handleCreate} disabled={!newTableName.trim()}>
            Add
          </Button>
        </div>
      ) : (
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-sm)] text-[13px] text-[var(--fg-muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)] w-full transition-colors"
          onClick={() => setIsAdding(true)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add table
        </button>
      )}

      {deletingTableId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-80 rounded-[var(--radius-lg)] bg-[var(--bg)] border border-[var(--border)] shadow-xl p-5">
            <h3 className="text-[14px] font-semibold text-[var(--fg)] mb-2">Delete table?</h3>
            <p className="text-[13px] text-[var(--fg-muted)] mb-4">
              This will permanently delete this table and all its records. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeletingTableId(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(deletingTableId)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
