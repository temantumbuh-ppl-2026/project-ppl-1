"use client";

import { SettingsShell } from "@/components/settings/settings-shell";
import { ParentReportContent } from "@/components/settings/parent-report-content";

export default function ParentReportPage() {
  return (
    <SettingsShell>
      {({ data, refresh }) => (
        <ParentReportContent
          profile={data.user}
          parentStatus={data.parentStatus}
          parentStatusReason={data.parentStatusReason}
          pendingParentEmail={data.pendingParentEmail}
          onRefresh={refresh}
        />
      )}
    </SettingsShell>
  );
}
