import { type HTMLAttributes, type Ref } from 'react';
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

export function Container({ size = 'default', className, children, ref, ...props }: ContainerProps & { ref?: Ref<HTMLDivElement> }) {
  return (
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
  );
}
