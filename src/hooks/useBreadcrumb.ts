import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrent?: boolean;
}

interface BreadcrumbOptions {
  items?: BreadcrumbItem[];
  maxItems?: number;
  showHome?: boolean;
}

export function useBreadcrumb(options: BreadcrumbOptions = {}) {
  const { items: customItems = [], maxItems = 4, showHome = true } = options;
  const location = useLocation();

  const defaultItems = useMemo(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Ajouter l'accueil si demandé
    if (showHome && pathSegments.length > 0) {
      items.push({
        label: 'Accueil',
        href: '/',
      });
    }

    // Construire les éléments de navigation
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Convertir le segment en label lisible
      const label = segment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/([A-Z])/g, ' $1')
        .trim();

      const isCurrent = index === pathSegments.length - 1;

      items.push({
        label,
        href: isCurrent ? undefined : currentPath,
        isCurrent,
      });
    });

    return items;
  }, [location.pathname, showHome]);

  const items = useMemo(() => {
    if (customItems.length > 0) {
      return customItems;
    }

    const allItems = defaultItems;

    // Ajouter des ellipsis si trop d'éléments
    if (allItems.length > maxItems) {
      const firstItem = allItems[0];
      const lastItems = allItems.slice(-2);

      return [
        firstItem,
        {
          label: '...',
          isEllipsis: true,
        },
        ...lastItems,
      ] as (BreadcrumbItem & { isEllipsis?: boolean })[];
    }

    return allItems;
  }, [defaultItems, customItems, maxItems]);

  return {
    items,
    hasItems: items.length > 0,
    currentLabel: items.find(item => item.isCurrent)?.label || '',
  };
}

// Hook pour les breadcrumbs spécifiques aux flux métier
export function useBusinessBreadcrumb(breadcrumbType: 'comparison' | 'user' | 'admin' | 'insurer') {
  const location = useLocation();

  const getBusinessItems = (type: string): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);

    switch (type) {
      case 'comparison':
        return getComparisonBreadcrumbs(pathSegments);
      case 'user':
        return getUserBreadcrumbs(pathSegments);
      case 'admin':
        return getAdminBreadcrumbs(pathSegments);
      case 'insurer':
        return getInsurerBreadcrumbs(pathSegments);
      default:
        return [];
    }
  };

  return useBreadcrumb({
    items: getBusinessItems(breadcrumbType),
  });
}

function getComparisonBreadcrumbs(pathSegments: string[]): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Comparaison', href: '/comparer' },
  ];

  const comparisonSteps: Record<string, string> = {
    'informations': 'Informations personnelles',
    'vehicule': 'Véhicule',
    'besoins': 'Vos besoins',
    'offres': 'Offres disponibles',
    'details': 'Détails de l\'offre',
    'recapitulatif': 'Récapitulatif',
  };

  pathSegments.forEach((segment, index) => {
    if (comparisonSteps[segment]) {
      const isLast = index === pathSegments.length - 1;
      items.push({
        label: comparisonSteps[segment],
        href: isLast ? undefined : `/comparer/${segment}`,
        isCurrent: isLast,
      });
    }
  });

  return items;
}

function getUserBreadcrumbs(pathSegments: string[]): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Tableau de bord', href: '/tableau-de-bord' },
  ];

  const userPages: Record<string, string> = {
    'profil': 'Mon profil',
    'mes-devis': 'Mes devis',
    'mes-contrats': 'Mes contrats',
    'paiements': 'Paiements',
    'notifications': 'Notifications',
    'parametres': 'Paramètres',
  };

  pathSegments.forEach((segment, index) => {
    if (userPages[segment]) {
      const isLast = index === pathSegments.length - 1;
      items.push({
        label: userPages[segment],
        href: isLast ? undefined : `/${segment}`,
        isCurrent: isLast,
      });
    } else if (/^\d+$/.test(segment)) {
      // ID de devis/contrat
      items.push({
        label: `Détail #${segment}`,
        isCurrent: true,
      });
    }
  });

  return items;
}

function getAdminBreadcrumbs(pathSegments: string[]): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Administration', href: '/admin' },
  ];

  const adminPages: Record<string, string> = {
    'utilisateurs': 'Utilisateurs',
    'assureurs': 'Assureurs',
    'devis': 'Devis',
    'contrats': 'Contrats',
    'analytics': 'Analytics',
    'parametres': 'Paramètres',
    'supervision': 'Supervision',
  };

  pathSegments.forEach((segment, index) => {
    if (adminPages[segment]) {
      const isLast = index === pathSegments.length - 1;
      items.push({
        label: adminPages[segment],
        href: isLast ? undefined : `/admin/${segment}`,
        isCurrent: isLast,
      });
    } else if (/^\d+$/.test(segment)) {
      // ID d'élément
      items.push({
        label: `Détail #${segment}`,
        isCurrent: true,
      });
    }
  });

  return items;
}

function getInsurerBreadcrumbs(pathSegments: string[]): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [
    { label: 'Accueil', href: '/' },
    { label: 'Espace Assureur', href: '/assureur' },
  ];

  const insurerPages: Record<string, string> = {
    'tableau-de-bord': 'Tableau de bord',
    'offres': 'Mes offres',
    'devis': 'Devis reçus',
    'clients': 'Clients',
    'analytics': 'Statistiques',
    'parametres': 'Paramètres',
  };

  pathSegments.forEach((segment, index) => {
    if (insurerPages[segment]) {
      const isLast = index === pathSegments.length - 1;
      items.push({
        label: insurerPages[segment],
        href: isLast ? undefined : `/assureur/${segment}`,
        isCurrent: isLast,
      });
    } else if (/^\d+$/.test(segment)) {
      // ID d'élément
      items.push({
        label: `Détail #${segment}`,
        isCurrent: true,
      });
    }
  });

  return items;
}