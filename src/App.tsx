import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider } from '@/contexts/AuthContext'
import { UserProvider } from '@/contexts/UserContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { CSPProvider } from '@/components/security/CSPProvider'
import { SecurityInitializer } from '@/components/security/SecurityInitializer'
import { PublicLayout } from '@/layouts/PublicLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { InsurerLayout } from '@/layouts/InsurerLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AuthGuard } from '@/guards/AuthGuard'
import { RoleGuard } from '@/guards/RoleGuard'

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Public Pages - Lazy loaded
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Auth Pages - Lazy loaded
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/features/auth/pages/ResetPasswordPage'));

// Dashboard Pages - Lazy loaded
const UserDashboardPage = lazy(() => import('@/pages/user/UserDashboardPage'));
const InsurerDashboardPage = lazy(() => import('@/pages/insurer/InsurerDashboardPage'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminSupervisionPage = lazy(() => import('@/pages/admin/AdminSupervisionPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminInsurersPage = lazy(() => import('@/pages/admin/AdminInsurersPage'));
const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'));
const AdminDataManagementPage = lazy(() => import('@/pages/admin/AdminDataManagementPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminModerationPage = lazy(() => import('@/pages/admin/AdminModerationPage'));
const AdminOffersPage = lazy(() => import('@/pages/admin/AdminOffersPage'));
const AdminDevisPage = lazy(() => import('@/pages/admin/AdminDevisPage'));
const AdminTarificationPage = lazy(() => import('@/pages/admin/AdminTarificationPage'));
const AuditLogsPage = lazy(() => import('@/features/admin/components/AuditLogsPage').then(module => ({ default: module.AuditLogsPage })));
const RoleManagementPage = lazy(() => import('@/features/admin/components/RoleManagementPage').then(module => ({ default: module.RoleManagementPage })));
const BackupRestorePage = lazy(() => import('@/features/admin/components/BackupRestorePage').then(module => ({ default: module.BackupRestorePage })));
const UserQuotesPage = lazy(() => import('@/features/user/pages/UserQuotesPage'));
const UserPoliciesPage = lazy(() => import('@/features/user/pages/UserPoliciesPage'));
const UserProfilePage = lazy(() => import('@/features/user/pages/UserProfilePage'));
const UserNotificationsPage = lazy(() => import('@/features/user/pages/UserNotificationsPage'));
const DocumentsPage = lazy(() => import('@/pages/user/DocumentsPage'));
const MyReviewsPage = lazy(() => import('@/pages/user/MyReviewsPage'));
const PaymentsPage = lazy(() => import('@/features/payments/pages/PaymentsPage'));
const ComparisonHistoryPage = lazy(() => import('@/features/comparison/pages/ComparisonHistoryPage'));
const InsurerOffersPage = lazy(() => import('@/pages/insurer/InsurerOffersPage'));
const InsurerQuotesPage = lazy(() => import('@/pages/insurer/InsurerQuotesPage'));
const InsurerAnalyticsPage = lazy(() => import('@/pages/insurer/InsurerAnalyticsPage'));
const InsurerNotificationsPage = lazy(() => import('@/pages/insurer/InsurerNotificationsPage'));

// Feature Pages - Lazy loaded
const ComparisonPage = lazy(() => import('@/features/comparison/pages/ComparisonPage'));
const OfferListPage = lazy(() => import('@/features/offers/pages/OfferListPage'));

const queryClient = new QueryClient()

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SecurityInitializer>
      <CSPProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ThemeProvider>
              <AuthProvider>
                <Routes>
                  {/* Public Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path='/' element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
                    <Route path='/a-propos' element={<Suspense fallback={<PageLoader />}><AboutPage /></Suspense>} />
                    <Route path='/contact' element={<Suspense fallback={<PageLoader />}><ContactPage /></Suspense>} />
                  </Route>

                  {/* Auth Routes */}
                  <Route path='/auth/connexion' element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
                  <Route path='/auth/inscription' element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
                  <Route path='/auth/mot-de-passe-oublie' element={<Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>} />
                  <Route path='/auth/reinitialiser-mot-de-passe' element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />

                  {/* Comparison Routes */}
                  <Route path='/comparer' element={<Suspense fallback={<PageLoader />}><ComparisonPage /></Suspense>} />

                  {/* Offer Routes */}
                  <Route path='/offres' element={<Suspense fallback={<PageLoader />}><OfferListPage /></Suspense>} />
                  <Route path='/comparison/results' element={<Suspense fallback={<PageLoader />}><OfferListPage /></Suspense>} />

                  {/* Protected User Routes */}
                  <Route element={<AuthGuard requiredRole='USER' />}>
                    <Route
                      element={
                        <UserProvider>
                          <UserLayout />
                        </UserProvider>
                      }
                    >
                      <Route path='/tableau-de-bord' element={<Suspense fallback={<PageLoader />}><UserDashboardPage /></Suspense>} />
                      <Route path='/profil' element={<Suspense fallback={<PageLoader />}><UserProfilePage /></Suspense>} />
                      <Route path='/mes-devis' element={<Suspense fallback={<PageLoader />}><UserQuotesPage /></Suspense>} />
                      <Route path='/mes-contrats' element={<Suspense fallback={<PageLoader />}><UserPoliciesPage /></Suspense>} />
                      <Route path='/paiements' element={<Suspense fallback={<PageLoader />}><PaymentsPage /></Suspense>} />
                      <Route path='/historique-comparaisons' element={<Suspense fallback={<PageLoader />}><ComparisonHistoryPage /></Suspense>} />
                      <Route path='/notifications' element={<Suspense fallback={<PageLoader />}><UserNotificationsPage /></Suspense>} />
                      <Route path='/documents' element={<Suspense fallback={<PageLoader />}><DocumentsPage /></Suspense>} />
                      <Route path='/mes-avis' element={<Suspense fallback={<PageLoader />}><MyReviewsPage /></Suspense>} />
                      <Route path='/parametres' element={<Suspense fallback={<PageLoader />}><div>User Settings</div></Suspense>} />
                    </Route>
                  </Route>

                  {/* Protected Insurer Routes */}
                  <Route element={<AuthGuard requiredRole='INSURER' />}>
                    <Route element={<InsurerLayout />}>
                      <Route path='/assureur/tableau-de-bord' element={<Suspense fallback={<PageLoader />}><InsurerDashboardPage /></Suspense>} />
                      <Route path='/assureur/offres' element={<Suspense fallback={<PageLoader />}><InsurerOffersPage /></Suspense>} />
                      <Route path='/assureur/devis' element={<Suspense fallback={<PageLoader />}><InsurerQuotesPage /></Suspense>} />
                      <Route path='/assureur/analytics' element={<Suspense fallback={<PageLoader />}><InsurerAnalyticsPage /></Suspense>} />
                      <Route
                        path='/assureur/notifications'
                        element={<Suspense fallback={<PageLoader />}><InsurerNotificationsPage /></Suspense>}
                      />
                      <Route path='/assureur/clients' element={<Suspense fallback={<PageLoader />}><div>Insurer Clients</div></Suspense>} />
                      <Route path='/assureur/parametres' element={<Suspense fallback={<PageLoader />}><div>Insurer Settings</div></Suspense>} />
                    </Route>
                  </Route>

                  {/* Protected Admin Routes */}
                  <Route element={<AuthGuard requiredRole='ADMIN' />}>
                    <Route element={<AdminLayout />}>
                      <Route path='/admin/tableau-de-bord' element={<Suspense fallback={<PageLoader />}><AdminDashboardPage /></Suspense>} />
                      <Route path='/admin/supervision' element={<Suspense fallback={<PageLoader />}><AdminSupervisionPage /></Suspense>} />
                      <Route path='/admin/utilisateurs' element={<Suspense fallback={<PageLoader />}><AdminUsersPage /></Suspense>} />
                      <Route path='/admin/assureurs' element={<Suspense fallback={<PageLoader />}><AdminInsurersPage /></Suspense>} />
                      <Route path='/admin/offres' element={<Suspense fallback={<PageLoader />}><AdminOffersPage /></Suspense>} />
                      <Route path='/admin/devis' element={<Suspense fallback={<PageLoader />}><AdminDevisPage /></Suspense>} />
                      <Route path='/admin/tarification' element={<Suspense fallback={<PageLoader />}><AdminTarificationPage /></Suspense>} />
                      <Route path='/admin/analytics' element={<Suspense fallback={<PageLoader />}><AdminAnalyticsPage /></Suspense>} />
                      <Route path='/admin/moderation' element={<Suspense fallback={<PageLoader />}><AdminModerationPage /></Suspense>} />
                      <Route path='/admin/donnees' element={<Suspense fallback={<PageLoader />}><AdminDataManagementPage /></Suspense>} />
                      <Route path='/admin/audit-logs' element={<Suspense fallback={<PageLoader />}><AuditLogsPage /></Suspense>} />
                      <Route path='/admin/roles' element={<Suspense fallback={<PageLoader />}><RoleManagementPage /></Suspense>} />
                      <Route path='/admin/backup-restore' element={<Suspense fallback={<PageLoader />}><BackupRestorePage /></Suspense>} />
                      <Route path='/admin/parametres' element={<Suspense fallback={<PageLoader />}><AdminSettingsPage /></Suspense>} />
                    </Route>
                  </Route>

                  {/* 404 Route */}
                  <Route path='*' element={<Suspense fallback={<PageLoader />}><NotFound /></Suspense>} />

                  {/* Fallback route pour éviter l'erreur "no Route matched" */}
                  <Route path='/error/no-route' element={<div><h1>Route non trouvée</h1><p>La route que vous recherchez n'existe pas.</p></div>} />
                </Routes>
              </AuthProvider>
            </ThemeProvider>
          </BrowserRouter>
        </TooltipProvider>
      </CSPProvider>
    </SecurityInitializer>
  </QueryClientProvider>
)

export default App
