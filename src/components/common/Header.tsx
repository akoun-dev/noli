import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Accueil', href: '/' },
    { name: 'Comparer', href: '/comparer' },
    { name: 'À propos', href: '/a-propos' },
    { name: 'Contact', href: '/contact' },
  ];

  const dashboardPath =
    user?.role === 'INSURER'
      ? '/assureur/tableau-de-bord'
      : user?.role === 'ADMIN'
      ? '/admin/tableau-de-bord'
      : '/tableau-de-bord';

  const userNavigation = [
    { name: 'Mon profil', href: '/profil', icon: User },
    { name: 'Mon tableau de bord', href: dashboardPath, icon: Shield },
  ];

  return (
    <header className="bg-background shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">NOLI Assurance</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  location.pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-foreground">
                    Bonjour, {user?.firstName}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <User className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {userNavigation.map((item) => (
                        <DropdownMenuItem
                          key={item.name}
                          onClick={() => navigate(item.href)}
                          className="cursor-pointer"
                        >
                          <item.icon className="h-4 w-4 mr-2" />
                          {item.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="h-4 w-4 mr-2" />
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/auth/connexion">
                  <Button variant="ghost">Connexion</Button>
                </Link>
                <Link to="/auth/inscription">
                  <Button>S'inscrire</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <div className="border-t pt-4 mt-4">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground">
                      Bonjour, {user?.firstName}
                    </p>
                  </div>
                  {userNavigation.map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className="flex items-center px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className="border-t pt-4 mt-4 space-y-2">
                <Link
                  to="/auth/connexion"
                  className="block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Connexion
                </Link>
                <Link
                  to="/auth/inscription"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setIsMenuOpen(false)}
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
