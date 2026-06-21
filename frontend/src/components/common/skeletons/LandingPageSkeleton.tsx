import { Bone } from './Bone';

export function LandingPageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen">
      <output className="sr-only">Loading</output>

      {/* Topbar — mirrors marketing Navbar height and layout */}
      <div className="h-nav-mobile md:h-nav bg-surface border-b border-border-default flex items-center justify-between px-6 md:px-12 shrink-0">
        <Bone className="h-6 w-28" />
        <div className="hidden md:flex items-center gap-6">
          <Bone className="h-4 w-16" />
          <Bone className="h-4 w-20" />
          <Bone className="h-4 w-14" />
        </div>
        <div className="flex items-center gap-3">
          <Bone className="h-8 w-16 hidden sm:block" />
          <Bone className="h-9 w-24" />
        </div>
      </div>

      {/* Hero — Salem full-bleed, mirrors the search-first hero section */}
      <div className="flex-1 bg-salem flex items-center justify-center px-6">
        <div className="w-full max-w-2xl flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-full rounded-lg bg-white/10" aria-hidden="true" />
          <div className="h-8 w-4/5 rounded-lg bg-white/10" aria-hidden="true" />
          <div className="h-5 w-3/5 rounded-md bg-white/[0.07] mt-2" aria-hidden="true" />
          <div className="flex gap-3 mt-6 w-full max-w-md">
            <div className="h-12 flex-1 rounded-md bg-white/15" aria-hidden="true" />
            <div className="h-12 w-24 rounded-md bg-white/15" aria-hidden="true" />
          </div>
          <div className="flex gap-2 mt-4">
            <div className="h-7 w-20 rounded-full bg-white/10" aria-hidden="true" />
            <div className="h-7 w-24 rounded-full bg-white/10" aria-hidden="true" />
            <div className="h-7 w-16 rounded-full bg-white/10" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  );
}
