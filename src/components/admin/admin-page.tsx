"use client";

import { useAppStore } from "@/store/app-store";
import { useTheme } from "next-themes";
import Image from "next/image";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Shield,
  ShieldCheck,
  Receipt,
  Settings,
  Layers,
  ArrowLeft,
  Menu,
  ClipboardList,
  Database,
  UserCog,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Bell,
} from "lucide-react";
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

/* ── Sidebar config ── */
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
                  isActive
                    ? "bg-[#B9E54D] text-black"
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

/* ── Theme toggle button ── */
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Changer le thème"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

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
  const { adminTab, setAdminTab, user, setUser, setView } = useAppStore();
  const currentLabel = getTabLabel(adminTab);

  const handleLogout = () => {
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
          activeTab={adminTab}
          onSelect={setAdminTab}
          onBack={() => setView("landing")}
        />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b bg-card px-4 py-3">
        <div className="flex items-center gap-2">
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
                activeTab={adminTab}
                onSelect={(t) => setAdminTab(t)}
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
            <span className="font-bold text-sm">NOLI Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 relative"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
              3
            </span>
          </Button>
          <ThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#B9E54D] text-black text-xs font-bold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium truncate">
                  {user.name || "Admin"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email || ""}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setAdminTab("dashboard")}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Tableau de bord
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAdminTab("settings")}>
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

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header bar */}
        <div className="sticky top-0 z-30 border-b bg-card">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 pt-4 lg:pt-3">
            {/* Left: Title + badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{currentLabel}</h1>
              <Badge className="bg-[#B9E54D] text-black hover:bg-[#a5d044] text-xs font-medium">
                Administration
              </Badge>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                  3
                </span>
              </Button>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#B9E54D] text-black text-xs font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">
                      {user.name || "Admin"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || ""}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAdminTab("dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Tableau de bord
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAdminTab("settings")}>
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
              <span className="font-medium">Administration</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">
                {currentLabel}
              </span>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4 pt-2 lg:p-6 lg:pt-6 w-full">
          {renderTab(adminTab)}
        </div>
      </main>
    </div>
  );
}