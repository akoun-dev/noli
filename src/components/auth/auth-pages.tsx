"use client";

import { useEffect } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import {
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
} from "./auth-form";

/* ── Main Auth Pages Export ── */
export function AuthPages() {
  const { currentView, setView } = useAppStore();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Auth top bar with logo */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40">
        <div className="header-sticky">
          <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-8">
            <button
              onClick={() => useAppStore.getState().setView("landing")}
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <Image
                src="/img/noli-vertical.png"
                alt="NOLI Assurance"
                width={160}
                height={36}
                className="h-9 w-auto object-contain"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Auth content area */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-6">
            <Image
              src="/img/noli-vertical.png"
              alt="NOLI Assurance"
              width={160}
              height={36}
              className="h-12 w-auto object-contain"
            />
          </div>
          {currentView === "login" && (
            <div className="mb-6 text-center">
              <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold text-foreground">
                Connexion à votre espace NOLI
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Accédez à vos devis, comparaisons et informations de compte.
              </p>
            </div>
          )}
          {currentView === "login" && <LoginForm mode="page" />}
          {currentView === "register" && <RegisterForm mode="page" />}
          {currentView === "forgot" && <ForgotPasswordForm mode="page" />}

          {/* Retour à l'accueil (page mode) */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setView("landing")}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Retour à l&apos;accueil
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto w-full border-t border-border/40">
        <div className="mx-auto flex max-w-[1400px] items-center justify-center px-8 py-5">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} NOLI Assurance. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
