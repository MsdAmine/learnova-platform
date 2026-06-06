import { Navbar } from '../../../components/marketing/landing/Navbar';
import { Hero } from '../../../components/marketing/landing/Hero';
import { BrandIntro } from '../../../components/marketing/landing/BrandIntro';
import { Journey } from '../../../components/marketing/landing/Journey';
import { StatsGrid } from '../../../components/marketing/landing/StatsGrid';
import { Testimonials } from '../../../components/marketing/landing/Testimonials';
import { FinalCta } from '../../../components/marketing/landing/FinalCta';
import { Footer } from '../../../components/marketing/landing/Footer';

export default function LandingPage() {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-salem focus:text-white focus:px-6 focus:py-3 focus:rounded-md focus:text-button focus:leading-none focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-salem"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <BrandIntro />
        <Journey />
        <StatsGrid />
        <Testimonials />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
