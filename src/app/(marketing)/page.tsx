import { Hero } from '@/components/marketing/hero';
import { Features } from '@/components/marketing/features';
import { HowItWorks } from '@/components/marketing/how-it-works';
import { Pricing } from '@/components/marketing/pricing';
import { Testimonials } from '@/components/marketing/testimonials';
import { FAQ } from '@/components/marketing/faq';
import { CTASection } from '@/components/marketing/cta-section';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <FAQ />
      <CTASection />
    </>
  );
}
