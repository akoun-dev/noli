import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PublicLayout } from "@/layouts/PublicLayout";
import { UserLayout } from "@/layouts/UserLayout";
import { InsurerLayout } from "@/layouts/InsurerLayout";
import { AdminLayout } from "@/layouts/AdminLayout";
import { AuthGuard } from "@/guards/AuthGuard";
import { RoleGuard } from "@/guards/RoleGuard";

// Public Pages
import HomePage from "@/pages/public/HomePage";
import AboutPage from "@/pages/public/AboutPage";
import ContactPage from "@/pages/public/ContactPage";
import NotFound from "@/pages/NotFound";

// Auth Pages
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";

// Dashboard Pages
import UserDashboardPage from "@/pages/user/UserDashboardPage";
import InsurerDashboardPage from "@/pages/insurer/InsurerDashboardPage";
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminSupervisionPage from "@/pages/admin/AdminSupervisionPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminInsurersPage from "@/pages/admin/AdminInsurersPage";
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminDataManagementPage from "@/pages/admin/AdminDataManagementPage";
import AdminAnalyticsPage from "@/pages/admin/AdminAnalyticsPage";
import AdminModerationPage from "@/pages/admin/AdminModerationPage";
import AdminOffersPage from "@/pages/admin/AdminOffersPage";
import { AuditLogsPage } from "@/features/admin/components/AuditLogsPage";
import { RoleManagementPage } from "@/features/admin/components/RoleManagementPage";
import { BackupRestorePage } from "@/features/admin/components/BackupRestorePage";
import UserQuotesPage from "@/features/user/pages/UserQuotesPage";
import UserPoliciesPage from "@/features/user/pages/UserPoliciesPage";
import UserProfilePage from "@/features/user/pages/UserProfilePage";
import UserNotificationsPage from "@/features/user/pages/UserNotificationsPage";
import PaymentsPage from "@/features/payments/pages/PaymentsPage";
import ComparisonHistoryPage from "@/features/comparison/pages/ComparisonHistoryPage";
import InsurerOffersPage from "@/pages/insurer/InsurerOffersPage";
import InsurerQuotesPage from "@/pages/insurer/InsurerQuotesPage";
import InsurerAnalyticsPage from "@/pages/insurer/InsurerAnalyticsPage";
import InsurerNotificationsPage from "@/pages/insurer/InsurerNotificationsPage";

// Feature Pages
import ComparisonPage from "@/features/comparison/pages/ComparisonPage";
import OfferListPage from "@/features/offers/pages/OfferListPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <UserProvider>
              <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/a-propos" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
              </Route>

              {/* Auth Routes */}
              <Route path="/auth/connexion" element={<LoginPage />} />
              <Route path="/auth/inscription" element={<RegisterPage />} />

              {/* Comparison Routes */}
              <Route path="/comparer" element={<ComparisonPage />} />

              {/* Offer Routes */}
              <Route path="/offres" element={<OfferListPage />} />

              {/* Protected User Routes */}
              <Route element={<AuthGuard requiredRole="USER" />}>
                <Route element={<UserLayout />}>
                  <Route path="/tableau-de-bord" element={<UserDashboardPage />} />
                  <Route path="/profil" element={<UserProfilePage />} />
                  <Route path="/mes-devis" element={<UserQuotesPage />} />
                  <Route path="/mes-contrats" element={<UserPoliciesPage />} />
                  <Route path="/paiements" element={<PaymentsPage />} />
                  <Route path="/historique-comparaisons" element={<ComparisonHistoryPage />} />
                  <Route path="/notifications" element={<UserNotificationsPage />} />
                  <Route path="/parametres" element={<div>User Settings</div>} />
                </Route>
              </Route>

              {/* Protected Insurer Routes */}
              <Route element={<AuthGuard requiredRole="INSURER" />}>
                <Route element={<InsurerLayout />}>
                  <Route path="/assureur/tableau-de-bord" element={<InsurerDashboardPage />} />
                  <Route path="/assureur/offres" element={<InsurerOffersPage />} />
                  <Route path="/assureur/devis" element={<InsurerQuotesPage />} />
                  <Route path="/assureur/analytics" element={<InsurerAnalyticsPage />} />
                  <Route path="/assureur/notifications" element={<InsurerNotificationsPage />} />
                  <Route path="/assureur/clients" element={<div>Insurer Clients</div>} />
                  <Route path="/assureur/parametres" element={<div>Insurer Settings</div>} />
                </Route>
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<AuthGuard requiredRole="ADMIN" />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/tableau-de-bord" element={<AdminDashboardPage />} />
                  <Route path="/admin/supervision" element={<AdminSupervisionPage />} />
                  <Route path="/admin/utilisateurs" element={<AdminUsersPage />} />
                  <Route path="/admin/assureurs" element={<AdminInsurersPage />} />
                  <Route path="/admin/offres" element={<AdminOffersPage />} />
                  <Route path="/admin/devis" element={<div>Admin Quotes</div>} />
                  <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                  <Route path="/admin/moderation" element={<AdminModerationPage />} />
                  <Route path="/admin/donnees" element={<AdminDataManagementPage />} />
                  <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/admin/roles" element={<RoleManagementPage />} />
                  <Route path="/admin/backup-restore" element={<BackupRestorePage />} />
                  <Route path="/admin/parametres" element={<AdminSettingsPage />} />
                </Route>
              </Route>

              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </UserProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
