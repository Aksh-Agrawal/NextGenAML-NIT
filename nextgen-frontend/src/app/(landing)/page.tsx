import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Typologies } from "@/components/landing/Typologies";
import { Architecture } from "@/components/landing/Architecture";
import { TechStack } from "@/components/landing/TechStack";
import { DemoPreview } from "@/components/landing/DemoPreview";
import { Metrics } from "@/components/landing/Metrics";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <Navbar />
      <main>
        {/* 1. Hero — full viewport, animated graph + copy */}
        <Hero />

        {/* 2. Metrics band — high-impact stats */}
        <Metrics />

        {/* 3. AML Typologies — 5 pattern cards */}
        <Typologies />

        {/* 4. Architecture — 4-layer pipeline */}
        <Architecture />

        {/* 5. Tech Stack — tag cloud */}
        <TechStack />

        {/* 6. How it works — numbered pipeline steps */}
        <HowItWorks />

        {/* 7. Demo preview — browser mockup with 3 tabs */}
        <DemoPreview />
      </main>

      <Footer />
    </div>
  );
}
