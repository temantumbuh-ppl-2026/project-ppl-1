"use client";

import { SettingsShell } from "@/components/settings/settings-shell";
import { ProfileContent } from "@/components/settings/profile-content";

export default function ProfilePage() {
  return (
    <SettingsShell>
      {({ data, refresh }) => (
        <ProfileContent
          profile={data.user}
          parentStatus={data.parentStatus}
          pendingParentEmail={data.pendingParentEmail}
          isGoogleLinked={data.isGoogleLinked}
          hasPassword={data.hasPassword}
          onRefresh={refresh}
        />
      )}
    </SettingsShell>
  );
}
