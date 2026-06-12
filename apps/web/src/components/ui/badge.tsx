import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-slate-100 text-slate-600',
  LEFT: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export function Badge({ value }: { value: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles[value] ?? 'bg-slate-100 text-slate-600',
      )}
    >
      {value}
    </span>
  );
}
