"use client";

import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { AlertCircle } from "lucide-react";
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
  const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(
        children as ReactElement<{
          "aria-describedby"?: string;
          "aria-invalid"?: boolean;
        }>,
        {
          "aria-describedby":
            [
              (children.props as { "aria-describedby"?: string })[
                "aria-describedby"
              ],
              descriptionId,
            ]
              .filter(Boolean)
              .join(" ") || undefined,
          "aria-invalid": error
            ? true
            : (children.props as { "aria-invalid"?: boolean })["aria-invalid"],
        },
      )
    : children;
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="font-semibold"
        style={{ color: "var(--tt-gray-900)" }}
      >
        {label}
      </Label>

      <div className="w-full">{control}</div>

      {!error && hint ? (
        <p
          id={`${id}-hint`}
          className="tt-text-caption"
          style={{ color: "var(--tt-gray-600)" }}
        >
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="tt-text-caption flex items-start gap-2 text-tt-attention-text"
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
