"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  LogOut,
  Shield,
  LayoutDashboard,
  Home,
  GitCompareArrows,
  ChevronDown,
} from "lucide-react";
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
import type { AppView } from "@/types";

const navLinks: { label: string; view: AppView; icon: React.ReactNode }[] = [
  { label: "Accueil", view: "landing", icon: <Home className="size-4" /> },
  {
    label: "Comparer",
    view: "compare",
    icon: <GitCompareArrows className="size-4" />,
  },
  {
    label: "Tableau de bord",
    view: "dashboard",
    icon: <LayoutDashboard className="size-4" />,
  },
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
  const { currentView, setView, user, setUser, setAuthModal } = useAppStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNav = (view: AppView) => {
    setView(view);
    setMobileOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <button
          onClick={() => handleNav("landing")}
          className="flex items-center gap-1 transition-opacity hover:opacity-80"
        >
          <span className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
            NOLI
          </span>
          <span className="bg-brand inline-block size-2 rounded-full" />
          <span className="text-sm font-medium text-muted-foreground sm:text-base">
            Assurance
          </span>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = currentView === link.view;
            return (
              <motion.button
                key={link.view}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleNav(link.view)}
                className={`relative rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-1 -bottom-0.5 h-0.5 rounded-full bg-brand"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Desktop Right Section */}
        <div className="hidden items-center gap-3 md:flex">
          {user.isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full transition-colors hover:bg-accent">
                  <div className="bg-brand flex size-9 items-center justify-center rounded-full text-sm font-bold text-brand-foreground">
                    {getUserInitials(user.name)}
                  </div>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
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
                <DropdownMenuItem onClick={() => handleNav("dashboard")}>
                  <User className="size-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setUser({ isLoggedIn: false })}
                >
                  <LogOut className="size-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthModal("login")}
                className="font-medium"
              >
                Se connecter
              </Button>
              <Button
                size="sm"
                onClick={() => handleNav("compare")}
                className="bg-brand font-medium text-brand-foreground hover:bg-brand-dark"
              >
                <Shield className="size-4" />
                Comparer maintenant
              </Button>
            </>
          )}
        </div>

        {/* Mobile: Single CTA + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          {user.isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-brand-foreground">
                  {getUserInitials(user.name)}
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
                <DropdownMenuItem onClick={() => handleNav("dashboard")}>
                  <User className="size-4" />
                  Mon profil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setUser({ isLoggedIn: false })}
                >
                  <LogOut className="size-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => handleNav("compare")}
              className="bg-brand px-3 text-xs font-semibold text-brand-foreground hover:bg-brand-dark"
            >
              <Shield className="size-3.5" />
              <span className="hidden sm:inline">Comparer</span>
            </Button>
          )}

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="size-9">
                <Menu className="size-5" />
                <span className="sr-only">Ouvrir le menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-border/40 px-6 py-5">
                <SheetTitle className="flex items-center gap-1 text-left">
                  <span className="text-xl font-extrabold tracking-tight">
                    NOLI
                  </span>
                  <span className="bg-brand inline-block size-2 rounded-full" />
                  <span className="text-sm font-medium text-muted-foreground">
                    Assurance
                  </span>
                </SheetTitle>
              </SheetHeader>

              <nav className="flex flex-col gap-1 p-4">
                <AnimatePresence>
                  {navLinks.map((link, i) => {
                    const isActive = currentView === link.view;
                    return (
                      <motion.button
                        key={link.view}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.08, duration: 0.25 }}
                        onClick={() => handleNav(link.view)}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-brand/10 text-brand"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {link.icon}
                        {link.label}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </nav>

              {!user.isLoggedIn && (
                <div className="mt-2 flex flex-col gap-3 p-4">
                  <Separator />
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="w-full font-medium"
                      onClick={() => {
                        setAuthModal("login");
                        setMobileOpen(false);
                      }}
                    >
                      Se connecter
                    </Button>
                    <Button
                      className="w-full bg-brand font-semibold text-brand-foreground hover:bg-brand-dark"
                      onClick={() => handleNav("compare")}
                    >
                      <Shield className="size-4" />
                      Comparer maintenant
                    </Button>
                  </div>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}