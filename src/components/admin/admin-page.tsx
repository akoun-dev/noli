"use client";

import { useAppStore } from "@/store/app-store";
import {
  LayoutDashboard, Building2, FileText, Shield, ShieldCheck,
  Receipt, Settings, Layers, ArrowLeft, Menu, ClipboardList, Database, UserCog,
  User, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { DashboardTab } from "./dashboard-tab";
import { AssureursTab } from "./assureurs-tab";
import { InsuranceCategoriesTab } from "./insurance-categories-tab";
import { InsuranceOffersTab } from "./insurance-offers-tab";
import { CoverageCategoriesTab } from "./coverage-categories-tab";
import { CoveragesTab } from "./coverages-tab";
import { DevisTab } from "./devis-tab";
import { SettingsTab } from "./settings-tab";
import { AuditLogsTab } from "./audit-logs-tab";
import { BackupsTab } from "./backups-tab";
import { RolesTab } from "./roles-tab";

const sidebarItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "assureurs", label: "Assureurs", icon: Building2 },
  { id: "insurance-categories", label: "Catégories Produits", icon: Layers },
  { id: "insurance-offers", label: "Offres", icon: FileText },
  { id: "coverage-categories", label: "Cat. Garanties", icon: ShieldCheck },
  { id: "coverages", label: "Garanties", icon: Shield },
  { id: "devis", label: "Devis", icon: Receipt },
  { id: "audit-logs", label: "Journaux d'audit", icon: ClipboardList },
  { id: "backups", label: "Sauvegardes", icon: Database },
  { id: "roles", label: "Rôles & Permissions", icon: UserCog },
  { id: "settings", label: "Paramètres", icon: Settings },
] as const;

function SidebarContent({ activeTab, onSelect, onBack }: { activeTab: string; onSelect: (t: string) => void; onBack: () => void }) {
  const { user, setUser, setView } = useAppStore();
  const initials = user.name ? user.name.trim().split(/\s+/).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "U";
  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#B9E54D]">
            <ShieldCheck className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="font-bold text-lg">NOLI</h2>
            <p className="text-xs text-muted-foreground">Administration</p>
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
                  isActive ? "bg-[#B9E54D] text-black" : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
        {/* User info */}
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden shrink-0">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || ""} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{user.name || "Utilisateur"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email || ""}</p>
          </div>
        </div>
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={() => setView("profile")}>
            <User className="h-4 w-4" />
            Mon profil
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={() => { setUser({ isLoggedIn: false }); onBack(); }}>
            <LogOut className="h-4 w-4" />
            Déconnexion
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Retour au site
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const { adminTab, setAdminTab, setView } = useAppStore();

  const renderTab = () => {
    switch (adminTab) {
      case "dashboard": return <DashboardTab />;
      case "assureurs": return <AssureursTab />;
      case "insurance-categories": return <InsuranceCategoriesTab />;
      case "insurance-offers": return <InsuranceOffersTab />;
      case "coverage-categories": return <CoverageCategoriesTab />;
      case "coverages": return <CoveragesTab />;
      case "devis": return <DevisTab />;
      case "audit-logs": return <AuditLogsTab />;
      case "backups": return <BackupsTab />;
      case "roles": return <RolesTab />;
      case "settings": return <SettingsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <SidebarContent activeTab={adminTab} onSelect={setAdminTab} onBack={() => setView("landing")} />
      </aside>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-2 border-b bg-card px-4 py-3">
        <Sheet>
          <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only"><SheetTitle>Menu</SheetTitle></SheetHeader>
            <SidebarContent activeTab={adminTab} onSelect={(t) => { setAdminTab(t); }} onBack={() => setView("landing")} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#B9E54D]">
            <ShieldCheck className="h-4 w-4 text-black" />
          </div>
          <span className="font-bold text-sm">NOLI Admin</span>
        </div>
      </div>
      <main className="flex-1 overflow-y-auto">
        <div className="p-4 pt-16 lg:p-6 lg:pt-6 w-full">{renderTab()}</div>
      </main>
    </div>
  );
}