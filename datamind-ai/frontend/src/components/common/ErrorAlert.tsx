import React from 'react';
import { AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'warning' | 'error';
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
  variant = 'error',
}) => {
  const isError = variant === 'error';

  return (
    <div
      className={cn(
        'p-4 rounded-xl border flex items-start gap-3.5 my-3',
        isError
          ? 'bg-destructive/10 border-destructive/20 text-destructive'
          : 'bg-warning/10 border-warning/20 text-warning',
        className
      )}
    >
      {isError ? (
        <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold tracking-tight">{title}</h4>
        <p className="text-xs opacity-90 mt-0.5 break-words">{message}</p>
        {onRetry && (
          <div className="mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-xs h-7 px-2.5 bg-background/50 border-current/20 hover:bg-background"
            >
              Retry request
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
