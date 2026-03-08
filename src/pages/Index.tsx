import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import MiniDashboard from "@/components/landing/MiniDashboard";
import HowItWorks from "@/components/landing/HowItWorks";
import PremiumBenefits from "@/components/landing/PremiumBenefits";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <MiniDashboard />
      <HowItWorks />
      <PremiumBenefits />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
