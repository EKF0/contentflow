export type Status = 'Idea' | 'Drafting' | 'In Review' | 'Published' | 'Archived';

export type ContentType = 'Blog' | 'Newsletter' | 'Social' | 'Video' | 'Podcast';

export interface Assignee {
  name: string;
  initials: string;
  color: string;
}

export interface ContentRecord {
  id: number;
  title: string;
  status: Status;
  type: ContentType;
  assignee: number;
  date: string;
  words: number;
  featured: boolean;
  notes: string;
}

export interface FieldDef {
  key: keyof ContentRecord;
  label: string;
  type: 'text' | 'select' | 'collaborator' | 'date' | 'number' | 'checkbox';
  width: string;
  icon: string;
}

export const STATUSES: Status[] = ['Idea', 'Drafting', 'In Review', 'Published', 'Archived'];

export const TYPES: ContentType[] = ['Blog', 'Newsletter', 'Social', 'Video', 'Podcast'];

export const ASSIGNEES: Assignee[] = [
  { name: 'Sarah Chen', initials: 'SC', color: 'var(--avatar-1)' },
  { name: 'Marcus Rivera', initials: 'MR', color: 'var(--avatar-2)' },
  { name: 'Aisha Patel', initials: 'AP', color: 'var(--avatar-3)' },
  { name: "James O'Brien", initials: 'JO', color: 'var(--avatar-4)' },
  { name: 'Lena Kowalski', initials: 'LK', color: 'var(--avatar-5)' },
];

export const FIELDS: FieldDef[] = [
  { key: 'title', label: 'Title', type: 'text', width: '260px', icon: 'text' },
  { key: 'status', label: 'Status', type: 'select', width: '120px', icon: 'select' },
  { key: 'type', label: 'Type', type: 'select', width: '110px', icon: 'tag' },
  { key: 'assignee', label: 'Assignee', type: 'collaborator', width: '150px', icon: 'user' },
  { key: 'date', label: 'Publish Date', type: 'date', width: '120px', icon: 'calendar' },
  { key: 'words', label: 'Word Count', type: 'number', width: '100px', icon: 'number' },
  { key: 'featured', label: 'Featured', type: 'checkbox', width: '80px', icon: 'check' },
  { key: 'notes', label: 'Notes', type: 'text', width: '220px', icon: 'text' },
];
