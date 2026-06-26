import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SpinnerProps {
  className?: string;
  message?: string;
}

export function Spinner({ className, message }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2
        className={cn("h-8 w-8 animate-spin text-primary-accent", className)}
      />
      {message && (
        <p className="text-sm text-text-secondary animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}

export function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "h-4 rounded-md bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
      <SkeletonLine className="h-5 w-1/3" />
      <SkeletonLine className="h-4 w-2/3" />
      <SkeletonLine className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <SkeletonLine className="h-6 w-16 rounded-full" />
        <SkeletonLine className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function PageLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center min-h-[400px]">
      <Spinner message={message || "Loading..."} />
    </div>
  );
}
