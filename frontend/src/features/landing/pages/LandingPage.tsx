import { useEffect, useState } from 'react';
import { Navbar } from '../../../components/marketing/landing/Navbar';
import { Hero } from '../../../components/marketing/landing/Hero';
import { CategoryShortcutRow } from '../../../components/marketing/landing/CategoryShortcutRow';
import { RecentCourses } from '../../../components/marketing/landing/RecentCourses';
import { PlatformCapabilities } from '../../../components/marketing/landing/PlatformCapabilities';
import { InstructorCta } from '../../../components/marketing/landing/InstructorCta';
import { Footer } from '../../../components/marketing/landing/Footer';
import { getCategories, type CategoryResponse } from '../../../api/categories';

export default function LandingPage() {
  // Fetched once at the page level and passed down to both Hero (search
  // suggestion chips) and CategoryShortcutRow, per the discovery spec —
  // avoids calling the public categories endpoint twice on one page load.
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        // Degrade silently: the hero and shortcut row simply omit their
        // category affordances if this fails. Search-by-text still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        <Hero categories={categories} />
        <CategoryShortcutRow categories={categories} />
        <RecentCourses />
        <PlatformCapabilities />
        <InstructorCta />
      </main>
      <Footer />
    </>
  );
}
