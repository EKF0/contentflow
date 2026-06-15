'use client';

import { cn } from '@/lib/utils';

type AvatarSize = 'sm' | 'md' | 'lg';

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'h-[22px] w-[22px] text-[9px]',
  md: 'h-[28px] w-[28px] text-[11px]',
  lg: 'h-[36px] w-[36px] text-[13px]',
};

interface AvatarProps {
  initials: string;
  color: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

function Avatar({ initials, color, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full font-semibold text-white flex-shrink-0',
        sizeStyles[size],
        className,
      )}
      style={{ background: color }}
      title={name}
    >
      {initials}
    </div>
  );
}

interface AvatarStackProps {
  members: { initials: string; color: string; name: string }[];
  className?: string;
}

function AvatarStack({ members, className }: AvatarStackProps) {
  return (
    <div className={cn('flex', className)} aria-label="Team members">
      {members.map((member, i) => (
        <div
          key={member.name}
          className={cn(
            'inline-flex items-center justify-center rounded-full border-2 font-semibold text-white',
            'h-[28px] w-[28px] text-[11px]',
            i > 0 && '-ml-1.5',
          )}
          style={{
            background: member.color,
            borderColor: 'var(--bg)',
          }}
          title={member.name}
        >
          {member.initials}
        </div>
      ))}
    </div>
  );
}

export { Avatar, AvatarStack, type AvatarSize };
