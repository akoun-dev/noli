"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import LandingPage from "@/components/landing/landing-page";
import { ComparisonForm } from "@/components/comparison/comparison-form";
import { ResultsPage } from "@/components/results/results-page";
import { AuthPages } from "@/components/auth/auth-pages";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { ProfilePage } from "@/components/profile/profile-page";
import { AboutPage } from "@/components/about/about-page";
import { ContactPage } from "@/components/contact/contact-page";
import { AdminPage } from "@/components/admin/admin-page";
import { InsurerPage } from "@/components/insurer/insurer-page";
import { MyQuotesPage } from "@/components/user/my-quotes-page";
import { AnimatePresence, motion } from "framer-motion";

const isFullPage = (view: string) => view === "admin" || view === "insurer";

export default function Home() {
  const currentView = useAppStore((s) => s.currentView);

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
      case "profile":
        return (
          <div className="py-8 md:py-12">
            <ProfilePage />
          </div>
        );
      case "about":
        return <AboutPage />;
      case "contact":
        return <ContactPage />;
      case "admin":
        return <AdminPage />;
      case "insurer":
        return <InsurerPage />;
      case "my-quotes":
        return <MyQuotesPage />;
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
      {!fullPage && <Footer />}
    </div>
  );
}