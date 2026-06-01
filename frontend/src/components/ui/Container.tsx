import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export type ContainerSize = 'prose' | 'default' | 'wide';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
}

const maxWidthClass: Record<ContainerSize, string> = {
  prose:   'max-w-container-prose',
  default: 'max-w-container',
  wide:    'max-w-container-wide',
};

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = 'default', className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'w-full mx-auto px-6 md:px-8 lg:px-12',
        maxWidthClass[size],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);

Container.displayName = 'Container';
