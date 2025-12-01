import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, User, LogOut, Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    // Fermer le menu immédiatement et déclencher la déconnexion
    setIsMenuOpen(false)
    logout()
    // La redirection est maintenant gérée dans AuthContext.logout
  }

  // Fermer le menu mobile si l'utilisateur se déconnecte
  useEffect(() => {
    if (!isAuthenticated) setIsMenuOpen(false)
  }, [isAuthenticated])

  // Navigation publique (non connecté)
  // cspell:ignore NOLI
  const publicNavigation = [
    { name: 'Accueil', href: '/' },
    { name: 'À propos', href: '/a-propos' },
    { name: 'Contact', href: '/contact' },
  ]

  const navigation = isAuthenticated ? [] : publicNavigation

  const getUserNavigation = () => {
    if (!user) return []

    const dashboardPath =
      user.role === 'INSURER'
        ? '/assureur/tableau-de-bord'
        : user.role === 'ADMIN'
          ? '/admin/tableau-de-bord'
          : '/tableau-de-bord'

    return [
      { name: 'Mon profil', href: '/profil', icon: User },
      { name: 'Tableau de bord', href: dashboardPath, icon: Shield },
    ]
  }

  return (
    <header className='border-b border-border/60 bg-card/90 backdrop-blur-xl sticky top-0 z-50 shadow-[0px_10px_30px_rgba(23,24,23,0.05)]'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-20 gap-4'>
          {/* Logo */}
          <div className='flex items-center gap-4'>
            <Link to='/' className='flex items-center gap-2 group'>
              <img
                src="/img/noli vertical sans fond.png"
                alt="NOLI Comparateur"
                className="h-10 w-auto group-hover:opacity-80 transition-opacity"
              />
             
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className='hidden lg:flex items-center gap-6' aria-label='Navigation principale'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-semibold uppercase tracking-wide transition-colors relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform ${
                  location.pathname === item.href
                    ? 'text-foreground after:scale-x-100'
                    : 'text-muted-foreground hover:text-foreground hover:after:scale-x-100'
                }`}
                aria-current={location.pathname === item.href ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className='hidden lg:flex items-center space-x-3'>
            {isAuthenticated && user ? (
              <>
                <div className='flex items-center space-x-3'>
                  <span className='text-sm text-foreground'>Bonjour, {user.firstName}</span>
                  <ThemeToggle />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        aria-label='Menu utilisateur'
                        aria-haspopup='true'
                      >
                        <User className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-56' forceMount>
                      {getUserNavigation().map((item) => (
                        <DropdownMenuItem
                          key={item.name}
                          onClick={() => navigate(item.href)}
                          className='cursor-pointer'
                        >
                          <item.icon className='h-4 w-4 mr-2' />
                          {item.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                        <LogOut className='h-4 w-4 mr-2' />
                        {/* cspell:ignore Déconnexion */}
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className='flex items-center space-x-3'>
                <ThemeToggle />
                <Link to='/auth/connexion'>
                  <Button variant='ghost' size='sm' className='font-semibold text-foreground'>
                    Connexion
                  </Button>
                </Link>
                <Link to='/auth/inscription'>
                  <Button size='sm' className='font-semibold bg-secondary text-secondary-foreground'>
                    S'inscrire
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className='lg:hidden flex items-center space-x-2'>
            <Link to='/comparer'>
              <Button size='sm' className='bg-accent text-accent-foreground font-semibold px-4'>
                Passe à l'action
              </Button>
            </Link>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={isMenuOpen}
              aria-controls='mobile-menu'
            >
              {isMenuOpen ? <X className='h-6 w-6' /> : <Menu className='h-6 w-6' />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div
          id='mobile-menu'
          className='lg:hidden bg-card/95 backdrop-blur-xl border-t border-border/50'
          role='navigation'
          aria-label='Menu principal mobile'
        >
          <div className='px-4 pt-4 pb-6 space-y-3'>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-4 py-3 rounded-xl text-base font-semibold uppercase tracking-wide ${
                  location.pathname === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {isAuthenticated && user ? (
              <>
                <div className='border-t pt-4 mt-4 space-y-2'>
                  <div className='px-3 py-2'>
                    <p className='text-sm font-medium text-foreground'>Bonjour, {user.firstName}</p>
                  </div>
                  {getUserNavigation().map((item) => (
                    <Link
                      key={item.name}
                      to={item.href}
                      className='flex items-center px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent'
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <item.icon className='h-4 w-4 mr-2' />
                      {item.name}
                    </Link>
                  ))}
                  <button
                    onClick={handleLogout}
                    className='flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent'
                  >
                    <LogOut className='h-4 w-4 mr-2' />
                    {/* cspell:ignore Déconnexion */}
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <div className='border-t pt-4 mt-4 space-y-3'>
                <Link
                  to='/auth/connexion'
                  className='block px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-accent'
                  onClick={() => setIsMenuOpen(false)}
                >
                  {/* cspell:ignore Connexion */}
                  Connexion
                </Link>
                <Link
                  to='/auth/inscription'
                  className='block px-3 py-2 rounded-md text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90'
                  onClick={() => setIsMenuOpen(false)}
                >
                  {/* cspell:ignore S'inscrire */}
                  S'inscrire
                </Link>
              </div>
            )}
            <Link
              to='/comparer'
              className='block px-4 py-3 rounded-xl text-center font-semibold bg-accent text-accent-foreground'
              onClick={() => setIsMenuOpen(false)}
            >
              Passe à l'action
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
