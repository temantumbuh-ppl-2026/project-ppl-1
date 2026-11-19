import { requireAdminApi } from "@/lib/admin/authorization";
import { getSafetyAlert, reviewSafetyAlert } from "@/lib/safety-alerts/service";
import { safetyAlertReviewSchema } from "@/lib/safety-alerts/validation";
import { safetyJson, safetyErrorResponse } from "@/lib/safety-alerts/http";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ alertId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdminApi(request);
    const { alertId } = await context.params;
    return safetyJson({ data: { alert: await getSafetyAlert(alertId) } });
  } catch (error) {
    return safetyErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdminApi(request);
    const { alertId } = await context.params;
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return safetyJson({ error: "Body JSON tidak valid." }, 400);
    }
    const parsed = safetyAlertReviewSchema.safeParse(payload);
    if (!parsed.success)
      return safetyJson(
        {
          error:
            "Status atau catatan review tidak valid (maksimal 1000 karakter).",
        },
        400,
      );
    return safetyJson({
      data: { alert: await reviewSafetyAlert(alertId, admin.id, parsed.data) },
    });
  } catch (error) {
    return safetyErrorResponse(error);
  }
}
