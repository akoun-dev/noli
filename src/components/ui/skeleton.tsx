import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  lines = 1,
  ...props
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-muted';

  const variantClasses = {
    default: 'h-4 w-full rounded-md',
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md'
  };

  const style = {
    width: width || undefined,
    height: height || undefined
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseClasses,
              variantClasses.text,
              i === lines - 1 ? 'w-3/4' : 'w-full'
            )}
            style={{
              width: i === lines - 1 ? '75%' : '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={style}
      {...props}
    />
  );
}

// Composant pour le skeleton d'une carte
interface CardSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  showAvatar?: boolean;
  showTitle?: boolean;
  showDescription?: boolean;
  showFooter?: boolean;
}

function CardSkeleton({
  className,
  showAvatar = true,
  showTitle = true,
  showDescription = true,
  showFooter = true,
  ...props
}: CardSkeletonProps) {
  return (
    <div className={cn('p-6 rounded-lg border bg-card', className)} {...props}>
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="60%" height={14} />
          </div>
        </div>
      )}

      {showTitle && (
        <Skeleton className="mb-2" height={24} width="70%" />
      )}

      {showDescription && (
        <div className="space-y-2 mb-4">
          <Skeleton lines={3} />
        </div>
      )}

      {showFooter && (
        <div className="flex justify-between items-center pt-4 border-t">
          <Skeleton width={80} height={20} />
          <Skeleton width={100} height={32} />
        </div>
      )}
    </div>
  );
}

// Composant pour le skeleton d'une table
interface TableSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

function TableSkeleton({
  className,
  rows = 5,
  columns = 4,
  showHeader = true,
  ...props
}: TableSkeletonProps) {
  return (
    <div className={cn('w-full', className)} {...props}>
      {showHeader && (
        <div className="flex border-b pb-2 mb-2">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className="mr-4"
              height={20}
              width={i === 0 ? '150px' : '100px'}
            />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex border-b pb-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="mr-4"
                height={16}
                width={
                  colIndex === 0
                    ? '120px'
                    : colIndex === columns - 1
                    ? '80px'
                    : '100px'
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour le skeleton d'une liste
interface ListSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number;
  showAvatar?: boolean;
}

function ListSkeleton({
  className,
  items = 5,
  showAvatar = true,
  ...props
}: ListSkeletonProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          {showAvatar && (
            <Skeleton variant="circular" width={40} height={40} />
          )}
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" height={16} />
            <Skeleton width="60%" height={14} />
          </div>
          <Skeleton width={60} height={24} />
        </div>
      ))}
    </div>
  );
}

// Composant pour le skeleton de statistiques
interface StatsSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  items?: number;
}

function StatsSkeleton({
  className,
  items = 4,
  ...props
}: StatsSkeletonProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-6 rounded-lg border bg-card">
          <div className="flex items-center justify-between mb-2">
            <Skeleton width={60} height={16} />
            <Skeleton variant="circular" width={32} height={32} />
          </div>
          <Skeleton height={32} width="80%" className="mb-2" />
          <Skeleton width={100} height={14} />
        </div>
      ))}
    </div>
  );
}

// Composant pour le skeleton de formulaire
interface FormSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  fields?: number;
  showButton?: boolean;
}

function FormSkeleton({
  className,
  fields = 4,
  showButton = true,
  ...props
}: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton width={120} height={16} />
          <Skeleton height={40} />
        </div>
      ))}

      {showButton && (
        <div className="flex justify-end space-x-4">
          <Skeleton width={80} height={40} />
          <Skeleton width={120} height={40} />
        </div>
      )}
    </div>
  );
}

export {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  StatsSkeleton,
  FormSkeleton
};
