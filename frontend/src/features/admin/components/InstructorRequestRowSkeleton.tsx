import { Bone } from '../../../components/common/skeletons/Bone';

export function InstructorRequestRowSkeleton() {
  return (
    <div className="bg-surface border border-border-default rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <Bone className="h-4 w-40" />
        <Bone className="h-4 w-16 rounded-full" />
      </div>
      <Bone className="h-3 w-56 mb-4" />
      <Bone className="h-3 w-20 mb-1" />
      <Bone className="h-4 w-full mb-2" />
      <Bone className="h-3 w-16 mb-1" />
      <Bone className="h-12 w-full mb-4" />
      <div className="flex justify-end gap-2">
        <Bone className="h-11 w-20 rounded-md" />
        <Bone className="h-11 w-16 rounded-md" />
      </div>
    </div>
  );
}
