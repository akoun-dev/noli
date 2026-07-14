"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
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

const isFullPage = (view: string) =>
  view === "admin" || view === "user-dashboard" || view === "insurer-dashboard" || view === "login" || view === "register" || view === "forgot";

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);
  const setView = useAppStore((s) => s.setView);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const validated = useRef(false);

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
