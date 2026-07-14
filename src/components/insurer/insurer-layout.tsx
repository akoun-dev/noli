"use client";

import { useAppStore } from "@/store/app-store";
import Image from "next/image";
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
  Menu,
  ArrowLeft,
  LogOut,
  ChevronRight,
  Building2,
} from "lucide-react";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { InsurerDashboardTab } from "./tabs/insurer-dashboard-tab";
import { InsurerClientsTab } from "./tabs/insurer-clients-tab";
import { InsurerContractsTab } from "./tabs/insurer-contracts-tab";
import { InsurerClaimsTab } from "./tabs/insurer-claims-tab";
import { InsurerOffersTab } from "./tabs/insurer-offers-tab";
import { InsurerQuotesTab } from "./tabs/insurer-quotes-tab";
import { InsurerAnalyticsTab } from "./tabs/insurer-analytics-tab";
import { InsurerGuaranteesTab } from "./tabs/insurer-guarantees-tab";
import { InsurerSettingsTab } from "./tabs/insurer-settings-tab";

/* ── Sidebar config ── */
const sidebarItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "clients", label: "Clients", icon: Users },
  { id: "contracts", label: "Contrats", icon: Shield },
  { id: "claims", label: "Sinistres", icon: AlertTriangle },
  { id: "offers", label: "Offres", icon: Car },
  { id: "quotes", label: "Devis Reçus", icon: FileText },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "guarantees", label: "Mes Garanties", icon: ShieldCheck },
  { id: "settings", label: "Paramètres", icon: Settings },
] as const;

/* ── Helpers ── */
const getTabLabel = (id: string) =>
  sidebarItems.find((i) => i.id === id)?.label ?? "Tableau de bord";

const getInitials = (name?: string) => {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/* ── Sidebar content (shared between desktop & mobile) ── */
function SidebarContent({
  activeTab,
  onSelect,
  onBack,
}: {
  activeTab: string;
  onSelect: (t: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <Image
            src="/noli-sans-fond.png"
            alt="NOLI"
            width={40}
            height={40}
            className="h-10 w-auto"
          />
          <div>
            <h2 className="font-bold text-lg">NOLI</h2>
            <p className="text-xs text-muted-foreground">Espace Assureur</p>
          </div>
        </div>
        <Separator className="mb-4" />
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand text-black"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <Separator className="mb-4" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au site
        </Button>
      </div>
    </div>
  );
}

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
  const { insurerTab, setInsurerTab, user, setUser, setView } = useAppStore();
  const currentLabel = getTabLabel(insurerTab);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) });
    setUser({
      isLoggedIn: false,
      id: undefined,
      name: undefined,
      email: undefined,
      role: undefined,
    });
    setView("landing");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <SidebarContent
          activeTab={insurerTab}
          onSelect={setInsurerTab}
          onBack={() => setView("landing")}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-2 border-b bg-card px-4 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent
              activeTab={insurerTab}
              onSelect={(t) => setInsurerTab(t)}
              onBack={() => setView("landing")}
            />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Image
            src="/noli-sans-fond.png"
            alt="NOLI"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="font-bold text-sm">NOLI Assureur</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header bar */}
        <div className="sticky top-0 z-30 border-b bg-card">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 pt-4 lg:pt-3">
            {/* Left: Title + badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{currentLabel}</h1>
              <Badge className="bg-brand text-black hover:bg-brand-hover text-xs font-medium">
                Assureur
              </Badge>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {user.id && <NotificationDropdown userId={user.id} />}
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-brand text-black text-xs font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">
                      {user.name || "Assureur"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || ""}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setInsurerTab("settings")}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Entreprise
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setInsurerTab("settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="px-4 lg:px-6 pb-3">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <button
                onClick={() => setView("landing")}
                className="hover:text-foreground transition-colors"
              >
                Accueil
              </button>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="font-medium">Espace Assureur</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">
                {currentLabel}
              </span>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4 pt-2 lg:p-6 lg:pt-6 w-full">
          {renderTab(insurerTab)}
        </div>
      </main>
    </div>
  );
}