/**
 * Routes optimisées avec lazy loading pour des performances maximales
 */

import { Routes, Route } from 'react-router-dom'
import { LazyWrapper } from './LazyRoutes'
import {
  // Pages publiques
  HomePage,
  AboutPage,
  ContactPage,

  // Pages d'authentification
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,

  // Pages fonctionnelles
  ComparisonPage,
  OfferListPage,

  // Dashboards
  UserDashboardPage,
  InsurerDashboardPage,
  AdminDashboardPage,

  // Pages utilisateur
  UserProfilePage,
  UserQuotesPage,
  UserPoliciesPage,
  PaymentsPage,
  ComparisonHistoryPage,
  UserNotificationsPage,
  DocumentsPage,
  MyReviewsPage,

  // Pages assureur
  InsurerOffersPage,
  InsurerQuotesPage,
  InsurerAnalyticsPage,
  InsurerNotificationsPage,

  // Pages admin
  AdminSupervisionPage,
  AdminUsersPage,
  AdminInsurersPage,
  AdminSettingsPage,
  AdminDataManagementPage,
  AdminAnalyticsPage,
  AdminModerationPage,
  AdminOffersPage,
  AdminDevisPage,
  AdminTarificationPage,
  AuditLogsPage,
  RoleManagementPage,
  BackupRestorePage,

  // Page 404
  NotFound,
} from './LazyRoutes'

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout'
import { UserLayout } from '@/layouts/UserLayout'
import { InsurerLayout } from '@/layouts/InsurerLayout'
import { AdminLayout } from '@/layouts/AdminLayout'

// Guards and Components
import { AuthGuard } from '@/guards/AuthGuard'
import { RoleGuard } from '@/guards/RoleGuard'
import { DashboardRedirect } from '@/components/auth/DashboardRedirect'

export const OptimizedAppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes - Priorité haute */}
      <Route element={<PublicLayout />}>
        <Route
          path='/'
          element={
            <LazyWrapper>
              <HomePage />
            </LazyWrapper>
          }
        />
        <Route
          path='/a-propos'
          element={
            <LazyWrapper>
              <AboutPage />
            </LazyWrapper>
          }
        />
        <Route
          path='/contact'
          element={
            <LazyWrapper>
              <ContactPage />
            </LazyWrapper>
          }
        />
      </Route>

      {/* Auth Routes - Priorité haute */}
      <Route
        path='/auth/connexion'
        element={
          <LazyWrapper>
            <LoginPage />
          </LazyWrapper>
        }
      />
      <Route
        path='/auth/inscription'
        element={
          <LazyWrapper>
            <RegisterPage />
          </LazyWrapper>
        }
      />
      <Route
        path='/auth/mot-de-passe-oublie'
        element={
          <LazyWrapper>
            <ForgotPasswordPage />
          </LazyWrapper>
        }
      />

      {/* Feature Routes - Priorité haute */}
      <Route
        path='/comparer'
        element={
          <LazyWrapper>
            <ComparisonPage />
          </LazyWrapper>
        }
      />
      <Route
        path='/offres'
        element={
          <LazyWrapper>
            <OfferListPage />
          </LazyWrapper>
        }
      />

      {/* Dashboard Redirect Route - Redirection automatique selon le rôle */}
      <Route
        path='/tableau-de-bord'
        element={
          <LazyWrapper>
            <AuthGuard>
              <DashboardRedirect />
            </AuthGuard>
          </LazyWrapper>
        }
      />

      {/* Protected User Routes - Priorité moyenne */}
      <Route element={<AuthGuard requiredRole='USER' />}>
        <Route element={<UserLayout />}>
          <Route
            path='/mes-devis'
            element={
              <LazyWrapper>
                <UserQuotesPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/profil'
            element={
              <LazyWrapper>
                <UserProfilePage />
              </LazyWrapper>
            }
          />
          <Route
            path='/mes-devis'
            element={
              <LazyWrapper>
                <UserQuotesPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/mes-contrats'
            element={
              <LazyWrapper>
                <UserPoliciesPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/paiements'
            element={
              <LazyWrapper>
                <PaymentsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/historique-comparaisons'
            element={
              <LazyWrapper>
                <ComparisonHistoryPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/notifications'
            element={
              <LazyWrapper>
                <UserNotificationsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/documents'
            element={
              <LazyWrapper>
                <DocumentsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/mes-avis'
            element={
              <LazyWrapper>
                <MyReviewsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/parametres'
            element={
              <LazyWrapper>
                <div>User Settings</div>
              </LazyWrapper>
            }
          />
        </Route>
      </Route>

      {/* Protected Insurer Routes - Priorité moyenne */}
      <Route element={<AuthGuard requiredRole='INSURER' />}>
        <Route element={<InsurerLayout />}>
          <Route
            path='/assureur/tableau-de-bord'
            element={
              <LazyWrapper>
                <InsurerDashboardPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/assureur/offres'
            element={
              <LazyWrapper>
                <InsurerOffersPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/assureur/devis'
            element={
              <LazyWrapper>
                <InsurerQuotesPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/assureur/analytics'
            element={
              <LazyWrapper>
                <InsurerAnalyticsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/assureur/notifications'
            element={
              <LazyWrapper>
                <InsurerNotificationsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/assureur/parametres'
            element={
              <LazyWrapper>
                <div>Insurer Settings</div>
              </LazyWrapper>
            }
          />
        </Route>
      </Route>

      {/* Protected Admin Routes - Priorité basse */}
      <Route element={<AuthGuard requiredRole='ADMIN' />}>
        <Route element={<AdminLayout />}>
          <Route
            path='/admin/tableau-de-bord'
            element={
              <LazyWrapper>
                <AdminDashboardPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/supervision'
            element={
              <LazyWrapper>
                <AdminSupervisionPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/utilisateurs'
            element={
              <LazyWrapper>
                <AdminUsersPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/assureurs'
            element={
              <LazyWrapper>
                <AdminInsurersPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/offres'
            element={
              <LazyWrapper>
                <AdminOffersPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/devis'
            element={
              <LazyWrapper>
                <AdminDevisPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/tarification'
            element={
              <LazyWrapper>
                <AdminTarificationPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/analytics'
            element={
              <LazyWrapper>
                <AdminAnalyticsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/moderation'
            element={
              <LazyWrapper>
                <AdminModerationPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/donnees'
            element={
              <LazyWrapper>
                <AdminDataManagementPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/audit-logs'
            element={
              <LazyWrapper>
                <AuditLogsPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/roles'
            element={
              <LazyWrapper>
                <RoleManagementPage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/backup-restore'
            element={
              <LazyWrapper>
                <BackupRestorePage />
              </LazyWrapper>
            }
          />
          <Route
            path='/admin/parametres'
            element={
              <LazyWrapper>
                <AdminSettingsPage />
              </LazyWrapper>
            }
          />
        </Route>
      </Route>

      {/* 404 Route - Priorité haute */}
      <Route
        path='*'
        element={
          <LazyWrapper>
            <NotFound />
          </LazyWrapper>
        }
      />
    </Routes>
  )
}
