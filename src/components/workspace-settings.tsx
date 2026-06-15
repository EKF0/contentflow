'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface WorkspaceSettingsProps {
  workspaceId: string;
  onClose: () => void;
}

type Tab = 'general' | 'members';

export function WorkspaceSettings({ workspaceId, onClose }: WorkspaceSettingsProps) {
  const [tab, setTab] = useState<Tab>('general');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);

  const utils = trpc.useUtils();

  const { data: workspace } = trpc.workspace.getById.useQuery({ workspaceId });
  const { data: members } = trpc.workspace.getMembers.useQuery({ workspaceId });

  const updateMutation = trpc.workspace.update.useMutation({
    onSuccess: () => {
      utils.workspace.getById.invalidate({ workspaceId });
      setEditingName(false);
      setEditingDesc(false);
    },
  });

  const inviteMutation = trpc.workspace.invite.useMutation({
    onSuccess: () => {
      utils.workspace.getMembers.invalidate({ workspaceId });
      setInviteEmail('');
    },
  });

  const removeMemberMutation = trpc.workspace.removeMember.useMutation({
    onSuccess: () => {
      utils.workspace.getMembers.invalidate({ workspaceId });
    },
  });

  const updateRoleMutation = trpc.workspace.updateMemberRole.useMutation({
    onSuccess: () => {
      utils.workspace.getMembers.invalidate({ workspaceId });
    },
  });

  const handleSaveName = () => {
    if (nameValue.trim()) {
      updateMutation.mutate({ workspaceId, name: nameValue.trim() });
    }
  };

  const handleSaveDesc = () => {
    updateMutation.mutate({ workspaceId, description: descValue });
  };

  const handleInvite = () => {
    if (inviteEmail.trim()) {
      inviteMutation.mutate({
        workspaceId,
        email: inviteEmail.trim(),
        role: inviteRole,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] bg-[var(--bg)] border border-[var(--border)] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[15px] font-semibold text-[var(--fg)]">Workspace Settings</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-lg leading-none">&times;</button>
        </div>

        <div className="flex border-b border-[var(--border)]">
          {(['general', 'members'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-5 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                tab === t
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]'
              )}
            >
              {t === 'general' ? 'General' : 'Members'}
            </button>
          ))}
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {tab === 'general' && workspace && (
            <div className="space-y-5">
              <div>
                <label className="text-[12px] font-medium text-[var(--fg-weak)] tracking-wide">Name</label>
                {editingName ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={nameValue}
                      onChange={(e) => setNameValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <Button size="sm" onClick={handleSaveName}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingName(false)}>Cancel</Button>
                  </div>
                ) : (
                  <div
                    className="mt-1 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--fg)] cursor-pointer hover:border-[var(--primary)]"
                    onClick={() => { setEditingName(true); setNameValue(workspace.name); }}
                  >
                    {workspace.name}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[12px] font-medium text-[var(--fg-weak)] tracking-wide">Description</label>
                {editingDesc ? (
                  <div className="space-y-2 mt-1">
                    <textarea
                      value={descValue}
                      onChange={(e) => setDescValue(e.target.value)}
                      className="w-full h-20 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[13px] text-[var(--fg)] resize-none focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-soft)]"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveDesc}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="mt-1 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--fg)] cursor-pointer hover:border-[var(--primary)] min-h-[36px]"
                    onClick={() => { setEditingDesc(true); setDescValue(workspace.description ?? ''); }}
                  >
                    {workspace.description || <span className="text-[var(--fg-muted)]">Add a description...</span>}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[12px] font-medium text-[var(--fg-weak)] tracking-wide">Icon</label>
                <div className="mt-1 px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--fg)]">
                  {workspace.icon || 'No icon'}
                </div>
              </div>
            </div>
          )}

          {tab === 'members' && (
            <div className="space-y-5">
              <div className="flex gap-2">
                <Input
                  placeholder="Email address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                  className="h-[var(--row-h)] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 text-[13px] text-[var(--fg)] focus:border-[var(--primary)] focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <Button
                  size="sm"
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviteMutation.isPending}
                >
                  Invite
                </Button>
              </div>

              {inviteMutation.error && (
                <p className="text-[12px] text-red-500">{inviteMutation.error.message}</p>
              )}

              <div className="space-y-2">
                {members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between py-2 px-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-[11px] font-medium">
                        {member.name?.charAt(0)?.toUpperCase() ?? member.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-[var(--fg)]">{member.name ?? 'Unknown'}</div>
                        <div className="text-[11px] text-[var(--fg-muted)]">{member.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={member.role}
                        onChange={(e) =>
                          updateRoleMutation.mutate({
                            workspaceId,
                            userId: member.id,
                            role: e.target.value as 'admin' | 'editor' | 'viewer',
                          })
                        }
                        className="text-[12px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg)] px-2 py-1 text-[var(--fg)] focus:outline-none"
                        disabled={member.role === 'owner'}
                      >
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      {member.role !== 'owner' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() =>
                            removeMemberMutation.mutate({ workspaceId, userId: member.id })
                          }
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end px-5 py-3 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
