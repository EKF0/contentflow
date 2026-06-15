import { cn } from '@/lib/utils';

type IconType = 'text' | 'select' | 'tag' | 'user' | 'calendar' | 'number' | 'check' | 'image' | 'attachment';

interface FieldIconProps {
  type: IconType;
  className?: string;
}

const icons: Record<IconType, string> = {
  text: 'M4 7V4h16v3M9 20h6M12 4v16',
  select: 'M6 9l6 6 6-6',
  tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 7a4 4 0 100-8 4 4 0 000 8',
  calendar: 'M3 4h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2zM16 2v4M8 2v4M3 10h18',
  number: 'M4 9h16M4 15h16M10 3l-2 18M16 3l-2 18',
  check: 'M20 6L9 17l-5-5',
  image: 'M3 3h18a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 8.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21',
  attachment: 'M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48',
};

function FieldIcon({ type, className }: FieldIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('h-3.5 w-3.5 flex-shrink-0 opacity-60', className)}
    >
      <path d={icons[type]} />
    </svg>
  );
}

export { FieldIcon, type IconType };
