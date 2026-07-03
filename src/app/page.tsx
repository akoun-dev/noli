"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import LandingPage from "@/components/landing/landing-page";
import OffersPage from "@/components/offers/offers-page";
import { ComparisonForm } from "@/components/comparison/comparison-form";
import { ResultsPage } from "@/components/results/results-page";
import { AuthPages } from "@/components/auth/auth-pages";
import { AboutPage } from "@/components/about/about-page";
import { ContactPage } from "@/components/contact/contact-page";
import { AdminPage } from "@/components/admin/admin-page";
import { UserLayout } from "@/components/user/user-layout";
import { InsurerLayout } from "@/components/insurer/insurer-layout";
import { AnimatePresence, motion } from "framer-motion";

const isFullPage = (view: string) =>
  view === "admin" || view === "user-dashboard" || view === "insurer-dashboard" || view === "login" || view === "register" || view === "forgot";

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

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
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>
      {!fullPage && <div className="hidden md:block"><Footer /></div>}
    </div>
  );
}