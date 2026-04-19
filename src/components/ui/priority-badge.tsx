import React from 'react';
import { StatusBadge } from './status-badge';

export interface PriorityBadgeProps {
  priority: 'high' | 'medium' | 'low';
  className?: string;
}

const priorityConfig = {
  high: { variant: 'error' as const, label: 'Urgent' },
  medium: { variant: 'warning' as const, label: 'Moyen' },
  low: { variant: 'success' as const, label: 'Bas' }
};

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <StatusBadge variant={config.variant} className={className}>
      {config.label}
    </StatusBadge>
  );
}