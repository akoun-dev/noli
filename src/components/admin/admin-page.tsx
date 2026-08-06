"use client";

import { useAppStore } from "@/store/app-store";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Shield,
  ShieldCheck,
  Receipt,
  Settings,
  Layers,
  ClipboardList,
  Database,
  UserCog,
  Phone,
} from "lucide-react";
import {
  AppShell,
  type AppShellSidebarItem,
} from "@/components/shared/app-shell";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { DashboardTab } from "./dashboard-tab";
import { AssureursTab } from "./assureurs-tab";
import { InsuranceCategoriesTab } from "./insurance-categories-tab";
import { InsuranceOffersTab } from "./insurance-offers-tab";
import { CoverageCategoriesTab } from "./coverage-categories-tab";
import { CoveragesTab } from "./coverages-tab";
import { DevisTab } from "./devis-tab";
import { RappelsTab } from "./rappels-tab";
import { SettingsTab } from "./settings-tab";
import { AuditLogsTab } from "./audit-logs-tab";
import { BackupsTab } from "./backups-tab";
import { RolesTab } from "./roles-tab";

/* ── Sidebar config ── */
const sidebarItems: AppShellSidebarItem[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "assureurs", label: "Assureurs", icon: Building2 },
  { id: "insurance-categories", label: "Catégories Produits", icon: Layers },
  { id: "insurance-offers", label: "Offres", icon: FileText },
  { id: "coverage-categories", label: "Cat. Garanties", icon: ShieldCheck },
  { id: "coverages", label: "Garanties", icon: Shield },
  { id: "devis", label: "Devis", icon: Receipt },
  { id: "rappels", label: "Rappels", icon: Phone },
  { id: "audit-logs", label: "Journaux d'audit", icon: ClipboardList },
  { id: "backups", label: "Sauvegardes", icon: Database },
  { id: "roles", label: "Rôles & Permissions", icon: UserCog },
  { id: "settings", label: "Paramètres", icon: Settings },
];

/* ── Tab renderer ── */
function renderTab(tab: string) {
  switch (tab) {
    case "dashboard":
      return <DashboardTab />;
    case "assureurs":
      return <AssureursTab />;
    case "insurance-categories":
      return <InsuranceCategoriesTab />;
    case "insurance-offers":
      return <InsuranceOffersTab />;
    case "coverage-categories":
      return <CoverageCategoriesTab />;
    case "coverages":
      return <CoveragesTab />;
    case "devis":
      return <DevisTab />;
    case "rappels":
      return <RappelsTab />;
    case "audit-logs":
      return <AuditLogsTab />;
    case "backups":
      return <BackupsTab />;
    case "roles":
      return <RolesTab />;
    case "settings":
      return <SettingsTab />;
    default:
      return <DashboardTab />;
  }
}

/* ── Main layout ── */
export function AdminPage() {
  const { adminTab, setAdminTab } = useAppStore();

  return (
    <AppShell
      spaceLabel="Administration"
      badgeLabel="Administration"
      mobileBrand="NOLI Admin"
      breadcrumbRoot="Administration"
      sidebarItems={sidebarItems}
      activeTab={adminTab}
      onSelectTab={setAdminTab}
      dropdownItems={
        <>
          <DropdownMenuItem onClick={() => setAdminTab("dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Tableau de bord
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAdminTab("settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </DropdownMenuItem>
        </>
      }
    >
      {renderTab(adminTab)}
    </AppShell>
  );
}
