import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FooterCTA } from './FooterCTA';

export function LandingPage() {
  return (
    <main className="min-h-screen bg-surface">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <FooterCTA />
    </main>
  );
}
