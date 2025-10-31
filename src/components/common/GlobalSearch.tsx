import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Home,
  FileText,
  Shield,
  Car,
  Users,
  Settings,
  Search,
  PieChart,
  Building,
  Phone,
  Mail,
  HelpCircle,
  ChevronRight,
  User,
  LogOut,
  Plus,
  TrendingUp,
  Calendar,
  CreditCard,
  MessageSquare,
  BarChart3,
  FileCheck,
  AlertCircle,
  Clock,
  CheckCircle,
  X,
  Bell,
  Zap,
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'actions' | 'help' | 'user';
}

export function GlobalSearch() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { isOpen, openSearch, closeSearch, searchResults: customResults } = useGlobalSearch();

  // Navigation items
  const navigationItems: SearchResult[] = [
    {
      id: 'home',
      title: 'Accueil',
      description: 'Page d\'accueil principale',
      icon: Home,
      shortcut: '⌘A',
      action: () => {
        navigate('/');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'dashboard',
      title: 'Tableau de bord',
      description: 'Votre espace personnel',
      icon: PieChart,
      shortcut: '⌘D',
      action: () => {
        navigate('/tableau-de-bord');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'compare',
      title: 'Nouvelle comparaison',
      description: 'Comparer des assurances',
      icon: Car,
      shortcut: '⌘C',
      action: () => {
        navigate('/comparer');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'quotes',
      title: 'Mes devis',
      description: 'Voir tous vos devis',
      icon: FileText,
      action: () => {
        navigate('/mes-devis');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'policies',
      title: 'Mes contrats',
      description: 'Gérer vos contrats actifs',
      icon: Shield,
      action: () => {
        navigate('/mes-contrats');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'profile',
      title: 'Mon profil',
      description: 'Modifier mes informations',
      icon: User,
      action: () => {
        navigate('/profil');
        setOpen(false);
      },
      category: 'navigation',
    },
  ];

  // Admin navigation items
  const adminNavigationItems: SearchResult[] = [
    {
      id: 'admin-dashboard',
      title: 'Admin - Tableau de bord',
      description: 'Administration principale',
      icon: BarChart3,
      action: () => {
        navigate('/admin');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'admin-users',
      title: 'Admin - Utilisateurs',
      description: 'Gérer les utilisateurs',
      icon: Users,
      action: () => {
        navigate('/admin/utilisateurs');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'admin-insurers',
      title: 'Admin - Assureurs',
      description: 'Gérer les assureurs',
      icon: Building,
      action: () => {
        navigate('/admin/assureurs');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'admin-analytics',
      title: 'Admin - Analytics',
      description: 'Statistiques et rapports',
      icon: TrendingUp,
      action: () => {
        navigate('/admin/analytics');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'admin-settings',
      title: 'Admin - Paramètres',
      description: 'Configuration système',
      icon: Settings,
      action: () => {
        navigate('/admin/parametres');
        setOpen(false);
      },
      category: 'navigation',
    },
  ];

  // Quick actions
  const actionItems: SearchResult[] = [
    {
      id: 'new-quote',
      title: 'Créer un nouveau devis',
      description: 'Démarrer une nouvelle comparaison',
      icon: Plus,
      action: () => {
        navigate('/comparer');
        setOpen(false);
      },
      category: 'actions',
    },
    {
      id: 'contact-support',
      title: 'Contacter le support',
      description: 'Obtenir de l\'aide',
      icon: MessageSquare,
      action: () => {
        navigate('/contact');
        setOpen(false);
      },
      category: 'actions',
    },
    {
      id: 'view-payments',
      title: 'Mes paiements',
      description: 'Historique des paiements',
      icon: CreditCard,
      action: () => {
        navigate('/paiements');
        setOpen(false);
      },
      category: 'actions',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Voir mes notifications',
      icon: Bell,
      action: () => {
        navigate('/notifications');
        setOpen(false);
      },
      category: 'actions',
    },
  ];

  // Help items
  const helpItems: SearchResult[] = [
    {
      id: 'help-center',
      title: 'Centre d\'aide',
      description: 'Documentation et tutoriels',
      icon: HelpCircle,
      action: () => {
        navigate('/aide');
        setOpen(false);
      },
      category: 'help',
    },
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Questions fréquentes',
      icon: FileCheck,
      action: () => {
        navigate('/faq');
        setOpen(false);
      },
      category: 'help',
    },
    {
      id: 'contact',
      title: 'Nous contacter',
      description: 'Coordonnées et formulaire',
      icon: Phone,
      action: () => {
        navigate('/contact');
        setOpen(false);
      },
      category: 'help',
    },
  ];

  // User actions
  const userItems: SearchResult[] = [
    {
      id: 'logout',
      title: 'Se déconnecter',
      description: 'Quitter mon espace',
      icon: LogOut,
      action: () => {
        // Implémenter la déconnexion
        setOpen(false);
      },
      category: 'user',
    },
  ];

  // Combine all items
  const allItems = [
    ...navigationItems,
    ...adminNavigationItems,
    ...actionItems,
    ...helpItems,
    ...userItems,
    ...customResults,
  ];

  // Filter items based on search
  const filteredItems = allItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }

      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [isOpen, openSearch, closeSearch]);

  // Get category title
  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'navigation':
        return 'Navigation';
      case 'actions':
        return 'Actions rapides';
      case 'help':
        return 'Aide et support';
      case 'user':
        return 'Compte';
      default:
        return category;
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'navigation':
        return Home;
      case 'actions':
        return Zap;
      case 'help':
        return HelpCircle;
      case 'user':
        return User;
      case 'custom':
        return Search;
      default:
        return Search;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={closeSearch}>
        <DialogContent className="p-0 overflow-hidden shadow-2xl">
          <Command className="rounded-lg border shadow-md">
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput
                placeholder="Rechercher une page, une action ou de l'aide..."
                value={search}
                onValueChange={setSearch}
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                onClick={closeSearch}
                className="ml-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fermer</span>
              </button>
            </div>
            <CommandList>
              <CommandEmpty>
                <div className="flex flex-col items-center py-6 text-center">
                  <Search className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Aucun résultat trouvé</p>
                  <p className="text-xs text-muted-foreground mt-1">
        Essayez d'autres mots-clés
                  </p>
                </div>
              </CommandEmpty>

              {Object.entries(groupedItems).map(([category, items]) => (
                <CommandGroup
                  key={category}
                  heading={
                    <div className="flex items-center gap-2">
                      {React.createElement(getCategoryIcon(category), { className: "h-4 w-4" })}
                      <span>{getCategoryTitle(category)}</span>
                    </div>
                  }
                >
                  {items.map((item) => (
                    <CommandItem
                      key={item.id}
                      onSelect={() => item.action()}
                      className="flex items-center gap-2 px-2 py-2"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        )}
                      </div>
                      {item.shortcut && (
                        <CommandShortcut>{item.shortcut}</CommandShortcut>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>

      {/* Floating search button for mobile */}
      <button
        onClick={openSearch}
        className="lg:hidden fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        aria-label="Recherche globale"
      >
        <Search className="h-6 w-6" />
      </button>
    </>
  );
}