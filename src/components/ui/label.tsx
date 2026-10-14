"use client";

import * as React from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 tt-text-label text-tt-gray-900 select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-tt-gray-400 peer-disabled:cursor-not-allowed peer-disabled:text-tt-gray-400",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
