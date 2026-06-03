import { DashboardPageSkeleton } from './DashboardPageSkeleton';
import { Bone } from './Bone';

export function DashboardLayoutSkeleton() {
  return (
    <div role="status" className="flex flex-col h-screen overflow-hidden bg-bg-base">
      <span className="sr-only">Loading</span>

      {/* Topbar — matches DashboardLayout's 60px header */}
      <header className="h-[60px] bg-surface border-b border-border-default flex items-center px-4 md:px-6 shrink-0">
        <Bone className="h-7 w-28" />
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          <Bone className="w-11 h-11 rounded-md" />
          <Bone className="w-8 h-8 rounded-full" />
          <Bone className="h-4 w-28 hidden sm:block" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar — matches 250px width, hidden on mobile */}
        <aside className="hidden md:flex w-[250px] bg-surface border-r border-border-default flex-col shrink-0">
          <div className="flex flex-col gap-0.5 p-4 pt-5 flex-1">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <Bone key={i} className="h-9 w-full rounded-md" />
            ))}
          </div>
          {/* CTA card area */}
          <div className="p-4 pt-2">
            <Bone className="h-[88px] w-full rounded-lg" />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <DashboardPageSkeleton />
        </main>

      </div>
    </div>
  );
}
