import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-muted/70 dark:bg-muted/30', className)}
      {...props}
    />
  );
}
