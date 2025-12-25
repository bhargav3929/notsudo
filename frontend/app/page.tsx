import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <div id="features">
        <FeaturesGrid />
      </div>
      <div id="testimonials">
        <TestimonialsSection />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <div id="use-cases">
        <UseCasesSection />
      </div>
      <div id="faq">
        <FAQSection />
      </div>
      <Footer />
    </main>
  );
}
