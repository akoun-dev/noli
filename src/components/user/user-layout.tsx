"use client";

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
import { UserDashboardTab } from "./tabs/user-dashboard-tab";
import { UserQuotesTab } from "./tabs/user-quotes-tab";
import { UserContractsTab } from "./tabs/user-contracts-tab";
import { UserDocumentsTab } from "./tabs/user-documents-tab";
import { UserReviewsTab } from "./tabs/user-reviews-tab";
import { UserPaymentsTab } from "./tabs/user-payments-tab";
import { UserHistoryTab } from "./tabs/user-history-tab";
import { UserNotificationsTab } from "./tabs/user-notifications-tab";
import { UserProfileTab } from "./tabs/user-profile-tab";
import { UserSettingsTab } from "./tabs/user-settings-tab";

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
