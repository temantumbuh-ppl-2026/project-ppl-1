import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "tt-focus-ring field-sizing-content min-h-11 w-full min-w-0 rounded-tt-md border border-tt-gray-200 bg-tt-surface px-3 py-2 text-base leading-[1.55] text-tt-gray-900 transition-colors duration-200 outline-none placeholder:text-tt-gray-400 disabled:cursor-not-allowed disabled:bg-tt-gray-100 disabled:text-tt-gray-400 aria-invalid:border-tt-attention-text aria-invalid:bg-tt-attention-bg motion-reduce:transition-none md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
