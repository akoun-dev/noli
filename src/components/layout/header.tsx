"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
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
import { useAppStore } from "@/store/app-store";

const navItems = [
  { label: "ACCUEIL", action: "landing" as const },
  { label: "À PROPOS", action: "about" as const },
  { label: "CONTACT", action: "contact" as const },
];

function getUserInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Header() {
  const { currentView, setView, user, setUser } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  // Hydration-safe: returns false on server, true on client.
  // Avoids setState-in-effect lint error from React 19 compiler.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const handleNav = (action: string) => {
    switch (action) {
      case "landing":
        setView("landing");
        break;
      case "compare":
        setView("compare");
        break;
      case "about":
        setView("about");
        break;
      case "contact":
        setView("contact");
        break;
    }
    setMobileOpen(false);
  };

  const isActive = (action: string) => {
    if (action === "landing" && currentView === "landing") return true;
    return false;
  };

  return (
    <header className="header-sticky sticky top-0 z-50 w-full border-b border-border/40">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
        {/* Logo */}
        <button
          onClick={() => handleNav("landing")}
          className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
        >
          <img src="/img/noli-vertical.png" alt="NOLI Assurance" className="h-9 w-auto object-contain" />
        </button>

        {/* Desktop Navigation (center) */}
        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.action);
            return (
              <button
                key={item.label}
                onClick={() => handleNav(item.action)}
                className={`relative text-sm font-medium uppercase tracking-wide transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.label}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-primary"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden items-center gap-4 lg:flex">
          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
              aria-label="Changer de thème"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-foreground" />
              ) : (
                <Moon className="h-4 w-4 text-foreground" />
              )}
            </button>
          )}

          {user.isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full transition-colors hover:bg-muted">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground overflow-hidden">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name || ""} className="h-full w-full object-cover" />
                    ) : (
                      getUserInitials(user.name)
                    )}
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name || "Utilisateur"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email || ""}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    setView("dashboard");
                  }}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Tableau de bord
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setView("profile");
                  }}
                >
                  <User className="h-4 w-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setUser({ isLoggedIn: false })}
                >
                  <LogOut className="h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <button
                onClick={() => setView("login")}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              >
                Connexion
              </button>
              <Button
                onClick={() => setView("register")}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                S&apos;inscrire
              </Button>
            </>
          )}
        </div>

        {/* Mobile: Hamburger + Auth indicator */}
        <div className="flex items-center gap-2 lg:hidden">
          {user.isLoggedIn ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name || ""} className="h-full w-full object-cover" />
              ) : (
                getUserInitials(user.name)
              )}
            </div>
          ) : null}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-border/40 px-6 py-5">
                <SheetTitle className="flex items-center gap-1.5 text-left">
                  <img src="/img/noli-vertical.png" alt="NOLI Assurance" className="h-9 w-auto object-contain" />
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-4">
                <AnimatePresence>
                  {navItems.map((item, i) => {
                    const active = isActive(item.action);
                    return (
                      <motion.button
                        key={item.label}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.08, duration: 0.25 }}
                        onClick={() => handleNav(item.action)}
                        className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium uppercase tracking-wide transition-colors ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </nav>

              {/* Theme toggle in mobile */}
              <div className="px-4 py-2">
                <button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {mounted && theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                  {mounted && theme === "dark" ? "Mode clair" : "Mode sombre"}
                </button>
              </div>

              {!user.isLoggedIn && (
                <div className="mt-2 flex flex-col gap-3 p-4">
                  <Separator />
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="w-full font-medium"
                      onClick={() => {
                        setView("login");
                        setMobileOpen(false);
                      }}
                    >
                      Connexion
                    </Button>
                    <Button
                      className="w-full rounded-full bg-primary font-semibold text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        setView("register");
                        setMobileOpen(false);
                      }}
                    >
                      S&apos;inscrire
                    </Button>
                  </div>
                </div>
              )}

              {user.isLoggedIn && (
                <div className="mt-2 p-4">
                  <Separator />
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="w-full font-medium"
                      onClick={() => {
                        setView("dashboard");
                        setMobileOpen(false);
                      }}
                    >
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Tableau de bord
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full font-medium"
                      onClick={() => {
                        setView("profile");
                        setMobileOpen(false);
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={() => {
                        setUser({ isLoggedIn: false });
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Déconnexion
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}