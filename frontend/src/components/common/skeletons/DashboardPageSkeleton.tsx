import { Bone } from './Bone';

export function DashboardPageSkeleton() {
  return (
    <div aria-hidden="true" className="px-8 py-8 pb-14 max-w-container">

      {/* Page header */}
      <div className="mb-8">
        <Bone className="h-7 w-36 mb-2" />
        <Bone className="h-4 w-48" />
      </div>

      {/* Stats strip */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8">
        <Bone className="h-4 w-36" />
        <Bone className="h-4 w-32" />
        <Bone className="h-4 w-40" />
        <Bone className="h-4 w-28" />
      </div>

      {/* Continue Learning card */}
      <div className="mb-8">
        <Bone className="h-5 w-40 mb-4" />
        <Bone className="h-44 w-full rounded-lg" />
      </div>

      {/* My Courses section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <Bone className="h-5 w-28" />
          <div className="flex items-center gap-1">
            <Bone className="h-7 w-10 rounded-md" />
            <Bone className="h-7 w-24 rounded-md" />
            <Bone className="h-7 w-20 rounded-md" />
          </div>
        </div>

        {/* Featured row */}
        <Bone className="h-20 w-full rounded-lg mb-4" />

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="rounded-lg overflow-hidden border border-border-default bg-surface">
              <Bone className="aspect-video w-full rounded-none" />
              <div className="p-4 flex flex-col gap-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
                <Bone className="h-1 w-full rounded-full mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
