"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  LayoutDashboard, FileText, Shield, User,
  Menu, ArrowLeft, Home, Bell, ChevronDown, RefreshCw, Moon, Sun,
  LogOut, Building2,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/app-store";
import { getInitials } from "@/lib/utils";
import { InsurerDashboard } from "./insurer-dashboard";
import { InsurerOffers } from "./insurer-offers";
import { InsurerQuotes } from "./insurer-quotes";
import { InsurerCoverages } from "./insurer-coverages";

const sidebarItems = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { id: "offers", label: "Mes Offres", icon: FileText },
  { id: "quotes", label: "Devis Reçus", icon: Building2 },
  { id: "coverages", label: "Garanties", icon: Shield },
  { id: "profile", label: "Mon Profil", icon: User },
] as const;

/* ── Live Clock ── */
function LiveClock() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const now = new Date();

  const dayNames = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  const monthNames = ["jan.", "fév.", "mar.", "avr.", "mai", "juin", "juil.", "août", "sep.", "oct.", "nov.", "déc."];

  const day = dayNames[now.getDay()];
  const date = now.getDate();
  const month = monthNames[now.getMonth()];
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  return (
    <span className="text-xs text-muted-foreground hidden sm:inline-flex items-center gap-1.5 tabular-nums">
      <span>{day} {date} {month}.</span>
      <span className="font-medium text-foreground">{hours}:{minutes}</span>
    </span>
  );
}

/* ── Insurer Top Header Bar ── */
function InsurerHeader({
  onMobileMenuOpen,
  insurerName,
}: {
  onMobileMenuOpen: () => void;
  insurerName: string;
}) {
  const { user, setUser, setView } = useAppStore();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    window.location.reload();
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-muted/40 px-3 sm:px-4 lg:px-6">
      {/* Left Section */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 shrink-0"
          onClick={onMobileMenuOpen}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>

        {/* Home icon */}
        <button
          onClick={() => setView("landing")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground shrink-0"
          aria-label="Retour au site"
        >
          <Home className="h-4 w-4" />
        </button>

        {/* Welcome text */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm text-muted-foreground hidden sm:inline">Bienvenue,</span>
          <span className="text-sm font-bold truncate">{insurerName || "Assureur"}</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Changer de thème"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        )}

        {/* Live clock */}
        <LiveClock />

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Actualiser"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>

        {/* Notification bell */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-black">
            3
          </span>
        </button>

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || ""} />}
                <AvatarFallback className="bg-brand text-black text-xs font-bold">
                  {getInitials(insurerName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-tight truncate max-w-[120px]">
                  {insurerName || "Assureur"}
                </span>
                <span className="text-[10px] text-muted-foreground leading-tight">
                  Espace Assureur
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium leading-none">{insurerName || "Assureur"}</p>
                <p className="text-xs text-muted-foreground">{user.email || ""}</p>
                <p className="text-xs text-[#B9E54D] font-medium">Espace Assureur</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setView("profile")}>
              <User className="h-4 w-4" />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => useAppStore.getState().setInsurerTab("dashboard")}>
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setView("landing")}>
              <Home className="h-4 w-4" />
              Retour au site
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); setUser({ isLoggedIn: false }); setView("landing"); }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

/* ── Sidebar Navigation ── */
function SidebarContent({
  activeTab,
  onSelect,
}: {
  activeTab: string;
  onSelect: (t: string) => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Sidebar brand */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand shrink-0">
            <Building2 className="h-5 w-5 text-black" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">NOLI</h2>
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
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/* ── Main Insurer Page ── */
export function InsurerPage() {
  const { user, setView, setUser, insurerTab, setInsurerTab } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [insurerName, setInsurerName] = useState("Assureur");

  const userId = user.id;

  // Fetch insurer info
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/insurer/me?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setInsurerName(data.name);
      })
      .catch(() => {});
  }, [userId]);

  const handleTabSelect = useCallback(
    (tab: string) => {
      if (tab === "profile") {
        setView("profile");
        return;
      }
      setInsurerTab(tab);
    },
    [setInsurerTab, setView]
  );

  const renderTab = () => {
    switch (insurerTab) {
      case "dashboard":
        return <InsurerDashboard />;
      case "offers":
        return <InsurerOffers />;
      case "quotes":
        return <InsurerQuotes />;
      case "coverages":
        return <InsurerCoverages />;
      default:
        return <InsurerDashboard />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Full-width top header */}
      <InsurerHeader
        onMobileMenuOpen={() => setMobileOpen(true)}
        insurerName={insurerName}
      />

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r bg-card overflow-y-auto shrink-0">
          <SidebarContent activeTab={insurerTab} onSelect={handleTabSelect} />
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu assureur</SheetTitle>
            </SheetHeader>
            <SidebarContent
              activeTab={insurerTab}
              onSelect={(t) => {
                handleTabSelect(t);
                setMobileOpen(false);
              }}
            />
          </SheetContent>
        </Sheet>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 w-full">{renderTab()}</div>
        </main>
      </div>
    </div>
  );
}