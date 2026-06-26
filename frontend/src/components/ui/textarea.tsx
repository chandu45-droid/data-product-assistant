"use client";

import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, error, helperText, showCount, maxLength, value, id, ...props },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          className={cn(
            "flex min-h-[120px] w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-slate-400 transition-colors resize-y",
            "focus:outline-none focus:ring-2 focus:ring-primary-accent focus:border-transparent",
            error && "border-danger focus:ring-danger",
            className
          )}
          ref={ref}
          maxLength={maxLength}
          value={value}
          {...props}
        />
        <div className="flex justify-between">
          <div>
            {error && (
              <p className="text-xs text-danger">{error}</p>
            )}
            {helperText && !error && (
              <p className="text-xs text-text-secondary">{helperText}</p>
            )}
          </div>
          {showCount && maxLength && (
            <p className="text-xs text-text-secondary">
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
