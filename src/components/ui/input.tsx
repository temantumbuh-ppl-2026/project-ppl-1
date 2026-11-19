import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "tt-focus-ring h-11 w-full min-w-0 rounded-tt-md border border-tt-gray-200 bg-tt-surface px-3 py-2 text-base leading-relaxed text-tt-gray-900 transition-colors duration-200 outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-tt-gray-900 placeholder:text-tt-gray-400 disabled:cursor-not-allowed disabled:bg-tt-gray-100 disabled:text-tt-gray-400 aria-invalid:border-tt-attention-text aria-invalid:bg-tt-attention-bg motion-reduce:transition-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
