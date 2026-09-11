"use client";

import dynamic from "next/dynamic";
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
  UserCircle,
  UserCheck,
  Phone,
} from "lucide-react";
import {
  AppShell,
  type AppShellSidebarItem,
} from "@/components/shared/app-shell";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
// UI-C06 : les onglets admin sont chargés à la demande (code splitting).
const DashboardTab = dynamic(() => import("./dashboard-tab").then((m) => m.DashboardTab));
const AssureursTab = dynamic(() => import("./assureurs-tab").then((m) => m.AssureursTab));
const InsurerValidationTab = dynamic(() => import("./insurer-validation-tab").then((m) => m.InsurerValidationTab));
const InsuranceCategoriesTab = dynamic(() => import("./insurance-categories-tab").then((m) => m.InsuranceCategoriesTab));
const InsuranceOffersTab = dynamic(() => import("./insurance-offers-tab").then((m) => m.InsuranceOffersTab));
const CoverageCategoriesTab = dynamic(() => import("./coverage-categories-tab").then((m) => m.CoverageCategoriesTab));
const CoveragesTab = dynamic(() => import("./coverages-tab").then((m) => m.CoveragesTab));
const DevisTab = dynamic(() => import("./devis-tab").then((m) => m.DevisTab));
const RappelsTab = dynamic(() => import("./rappels-tab").then((m) => m.RappelsTab));
const SettingsTab = dynamic(() => import("./settings-tab").then((m) => m.SettingsTab));
const AuditLogsTab = dynamic(() => import("./audit-logs-tab").then((m) => m.AuditLogsTab));
const BackupsTab = dynamic(() => import("./backups-tab").then((m) => m.BackupsTab));
const RolesTab = dynamic(() => import("./roles-tab").then((m) => m.RolesTab));
const UserProfileTab = dynamic(() => import("../user/tabs/user-profile-tab").then((m) => m.UserProfileTab));

/* ── Sidebar config ── */
const sidebarItems: AppShellSidebarItem[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "assureurs", label: "Assureurs", icon: Building2 },
  { id: "validation-assureurs", label: "Validation Assureurs", icon: UserCheck },
  { id: "insurance-categories", label: "Catégories Produits", icon: Layers },
  { id: "insurance-offers", label: "Offres", icon: FileText },
  { id: "coverage-categories", label: "Cat. Garanties", icon: ShieldCheck },
  { id: "coverages", label: "Garanties", icon: Shield },
  { id: "devis", label: "Devis", icon: Receipt },
  { id: "rappels", label: "Rappels", icon: Phone },
  { id: "audit-logs", label: "Journaux d'audit", icon: ClipboardList },
  { id: "backups", label: "Sauvegardes", icon: Database },
  { id: "roles", label: "Rôles & Permissions", icon: UserCog },
  { id: "profile", label: "Mon Profil", icon: UserCircle },
  { id: "settings", label: "Paramètres", icon: Settings },
];

/* ── Tab renderer ── */
function renderTab(tab: string) {
  switch (tab) {
    case "dashboard":
      return <DashboardTab />;
    case "assureurs":
      return <AssureursTab />;
    case "validation-assureurs":
      return <InsurerValidationTab />;
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
    case "profile":
      return <UserProfileTab />;
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
          <DropdownMenuItem onClick={() => setAdminTab("profile")}>
            <UserCircle className="mr-2 h-4 w-4" />
            Mon Profil
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
