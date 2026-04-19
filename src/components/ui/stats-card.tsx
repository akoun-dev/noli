import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: LucideIcon;
  className?: string;
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  className
}: StatsCardProps) {
  const changeColors = {
    increase: 'text-green-600 dark:text-green-400',
    decrease: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground'
  };

  return (
    <Card className={cn('responsive-card', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground responsive-text-sm">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {value}
            </p>
            {change && (
              <p className={cn('text-xs mt-1', changeColors[changeType])}>
                {change}
              </p>
            )}
          </div>
          <div className="ml-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}