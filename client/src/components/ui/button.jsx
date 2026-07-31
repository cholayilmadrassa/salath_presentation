import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-extrabold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.96] touch-manipulation select-none tracking-wide shadow-sm',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:brightness-105 active:brightness-95 border border-primary-foreground/20',
        secondary:
          'bg-secondary text-secondary-foreground shadow-md shadow-secondary/25 hover:brightness-110 active:brightness-95 border border-secondary-foreground/20',
        destructive:
          'bg-destructive text-destructive-foreground shadow-md shadow-destructive/25 hover:brightness-110 active:brightness-95 border border-destructive-foreground/20',
        outline:
          'border-2 border-primary bg-card text-primary font-black shadow-sm hover:bg-primary/10 active:bg-primary/20',
        soft:
          'bg-primary/15 text-primary border border-primary/30 font-black hover:bg-primary/25 active:bg-primary/35',
        ghost:
          'hover:bg-primary/10 hover:text-primary font-extrabold',
        link:
          'text-primary underline-offset-4 hover:underline font-extrabold shadow-none',
      },
      size: {
        default: 'h-12 px-6 py-3',
        sm: 'h-9 rounded-xl px-3.5 text-xs',
        lg: 'h-14 rounded-2xl px-8 text-base font-black',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
