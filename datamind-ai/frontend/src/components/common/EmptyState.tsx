import React from 'react';
import { FolderPlus, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = <FolderPlus className="w-10 h-10 text-muted-foreground stroke-[1.5]" />,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-2xl bg-card/40 my-4">
      <div className="p-3 bg-muted rounded-2xl mb-4 text-foreground/80 shadow-subtle">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mt-1.5 mb-6">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} icon={actionIcon}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
