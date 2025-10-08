import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import TrustedBy from "@/components/home/TrustedBy";
import Testimonials from "@/components/home/Testimonials";
import FAQ from "@/components/home/FAQ";
import FinalCTA from "@/components/home/FinalCTA";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <main>
        <Hero />
        <div className="container mx-auto max-w-7xl px-4 -mt-10 md:-mt-14">
        </div>
        <TrustedBy />
        <Features />
        <HowItWorks />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
    </div>
  );
};

export default HomePage;
