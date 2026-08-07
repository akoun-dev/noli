"use client";

import dynamic from "next/dynamic";
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
// UI-C06 : les onglets assureur sont chargés à la demande (code splitting).
const InsurerDashboardTab = dynamic(() => import("./tabs/insurer-dashboard-tab").then((m) => m.InsurerDashboardTab));
const InsurerClientsTab = dynamic(() => import("./tabs/insurer-clients-tab").then((m) => m.InsurerClientsTab));
const InsurerContractsTab = dynamic(() => import("./tabs/insurer-contracts-tab").then((m) => m.InsurerContractsTab));
const InsurerClaimsTab = dynamic(() => import("./tabs/insurer-claims-tab").then((m) => m.InsurerClaimsTab));
const InsurerOffersTab = dynamic(() => import("./tabs/insurer-offers-tab").then((m) => m.InsurerOffersTab));
const InsurerQuotesTab = dynamic(() => import("./tabs/insurer-quotes-tab").then((m) => m.InsurerQuotesTab));
const InsurerAnalyticsTab = dynamic(() => import("./tabs/insurer-analytics-tab").then((m) => m.InsurerAnalyticsTab));
const InsurerGuaranteesTab = dynamic(() => import("./tabs/insurer-guarantees-tab").then((m) => m.InsurerGuaranteesTab));
const InsurerSettingsTab = dynamic(() => import("./tabs/insurer-settings-tab").then((m) => m.InsurerSettingsTab));
const InsurerCallbacksTab = dynamic(() => import("./tabs/insurer-callbacks-tab").then((m) => m.InsurerCallbacksTab));

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
