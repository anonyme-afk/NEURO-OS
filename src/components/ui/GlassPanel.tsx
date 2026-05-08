import React from 'react';
import { cn } from '../../lib/utils';

type GlassPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
};

export function GlassPanel({ children, className = '', ...props }: GlassPanelProps) {
  return (
    <div className={cn("glass-panel p-6 rounded-xl", className)} {...props}>
      {children}
    </div>
  );
}
