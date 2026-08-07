"use client";

import dynamic from "next/dynamic";
import { useAppStore } from "@/store/app-store";
import {
  LayoutDashboard,
  FileText,
  Shield,
  FolderOpen,
  Star,
  CreditCard,
  History,
  Bell,
  User,
  Settings,
} from "lucide-react";
import {
  AppShell,
  type AppShellSidebarItem,
} from "@/components/shared/app-shell";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
// UI-C06 : les onglets utilisateur sont chargés à la demande (code splitting).
const UserDashboardTab = dynamic(() => import("./tabs/user-dashboard-tab").then((m) => m.UserDashboardTab));
const UserQuotesTab = dynamic(() => import("./tabs/user-quotes-tab").then((m) => m.UserQuotesTab));
const UserContractsTab = dynamic(() => import("./tabs/user-contracts-tab").then((m) => m.UserContractsTab));
const UserDocumentsTab = dynamic(() => import("./tabs/user-documents-tab").then((m) => m.UserDocumentsTab));
const UserReviewsTab = dynamic(() => import("./tabs/user-reviews-tab").then((m) => m.UserReviewsTab));
const UserPaymentsTab = dynamic(() => import("./tabs/user-payments-tab").then((m) => m.UserPaymentsTab));
const UserHistoryTab = dynamic(() => import("./tabs/user-history-tab").then((m) => m.UserHistoryTab));
const UserNotificationsTab = dynamic(() => import("./tabs/user-notifications-tab").then((m) => m.UserNotificationsTab));
const UserProfileTab = dynamic(() => import("./tabs/user-profile-tab").then((m) => m.UserProfileTab));
const UserSettingsTab = dynamic(() => import("./tabs/user-settings-tab").then((m) => m.UserSettingsTab));

/* ── Sidebar config ── */
const sidebarItems: AppShellSidebarItem[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "quotes", label: "Mes Devis", icon: FileText },
  { id: "contracts", label: "Mes Contrats", icon: Shield },
  { id: "documents", label: "Mes Documents", icon: FolderOpen },
  { id: "reviews", label: "Mes Avis", icon: Star },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "history", label: "Historique", icon: History },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Mon Profil", icon: User },
  { id: "settings", label: "Paramètres", icon: Settings },
];

/* ── Tab renderer ── */
function renderTab(tab: string) {
  switch (tab) {
    case "dashboard":
      return <UserDashboardTab />;
    case "quotes":
      return <UserQuotesTab />;
    case "contracts":
      return <UserContractsTab />;
    case "documents":
      return <UserDocumentsTab />;
    case "reviews":
      return <UserReviewsTab />;
    case "payments":
      return <UserPaymentsTab />;
    case "history":
      return <UserHistoryTab />;
    case "notifications":
      return <UserNotificationsTab />;
    case "profile":
      return <UserProfileTab />;
    case "settings":
      return <UserSettingsTab />;
    default:
      return <UserDashboardTab />;
  }
}

/* ── Main layout ── */
export function UserLayout() {
  const { userTab, setUserTab } = useAppStore();

  return (
    <AppShell
      spaceLabel="Mon Espace"
      badgeLabel="Client"
      mobileBrand="NOLI"
      sidebarItems={sidebarItems}
      activeTab={userTab}
      onSelectTab={setUserTab}
      dropdownItems={
        <>
          <DropdownMenuItem onClick={() => setUserTab("profile")}>
            <User className="mr-2 h-4 w-4" />
            Mon Profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUserTab("quotes")}>
            <FileText className="mr-2 h-4 w-4" />
            Mes Devis
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUserTab("contracts")}>
            <Shield className="mr-2 h-4 w-4" />
            Mes Contrats
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setUserTab("settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </DropdownMenuItem>
        </>
      }
    >
      {renderTab(userTab)}
    </AppShell>
  );
}
