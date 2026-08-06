"use client";

import { useAppStore } from "@/store/app-store";
import {
  LayoutDashboard,
  Users,
  Shield,
  AlertTriangle,
  Car,
  FileText,
  BarChart3,
  ShieldCheck,
  Settings,
  Phone,
  Building2,
} from "lucide-react";
import {
  AppShell,
  type AppShellSidebarItem,
} from "@/components/shared/app-shell";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { InsurerDashboardTab } from "./tabs/insurer-dashboard-tab";
import { InsurerClientsTab } from "./tabs/insurer-clients-tab";
import { InsurerContractsTab } from "./tabs/insurer-contracts-tab";
import { InsurerClaimsTab } from "./tabs/insurer-claims-tab";
import { InsurerOffersTab } from "./tabs/insurer-offers-tab";
import { InsurerQuotesTab } from "./tabs/insurer-quotes-tab";
import { InsurerAnalyticsTab } from "./tabs/insurer-analytics-tab";
import { InsurerGuaranteesTab } from "./tabs/insurer-guarantees-tab";
import { InsurerSettingsTab } from "./tabs/insurer-settings-tab";
import { InsurerCallbacksTab } from "./tabs/insurer-callbacks-tab";

/* ── Sidebar config ── */
const sidebarItems: AppShellSidebarItem[] = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Users },
  { id: "contracts", label: "Contrats", icon: Shield },
  { id: "claims", label: "Sinistres", icon: AlertTriangle },
  { id: "offers", label: "Offres", icon: Car },
  { id: "quotes", label: "Devis Reçus", icon: FileText },
  { id: "callbacks", label: "Rappels", icon: Phone },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "guarantees", label: "Mes Garanties", icon: ShieldCheck },
  { id: "settings", label: "Paramètres", icon: Settings },
];

/* ── Tab renderer ── */
function renderTab(tab: string) {
  switch (tab) {
    case "dashboard":
      return <InsurerDashboardTab />;
    case "clients":
      return <InsurerClientsTab />;
    case "contracts":
      return <InsurerContractsTab />;
    case "claims":
      return <InsurerClaimsTab />;
    case "offers":
      return <InsurerOffersTab />;
    case "quotes":
      return <InsurerQuotesTab />;
    case "callbacks":
      return <InsurerCallbacksTab />;
    case "analytics":
      return <InsurerAnalyticsTab />;
    case "guarantees":
      return <InsurerGuaranteesTab />;
    case "settings":
      return <InsurerSettingsTab />;
    default:
      return <InsurerDashboardTab />;
  }
}

/* ── Main layout ── */
export function InsurerLayout() {
  const { insurerTab, setInsurerTab } = useAppStore();

  return (
    <AppShell
      spaceLabel="Espace Assureur"
      badgeLabel="Assureur"
      mobileBrand="NOLI Assureur"
      breadcrumbRoot="Espace Assureur"
      sidebarItems={sidebarItems}
      activeTab={insurerTab}
      onSelectTab={setInsurerTab}
      dropdownItems={
        <>
          <DropdownMenuItem onClick={() => setInsurerTab("settings")}>
            <Building2 className="mr-2 h-4 w-4" />
            Entreprise
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setInsurerTab("settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Paramètres
          </DropdownMenuItem>
        </>
      }
    >
      {renderTab(insurerTab)}
    </AppShell>
  );
}
