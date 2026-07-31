import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

const alertVariants = cva(
  'relative w-full rounded-xl border px-3 py-2 text-[11px] font-normal flex items-center gap-2 [&>svg]:shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5',
  {
    variants: {
      variant: {
        default: 'bg-card text-foreground border-border',
        destructive:
          'bg-red-50 border-red-200 text-red-700 [&>svg]:text-red-600',
        success:
          'bg-primary/10 border-primary/30 text-secondary [&>svg]:text-primary',
        warning:
          'bg-accent/15 border-gold-400/30 text-gold-900 [&>svg]:text-gold-600',
        info:
          'bg-secondary/5 border-secondary/20 text-secondary [&>svg]:text-secondary',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const alertIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
  info: Info,
};

const Alert = React.forwardRef(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const Icon = alertIcons[variant] || Info;
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon />
        <div className="flex-1">{children}</div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-[11px] font-normal [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
