import { z } from "zod";
import {
  SafetyAlertStatus,
  SafetyCategory,
} from "@/app/generated/prisma/enums";

export const safetyAlertQuerySchema = z.strictObject({
  status: z.enum([...Object.values(SafetyAlertStatus), "all"]).default("OPEN"),
  riskLevel: z.enum(["HIGH", "ATTENTION", "all"]).default("HIGH"),
  category: z.enum([...Object.values(SafetyCategory), "all"]).default("all"),
  page: z.coerce.number().int().min(1).max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const safetyAlertReviewSchema = z.strictObject({
  status: z.enum(SafetyAlertStatus),
  reviewNote: z
    .string()
    .max(1000)
    .transform((value) => value.trim())
    .nullable()
    .optional(),
  // Optional for existing clients; updated clients use this to detect stale forms.
  expectedUpdatedAt: z.iso.datetime({ offset: true }).optional(),
});

export type SafetyAlertFilters = z.infer<typeof safetyAlertQuerySchema>;
export type SafetyAlertReviewInput = z.infer<typeof safetyAlertReviewSchema>;
