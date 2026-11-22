// =============================================================================
// BUY-FLOW FRONTEND - Badge Component
// =============================================================================

import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'bg-primary text-primary-foreground',
        variant === 'secondary' && 'bg-secondary text-secondary-foreground',
        variant === 'destructive' && 'bg-destructive text-destructive-foreground',
        variant === 'success' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        variant === 'warning' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        variant === 'outline' && 'border border-border bg-transparent',
        className
      )}
      {...props}
    />
  );
}

// Status-specific badges
export function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'> = {
    active: 'success',
    approved: 'success',
    completed: 'success',
    draft: 'outline',
    pending: 'warning',
    in_progress: 'default',
    under_review: 'default',
    rejected: 'destructive',
    cancelled: 'destructive',
    returned: 'warning',
    homologated: 'success',
    suspended: 'secondary',
    expired: 'destructive',
    delivered: 'success',
    invoiced: 'default',
    paid: 'success',
  };

  return <Badge variant={variants[status] || 'outline'}>{status.replace('_', ' ')}</Badge>;
}