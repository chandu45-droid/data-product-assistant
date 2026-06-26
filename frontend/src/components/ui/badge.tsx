import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium border",
  {
    variants: {
      variant: {
        default: "bg-slate-100 text-slate-700 border-slate-200",
        draft: "bg-slate-100 text-slate-600 border-slate-200",
        "in-progress": "bg-blue-50 text-blue-700 border-blue-200",
        validated: "bg-emerald-50 text-emerald-700 border-emerald-200",
        done: "bg-emerald-50 text-emerald-700 border-emerald-200",
        blocked: "bg-red-50 text-red-700 border-red-200",
        critical: "bg-red-50 text-red-700 border-red-200",
        high: "bg-amber-50 text-amber-700 border-amber-200",
        medium: "bg-blue-50 text-blue-700 border-blue-200",
        low: "bg-slate-50 text-slate-600 border-slate-200",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200",
        warning: "bg-amber-50 text-amber-700 border-amber-200",
        danger: "bg-red-50 text-red-700 border-red-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
