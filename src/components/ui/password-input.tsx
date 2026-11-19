"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, hasError, disabled, ...props }, ref) => {
    const [show, setShow] = React.useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={show ? "text" : "password"}
          disabled={disabled}
          className={cn("pr-12", className)}
          {...props}
          aria-invalid={hasError || props["aria-invalid"]}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          disabled={disabled}
          className="tt-focus-ring absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-tt-md text-tt-gray-600 transition-colors hover:text-tt-primary-700 disabled:cursor-not-allowed disabled:text-tt-gray-400"
          aria-pressed={show}
          aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
