import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] touch-manipulation select-none tracking-normal cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-[#468B3A] to-[#296E37] text-white shadow-sm hover:shadow-md hover:shadow-[#468B3A]/20 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] border border-white/20',
        secondary:
          'bg-gradient-to-r from-[#296E37] to-[#1E5229] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] border border-white/15',
        gold:
          'bg-gradient-to-r from-[#7EC242] via-[#6EB240] to-[#468B3A] text-white font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] border border-white/30',
        destructive:
          'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] border border-white/20',
        outline:
          'border border-primary/80 bg-card text-primary shadow-sm hover:bg-primary/10 active:scale-[0.97]',
        soft:
          'bg-primary/12 text-primary border border-primary/20 hover:bg-primary/20 active:scale-[0.97]',
        ghost:
          'hover:bg-primary/10 hover:text-primary shadow-none',
        link:
          'text-primary underline-offset-4 hover:underline shadow-none p-0 h-auto',
      },
      size: {
        default: 'h-11 px-5 py-2.5',
        sm: 'h-9 rounded-lg px-3.5 text-xs font-medium',
        lg: 'h-12 rounded-xl px-6 text-sm font-semibold',
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
