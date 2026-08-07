"use client";

import Image from "next/image";
import { ArrowLeft, ChevronRight, LogOut, Menu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { NotificationDropdown } from "@/components/shared/notification-dropdown";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getInitials } from "@/lib/utils";
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

/* ── Types ── */
export interface AppShellSidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface AppShellProps {
  /** Sous-titre affiché sous le logo dans la sidebar (ex: "Administration") */
  spaceLabel: string;
  /** Libellé du badge dans l'en-tête (ex: "Assureur") */
  badgeLabel: string;
  /** Nom de marque dans la barre mobile (ex: "NOLI Admin") */
  mobileBrand: string;
  /** Segment du fil d'Ariane entre "Accueil" et le libellé courant (optionnel) */
  breadcrumbRoot?: string;
  sidebarItems: AppShellSidebarItem[];
  activeTab: string;
  onSelectTab: (t: string) => void;
  /** Items du menu utilisateur (DropdownMenuItem), hors déconnexion */
  dropdownItems?: React.ReactNode;
  children: React.ReactNode;
}

/* ── Sidebar content (shared between desktop & mobile) ── */
function SidebarContent({
  sidebarItems,
  spaceLabel,
  activeTab,
  onSelect,
  onBack,
}: {
  sidebarItems: AppShellSidebarItem[];
  spaceLabel: string;
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
            <p className="text-xs text-muted-foreground">{spaceLabel}</p>
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

/* ── Main layout ── */
export function AppShell({
  spaceLabel,
  badgeLabel,
  mobileBrand,
  breadcrumbRoot,
  sidebarItems,
  activeTab,
  onSelectTab,
  dropdownItems,
  children,
}: AppShellProps) {
  const { user, setUser, setView } = useAppStore();
  const currentLabel =
    sidebarItems.find((i) => i.id === activeTab)?.label ??
    sidebarItems[0]?.label ??
    "";

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
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
          sidebarItems={sidebarItems}
          spaceLabel={spaceLabel}
          activeTab={activeTab}
          onSelect={onSelectTab}
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
                sidebarItems={sidebarItems}
                spaceLabel={spaceLabel}
                activeTab={activeTab}
                onSelect={onSelectTab}
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
            <span className="font-bold text-sm">{mobileBrand}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user.id && <NotificationDropdown userId={user.id} />}
          <ThemeToggle />
        </div>
      </div>

      {/* Main content */}
      <main id="main-content" className="flex-1 overflow-y-auto">
        {/* Header bar */}
        <div className="sticky top-0 z-30 border-b bg-card">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3 pt-4 lg:pt-3">
            {/* Left: Title + badge */}
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold">{currentLabel}</h1>
              <Badge className="bg-brand text-black hover:bg-brand-hover text-xs font-medium">
                {badgeLabel}
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
                      {user.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email || ""}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {dropdownItems}
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
              {breadcrumbRoot && (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="font-medium">{breadcrumbRoot}</span>
                </>
              )}
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-medium">
                {currentLabel}
              </span>
            </nav>
          </div>
        </div>

        {/* Tab content */}
        <div className="p-4 pt-2 lg:p-6 lg:pt-6 w-full">{children}</div>
      </main>
    </div>
  );
}
