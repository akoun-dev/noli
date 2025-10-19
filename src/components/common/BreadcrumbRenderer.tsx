import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import { useBreadcrumb, useBusinessBreadcrumb, type BreadcrumbItem } from '@/hooks/useBreadcrumb';

interface BreadcrumbRendererProps {
  items?: BreadcrumbItem[];
  businessType?: 'comparison' | 'user' | 'admin' | 'insurer';
  maxItems?: number;
  showHome?: boolean;
  className?: string;
}

export function BreadcrumbRenderer({
  items: customItems,
  businessType,
  maxItems = 4,
  showHome = true,
  className,
}: BreadcrumbRendererProps) {
  const { items } = useBusinessBreadcrumb(businessType!) as { items: (BreadcrumbItem & { isEllipsis?: boolean })[] };

  const { items: defaultItems } = useBreadcrumb({
    items: customItems,
    maxItems,
    showHome,
  });

  const finalItems = customItems?.length > 0 ? defaultItems : items;

  if (!finalItems || finalItems.length === 0) {
    return null;
  }

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {finalItems.map((item, index) => {
          if (item.isEllipsis) {
            return (
              <React.Fragment key={`ellipsis-${index}`}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            );
          }

          const isLast = index === finalItems.length - 1;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 && !finalItems[index - 1]?.isEllipsis && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {item.href && !isLast ? (
                  <BreadcrumbLink href={item.href}>
                    {item.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

// Composant spécifique pour les pages de comparaison
export function ComparisonBreadcrumb({ className }: { className?: string }) {
  return (
    <BreadcrumbRenderer
      businessType="comparison"
      className={className}
    />
  );
}

// Composant spécifique pour les pages utilisateur
export function UserBreadcrumb({ className }: { className?: string }) {
  return (
    <BreadcrumbRenderer
      businessType="user"
      className={className}
    />
  );
}

// Composant spécifique pour les pages d'administration
export function AdminBreadcrumb({ className }: { className?: string }) {
  return (
    <BreadcrumbRenderer
      businessType="admin"
      className={className}
    />
  );
}

// Composant spécifique pour les pages assureur
export function InsurerBreadcrumb({ className }: { className?: string }) {
  return (
    <BreadcrumbRenderer
      businessType="insurer"
      className={className}
    />
  );
}