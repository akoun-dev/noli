/**
 * Routes avec lazy loading pour optimiser les performances
 * Sépare le code en chunks pour un chargement plus rapide
 */

import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Composant de chargement réutilisable
export const LoadingSpinner = () => (
  <div className='min-h-screen flex items-center justify-center bg-gray-50'>
    <div className='text-center'>
      <Loader2 className='h-8 w-8 animate-spin text-blue-600 mx-auto mb-4' />
      <p className='text-gray-600'>Chargement...</p>
    </div>
  </div>
)

// Wrapper pour les composants lazy-loaded
export const LazyWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
)

// Pages publiques - Priorité haute (chargées rapidement)
export const HomePage = lazy(() => import('@/pages/public/HomePage'))
export const AboutPage = lazy(() => import('@/pages/public/AboutPage'))
export const ContactPage = lazy(() => import('@/pages/public/ContactPage'))

// Pages d'authentification - Priorité haute
export const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
export const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
export const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))

// Pages fonctionnelles principales - Priorité haute
export const ComparisonPage = lazy(() => import('@/features/comparison/pages/ComparisonPage'))
export const OfferListPage = lazy(() => import('@/features/offers/pages/OfferListPage'))

// Dashboards - Priorité moyenne (chargés après connexion)
export const UserDashboardPage = lazy(() => import('@/pages/user/UserDashboardPage'))
export const InsurerDashboardPage = lazy(() => import('@/pages/insurer/InsurerDashboardPage'))
export const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'))

// Pages utilisateur - Priorité moyenne
export const UserProfilePage = lazy(() => import('@/pages/user/UserProfilePage'))
export const UserQuotesPage = lazy(() => import('@/pages/user/UserQuotesPage'))
export const UserPoliciesPage = lazy(() => import('@/pages/user/UserPoliciesPage'))
export const PaymentsPage = lazy(() => import('@/pages/user/PaymentsPage'))
export const ComparisonHistoryPage = lazy(() => import('@/pages/user/ComparisonHistoryPage'))
export const UserNotificationsPage = lazy(() => import('@/pages/user/UserNotificationsPage'))
export const DocumentsPage = lazy(() => import('@/pages/user/DocumentsPage'))
export const MyReviewsPage = lazy(() => import('@/pages/user/MyReviewsPage'))

// Pages assureur - Priorité moyenne
export const InsurerOffersPage = lazy(() => import('@/pages/insurer/InsurerOffersPage'))
export const InsurerQuotesPage = lazy(() => import('@/pages/insurer/InsurerQuotesPage'))
export const InsurerAnalyticsPage = lazy(() => import('@/pages/insurer/InsurerAnalyticsPage'))
export const InsurerNotificationsPage = lazy(
  () => import('@/pages/insurer/InsurerNotificationsPage')
)

// Pages admin - Priorité basse (chargées à la demande)
export const AdminSupervisionPage = lazy(() => import('@/pages/admin/AdminSupervisionPage'))
export const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'))
export const AdminInsurersPage = lazy(() => import('@/pages/admin/AdminInsurersPage'))
export const AdminSettingsPage = lazy(() => import('@/pages/admin/AdminSettingsPage'))
export const AdminDataManagementPage = lazy(() => import('@/pages/admin/AdminDataManagementPage'))
export const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'))
export const AdminModerationPage = lazy(() => import('@/pages/admin/AdminModerationPage'))
export const AdminOffersPage = lazy(() => import('@/pages/admin/AdminOffersPage'))
export const AdminTarificationPage = lazy(() => import('@/pages/admin/AdminTarificationPage'))

// Composants admin complexes - Très basse priorité
export const AuditLogsPage = lazy(() => import('@/features/admin/components/AuditLogsPage'))
export const RoleManagementPage = lazy(
  () => import('@/features/admin/components/RoleManagementPage')
)
export const BackupRestorePage = lazy(() => import('@/features/admin/components/BackupRestorePage'))

// Page 404 - Priorité haute
export const NotFound = lazy(() => import('@/pages/NotFound'))
