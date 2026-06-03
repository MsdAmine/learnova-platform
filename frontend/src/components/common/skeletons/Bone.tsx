import { cn } from '../../../lib/cn';

export function Bone({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('rounded-md skeleton-bone', className)} />
  );
}
