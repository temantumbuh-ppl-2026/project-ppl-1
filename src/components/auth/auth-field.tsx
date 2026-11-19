"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";

interface AuthFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function AuthField({
  id,
  label,
  error,
  hint,
  children,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm font-semibold"
        style={{ color: "var(--color-text-brand-primary)" }}
      >
        {label}
      </Label>

      <div className="w-full">{children}</div>

      {!error && hint ? (
        <p
          className="text-xs"
          style={{ color: "var(--color-text-brand-muted)" }}
        >
          {hint}
        </p>
      ) : null}

      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
