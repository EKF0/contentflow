export interface BillingUsage {
  records: { used: number; limit: number | null; percentage: number | null };
  storage: { used: number; limit: number | null; percentage: number | null };
  team: { used: number; limit: number | null };
  tier: string;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getUsageColor(percentage: number | null): string {
  if (percentage === null) return 'text-muted-foreground';
  if (percentage >= 90) return 'text-red-600';
  if (percentage >= 70) return 'text-amber-600';
  return 'text-emerald-600';
}
