import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'brand';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className,
  dot = false,
}) => {
  const variants = {
    neutral: 'bg-muted text-muted-foreground border-border',
    brand: 'bg-brand-500/10 text-brand-500 border-brand-500/20',
    success: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    error: 'bg-destructive/10 text-destructive border-destructive/20',
  };

  const dotColors = {
    neutral: 'bg-muted-foreground',
    brand: 'bg-brand-500',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5 font-medium',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border transition-colors',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};
