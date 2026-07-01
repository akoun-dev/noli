"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/app-store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import LandingPage from "@/components/landing/landing-page";
import { ComparisonForm } from "@/components/comparison/comparison-form";
import { ResultsPage } from "@/components/results/results-page";
import { AuthModals } from "@/components/auth/auth-modals";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { AboutPage } from "@/components/about/about-page";
import { ContactPage } from "@/components/contact/contact-page";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);
  const authModal = useAppStore((s) => s.authModal);
  const seedDone = useRef(false);

  useEffect(() => {
    if (!seedDone.current) {
      seedDone.current = true;
      fetch("/api/seed", { method: "POST" }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case "landing":
        return <LandingPage />;
      case "compare":
        return (
          <div className="py-8 md:py-12">
            <ComparisonForm />
          </div>
        );
      case "results":
        return <ResultsPage />;
      case "dashboard":
        return (
          <div className="py-8 md:py-12">
            <DashboardPage />
          </div>
        );
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
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
      <Footer />
      {authModal !== "none" && <AuthModals />}
    </div>
  );
}