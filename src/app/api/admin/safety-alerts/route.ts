import { requireAdminApi } from "@/lib/admin/authorization";
import { listSafetyAlerts } from "@/lib/safety-alerts/service";
import { safetyAlertQuerySchema } from "@/lib/safety-alerts/validation";
import { safetyJson, safetyErrorResponse } from "@/lib/safety-alerts/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminApi(request);
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = safetyAlertQuerySchema.safeParse(
      Object.fromEntries(
        Object.entries(params).map(([key, value]) => [
          key,
          value === "" ? undefined : value,
        ]),
      ),
    );
    if (!parsed.success)
      return safetyJson(
        { error: "Filter atau pagination safety alert tidak valid." },
        400,
      );
    return safetyJson({ data: await listSafetyAlerts(parsed.data) });
  } catch (error) {
    return safetyErrorResponse(error);
  }
}
