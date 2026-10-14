import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "tt-focus-ring group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-tt-md border border-transparent bg-clip-padding tt-text-button whitespace-nowrap transition-colors duration-200 outline-none select-none active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-tt-gray-100 disabled:text-tt-gray-400 disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // PB20 §6.6: white on base teal is only 3.21:1; Deep is 5.08:1.
        default:
          "bg-tt-button-primary text-tt-surface hover:bg-tt-primary-700 active:bg-tt-primary-900",
        outline:
          "border-tt-primary-200 bg-tt-gray-50 text-tt-primary-700 hover:bg-tt-primary-50 aria-expanded:bg-tt-primary-100",
        secondary:
          "border-tt-primary-200 bg-tt-primary-50 text-tt-primary-700 hover:bg-tt-primary-100 aria-expanded:bg-tt-primary-100",
        ghost:
          "text-tt-primary-700 hover:bg-tt-primary-50 hover:underline underline-offset-4 aria-expanded:bg-tt-primary-100",
        destructive:
          "border-tt-attention-border bg-tt-attention-bg text-tt-attention-text hover:bg-tt-attention-border",
        link: "text-tt-primary-700 underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        // Compact variants (36px) are reserved for dense admin toolbars.
        xs: "h-9 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 text-sm [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-6 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11",
        "icon-xs": "size-9 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
