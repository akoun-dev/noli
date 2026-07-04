"use client";

import { useAppStore } from "@/store/app-store";
import { useTheme } from "next-themes";
import Image from "next/image";
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
  Menu,
  ArrowLeft,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
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
import { UserDashboardTab } from "./tabs/user-dashboard-tab";
import { UserQuotesTab } from "./tabs/user-quotes-tab";
import { UserContractsTab } from "./tabs/user-contracts-tab";
import { UserDocumentsTab } from "./tabs/user-documents-tab";
import { UserReviewsTab } from "./tabs/user-reviews-tab";
import { UserPaymentsTab } from "./tabs/user-payments-tab";
import { UserHistoryTab } from "./tabs/user-history-tab";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { UserNotificationsTab } from "./tabs/user-notifications-tab";
import { UserProfileTab } from "./tabs/user-profile-tab";
import { UserSettingsTab } from "./tabs/user-settings-tab";

/* ── Sidebar config ── */
const sidebarItems = [
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
] as const;

/* ── Helpers ── */
const getTabLabel = (id: string) =>
  sidebarItems.find((i) => i.id === id)?.label ?? "Tableau de bord";

const getInitials = (name?: string) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
            <p className="text-xs text-muted-foreground">Mon Espace</p>
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
  const { userTab, setUserTab, user, setUser, setView } = useAppStore();
  const currentLabel = getTabLabel(userTab);

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
          activeTab={userTab}
          onSelect={setUserTab}
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
              activeTab={userTab}
              onSelect={(t) => setUserTab(t)}
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
          <span className="font-bold text-sm">NOLI</span>
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
                Client
              </Badge>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1">
              {user.id && <NotificationDropdown userId={user.id} />}
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#B9E54D] text-black text-xs font-bold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.name || "Utilisateur"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email || ""}</p>
                  </div>
                  <DropdownMenuSeparator />
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
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
              <span className="text-foreground font-medium">{currentLabel}</span>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4 pt-2 lg:p-6 lg:pt-6 w-full">{renderTab(userTab)}</div>
      </main>
    </div>
  );
}