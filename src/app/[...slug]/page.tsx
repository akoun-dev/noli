"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/store/app-store";
import type { AppView } from "@/types";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { LandingPage } from "@/components/landing/landing-page";
import { ComparisonForm } from "@/components/comparison/comparison-form";
import { AboutPage } from "@/components/about/about-page";
import { ContactPage } from "@/components/contact/contact-page";
import { FAQPage } from "@/components/legal/faq-page";
import { MentionsLegalesPage } from "@/components/legal/mentions-legales-page";
import { AuthPages } from "@/components/auth/auth-pages";

// UI-C06 : code splitting — les vues lourdes (tableaux de bord, résultats,
// offres) sont chargées à la demande pour réduire le bundle initial.
const OffersPage = dynamic(() =>
  import("@/components/offers/offers-page").then((m) => m.OffersPage)
);
const ResultsPage = dynamic(() =>
  import("@/components/results/results-page").then((m) => m.ResultsPage)
);
const AdminPage = dynamic(() =>
  import("@/components/admin/admin-page").then((m) => m.AdminPage)
);
const UserLayout = dynamic(() =>
  import("@/components/user/user-layout").then((m) => m.UserLayout)
);
const InsurerLayout = dynamic(() =>
  import("@/components/insurer/insurer-layout").then((m) => m.InsurerLayout)
);

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
  const didInitialSync = useRef(false); // au 1er rendu, l'URL prime sur la vue persistée

  // ── Détection des chemins inconnus → 404 (dérivé pendant le rendu) ──
  const notFound =
    pathname !== null && pathname !== "/" && !VALID_PATHS.has(pathname);

  // ── Sync view → URL (when user navigates via app) ──
  useEffect(() => {
    if (syncing.current) return;
    // Au tout premier passage : si l'URL ouverte pointe déjà vers une vue valide
    // différente de la vue (persistée), c'est un accès direct / lien profond /
    // favori → on laisse la synchro URL→vue primer et on NE pousse PAS la vue
    // persistée par-dessus (sinon /faq, /espace-client… renvoient sur l'accueil).
    if (!didInitialSync.current) {
      didInitialSync.current = true;
      const urlView = PATH_TO_VIEW[pathname];
      if (urlView && urlView !== currentView) return;
    }
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
    fetch("/api/auth/me").then((res) => {
      if (!res.ok) {
        setUser({ isLoggedIn: false, id: undefined, name: undefined, email: undefined, role: undefined });
      }
    });
  }, [user.isLoggedIn, setUser]);

  useEffect(() => {
    const protectedViews = ["admin", "user-dashboard", "insurer-dashboard"];
    // Écran protégé actif sans session (jamais connecté, ou session expirée /
    // invalidée par /api/auth/me) → retour à l'accueil au lieu d'un chrome privé
    // vide avec des erreurs 401.
    if (protectedViews.includes(currentView) && !user.isLoggedIn) {
      setView("landing");
      return;
    }
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
      <main id="main-content" className={fullPage ? "" : "flex-1"}>
        {renderView()}
      </main>
      {!fullPage && <Footer />}
    </div>
  );
}
