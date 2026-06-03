import { Bone } from './Bone';

export function AuthLayoutSkeleton() {
  return (
    <div role="status" className="relative min-h-screen flex">
      <span className="sr-only">Loading</span>

      {/* Logo placeholder — mirrors the absolute-positioned logo in AuthLayout */}
      <div className="absolute inset-x-0 top-8 flex justify-center z-10">
        <Bone className="h-9 w-32" />
      </div>

      {/* Form panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center pt-24 pb-12 px-6 sm:px-10 bg-surface">
        <div className="w-full max-w-md flex flex-col gap-5">
          <div className="flex flex-col gap-2 mb-2">
            <Bone className="h-8 w-48" />
            <Bone className="h-5 w-64" />
          </div>
          <div className="flex flex-col gap-4">
            <Bone className="h-11 w-full" />
            <Bone className="h-11 w-full" />
          </div>
          <Bone className="h-11 w-full mt-1" />
          <div className="flex justify-center mt-2">
            <Bone className="h-4 w-44" />
          </div>
        </div>
      </div>

      {/* Value panel — desktop only, mirrors salem-50 pitch column */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-center items-center pt-24 pb-12 px-6 sm:px-10 bg-salem-50">
        <div className="w-full max-w-md flex flex-col gap-4">
          <Bone className="h-8 w-52 mb-2" />
          <Bone className="h-5 w-72 mb-6" />
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Bone className="w-5 h-5 rounded-full shrink-0" />
              <Bone className="h-4 flex-1" />
            </div>
          ))}
          <Bone className="h-11 w-44 mt-6" />
        </div>
      </div>
    </div>
  );
}
