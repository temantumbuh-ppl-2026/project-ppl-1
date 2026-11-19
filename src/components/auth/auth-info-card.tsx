"use client";

import type { ReactNode } from "react";
import { AlertCircle, Info, UsersRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type IconType = "info" | "alert" | "parent";

interface AuthInfoCardProps {
  children: ReactNode;
  icon?: IconType;
  className?: string;
}

function resolveIcon(icon: IconType) {
  switch (icon) {
    case "alert":
      return <AlertCircle className="h-4 w-4" />;
    case "parent":
      return <UsersRound className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

export function AuthInfoCard({
  children,
  icon = "info",
  className,
}: AuthInfoCardProps) {
  return (
    <Alert
      className={cn(
        "border-[var(--color-brand-teal-pale)] bg-[var(--color-brand-teal-ghost)] text-[var(--color-text-brand-secondary)]",
        className,
      )}
    >
      {resolveIcon(icon)}
      <AlertDescription className="leading-relaxed">
        {children}
      </AlertDescription>
    </Alert>
  );
}
