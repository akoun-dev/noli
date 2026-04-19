/**
 * Utilitaires pour le lazy loading des composants
 */
import { lazy } from 'react';

// Lazy loading des composants admin (lourds)
export const LazyRoleManagementPage = lazy(() =>
  import('@/features/admin/components/RoleManagementPage').then(module => ({
    default: module.RoleManagementPage
  }))
);

export const LazyAuditLogsPage = lazy(() =>
  import('@/features/admin/components/AuditLogsPage').then(module => ({
    default: module.AuditLogsPage
  }))
);

export const LazyBackupRestorePage = lazy(() =>
  import('@/features/admin/components/BackupRestorePage').then(module => ({
    default: module.BackupRestorePage
  }))
);

// Lazy loading des composants d'analyse
export const LazyDetailedAnalyticsDashboard = lazy(() =>
  import('@/features/insurers/components/DetailedAnalyticsDashboard').then(module => ({
    default: module.DetailedAnalyticsDashboard
  }))
);

// Lazy loading des composants de chat
export const LazyChatInterface = lazy(() =>
  import('@/features/chat/components/ChatInterface').then(module => ({
    default: module.ChatInterface
  }))
);

// Lazy loading des composants de paiement
export const LazyPaymentProcessor = lazy(() =>
  import('@/features/payments/components/PaymentProcessor').then(module => ({
    default: module.PaymentProcessor
  }))
);

// Lazy loading des composants PDF
export const LazyQuotePDFGenerator = lazy(() =>
  import('@/features/quotes/components/QuotePDFGenerator').then(module => ({
    default: module.QuotePDFGenerator
  }))
);