import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.06em] font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-bg-soft)] border border-[var(--color-border)] text-[var(--color-text-secondary)]",
        accent:
          "bg-[var(--color-primary-soft)] border border-[var(--color-border-accent)] text-[var(--color-primary)]",
        success:
          "bg-emerald-50 border border-emerald-200 text-emerald-700",
        warning:
          "bg-amber-50 border border-amber-200 text-amber-700",
        danger:
          "bg-red-50 border border-red-200 text-red-700",
        outline:
          "border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
