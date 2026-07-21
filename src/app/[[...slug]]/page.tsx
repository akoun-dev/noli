"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import type { AppView } from "@/types";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LandingPage } from "@/components/landing/landing-page";
import { OffersPage } from "@/components/offers/offers-page";
import { ComparisonForm } from "@/components/comparison/comparison-form";
import { ResultsPage } from "@/components/results/results-page";
import { AuthPages } from "@/components/auth/auth-pages";
import { AboutPage } from "@/components/about/about-page";
import { ContactPage } from "@/components/contact/contact-page";
import { FAQPage } from "@/components/legal/faq-page";
import { MentionsLegalesPage } from "@/components/legal/mentions-legales-page";
import { AdminPage } from "@/components/admin/admin-page";
import { UserLayout } from "@/components/user/user-layout";
import { InsurerLayout } from "@/components/insurer/insurer-layout";

// ── URL ↔ View mapping ───────────────────────────────────────────
const VIEW_TO_PATH: Record<AppView, string> = {
  landing: "/",
  compare: "/comparer",
  results: "/resultats",
  offers: "/offres",
  about: "/a-propos",
  contact: "/contact",
  faq: "/faq",
  "mentions-legales": "/mentions-legales",
  login: "/connexion",
  register: "/inscription",
  forgot: "/mot-de-passe-oublie",
  admin: "/admin",
  "user-dashboard": "/espace-client",
  "insurer-dashboard": "/espace-assureur",
};

const PATH_TO_VIEW: Record<string, AppView> = {};
for (const [view, path] of Object.entries(VIEW_TO_PATH)) {
  PATH_TO_VIEW[path] = view as AppView;
}

/** Ensemble des chemins SPA valides */
const VALID_PATHS = new Set(Object.values(VIEW_TO_PATH));

const isFullPage = (view: string) =>
  view === "admin" || view === "user-dashboard" || view === "insurer-dashboard" || view === "login" || view === "register" || view === "forgot";

/** Composant 404 minimal intégré */
function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-[10rem] sm:text-[12rem] font-bold leading-none text-primary/10 select-none">
          404
        </h1>
        <div className="-mt-8 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Page introuvable
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Oups ! La page que vous cherchez n&apos;existe pas ou a été
            déplacée. Vérifiez l&apos;URL ou retournez à l&apos;accueil.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">                        <button
                            onClick={() => useAppStore.getState().setView("landing")}
                            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
                          >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Retour à l&apos;accueil
                          </button>
                          <button
                            onClick={() => useAppStore.getState().setView("compare")}
                            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-muted"
                          >
                            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            Comparer mes offres
                          </button>
        </div>
      </div>
      <p className="mt-16 text-xs text-muted-foreground/50">
        NOLI Assurance — Comparateur d&apos;assurances en Côte d&apos;Ivoire
      </p>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const validated = useRef(false);
  const syncing = useRef(false); // prevent infinite loop
  const [notFound, setNotFound] = useState(false);

  // ── Détection des chemins inconnus → 404 ──
  useEffect(() => {
    if (pathname === "/" || VALID_PATHS.has(pathname)) {
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  }, [pathname]);

  // ── Sync view → URL (when user navigates via app) ──
  useEffect(() => {
    if (syncing.current) return;
    const targetPath = VIEW_TO_PATH[currentView];
    if (targetPath && targetPath !== pathname) {
      syncing.current = true;
      router.push(targetPath, { scroll: false });
      requestAnimationFrame(() => { syncing.current = false; });
    }
  }, [currentView, pathname, router]);

  // ── Sync URL → view (when user clicks browser back/forward or types URL) ──
  useEffect(() => {
    if (syncing.current) return;
    const view = PATH_TO_VIEW[pathname];
    if (view && view !== currentView) {
      syncing.current = true;
      setView(view);
      requestAnimationFrame(() => { syncing.current = false; });
    }
  }, [pathname, currentView, setView]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  useEffect(() => {
    if (validated.current) return;
    validated.current = true;
    if (!user.isLoggedIn) return;
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "me" }),
    }).then((res) => {
      if (!res.ok) {
        setUser({ isLoggedIn: false, id: undefined, name: undefined, email: undefined, role: undefined });
      }
    });
  }, [user.isLoggedIn, setUser]);

  useEffect(() => {
    if (currentView === "admin" && user.isLoggedIn && user.role !== "ADMIN") {
      setView("landing");
    }
    if (currentView === "user-dashboard" && user.isLoggedIn && user.role !== "USER") {
      setView("landing");
    }
    if (currentView === "insurer-dashboard" && user.isLoggedIn && user.role !== "INSURER") {
      setView("landing");
    }
  }, [currentView, user.isLoggedIn, user.role, setView]);

  // ── Si chemin inconnu → page 404 ──
  if (notFound) {
    return <NotFoundPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case "landing":
        return <LandingPage />;
      case "offers":
        return <OffersPage />;
      case "compare":
        return (
          <div className="py-8 md:py-12">
            <ComparisonForm />
          </div>
        );
      case "results":
        return <ResultsPage />;
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "faq":
        return <FAQPage />;
      case "mentions-legales":
        return <MentionsLegalesPage />;
      case "admin":
        return <AdminPage />;
      case "user-dashboard":
        return <UserLayout />;
      case "insurer-dashboard":
        return <InsurerLayout />;
      case "login":
      case "register":
      case "forgot":
        return <AuthPages />;
      default:
        return <LandingPage />;
    }
  };

  const fullPage = isFullPage(currentView);

  return (
    <div className={fullPage ? "min-h-screen" : "min-h-screen flex flex-col"}>
      {!fullPage && <Header />}
      <main className={fullPage ? "" : "flex-1"}>
        {renderView()}
      </main>
      {!fullPage && <Footer />}
    </div>
  );
}
