// src/components/admin/OverviewPage.tsx
// Server component — no "use client"

type SegmentCount = { segment: string; count: number };
type Stats = {
  totalUsers: number;
  premiumUsers: number;
  activeUsers: number;
  nonActiveUsers: number;
  totalQuestionsActive: number;
  newUsersThisMonth: number;
  quizLogCount: number;
  segmentCounts: SegmentCount[];
};

function pct(part: number, total: number) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}
function n(v: number) {
  return v.toLocaleString("id-ID");
}

const C = {
  brand: "var(--tt-dashboard-brand)",
  success: "var(--tt-dashboard-success)",
  warning: "var(--tt-dashboard-warning)",
  danger: "var(--tt-dashboard-danger)",
  text: "var(--tt-dashboard-text)",
  text2: "var(--tt-dashboard-text-2)",
  text3: "var(--tt-dashboard-text-3)",
  card: {
    background: "var(--tt-dashboard-card-bg)",
    border: "1px solid var(--tt-dashboard-card-border)",
    borderRadius: 18,
    boxShadow: "var(--tt-dashboard-card-shadow)",
    backdropFilter: "blur(18px) saturate(160%)",
  } as React.CSSProperties,
};

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent: string;
}) {
  return (
    <div className="tt-stat-card" style={{ ...C.card }}>
      <p
        className="tt-stat-value"
        style={{
          fontWeight: 900,
          color: accent,
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {typeof value === "number" ? n(value) : value}
      </p>
      <div>
        <p className="tt-stat-label" style={{ fontWeight: 700, color: C.text }}>
          {label}
        </p>
        <p
          className="tt-stat-sub"
          style={{ color: C.text3, marginTop: 3, lineHeight: 1.4 }}
        >
          {sub}
        </p>
      </div>
    </div>
  );
}

const SEG_META: Record<string, { label: string; color: string }> = {
  ANAK: { label: "Anak (10–12 thn)", color: "#3b82f6" },
  REMAJA: { label: "Remaja (13–17 thn)", color: "#8b5cf6" },
  MAHASISWA: { label: "Mahasiswa (18–24 thn)", color: "#1a9688" },
  DEWASA_MUDA: { label: "Dewasa Muda (25+ thn)", color: "#f59e0b" },
};
const SEGS = ["ANAK", "REMAJA", "MAHASISWA", "DEWASA_MUDA"] as const;

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        ...C.card,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="tt-section-header"
        style={{
          borderBottom: "1px solid var(--tt-dashboard-card-border)",
          background: "rgba(26,150,136,0.04)",
        }}
      >
        <p
          className="tt-section-title"
          style={{ fontWeight: 700, color: C.text }}
        >
          {title}
        </p>
      </div>
      <div className="tt-section-body" style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
}

const RESPONSIVE_CSS = `
  .tt-overview-root {
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .tt-kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 16px;
    align-items: stretch;
  }
  .tt-row-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    align-items: stretch;
  }
  .tt-stat-card {
    padding: 24px 26px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 14px;
  }
  .tt-stat-value { font-size: 36px; }
  .tt-stat-label { font-size: 13px; }
  .tt-stat-sub   { font-size: 11px; }
  .tt-section-header { padding: 15px 22px; }
  .tt-section-body   { padding: 18px 22px; }
  .tt-section-title  { font-size: 14px; }

  @media (max-width: 640px) {
    .tt-overview-root { padding: 14px; gap: 16px; }
    .tt-kpi-grid {
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 10px;
    }
    .tt-row-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
    .tt-stat-card  { padding: 16px 18px; gap: 10px; }
    .tt-stat-value { font-size: 26px; }
    .tt-stat-label { font-size: 12px; }
    .tt-stat-sub   { font-size: 10px; }
    .tt-section-header { padding: 12px 16px; }
    .tt-section-body   { padding: 14px 16px; }
    .tt-section-title  { font-size: 13px; }
  }
  @media (min-width: 641px) and (max-width: 1024px) {
    .tt-overview-root { padding: 18px 20px; }
    .tt-kpi-grid {
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
    }
    .tt-stat-value { font-size: 30px; }
  }
`;

export function OverviewPage({ stats }: { stats: Stats }) {
  const maxSeg = Math.max(...stats.segmentCounts.map((s) => s.count), 1);

  return (
    <>
      <style>{RESPONSIVE_CSS}</style>
      <div className="tt-overview-root">
        {/* ── KPI Grid ── */}
        <div className="tt-kpi-grid">
          <StatCard
            label="Total Pengguna"
            value={stats.totalUsers}
            sub={`+${n(stats.newUsersThisMonth)} bergabung bulan ini`}
            accent={C.brand}
          />
          <StatCard
            label="Pengguna Premium"
            value={stats.premiumUsers}
            sub={`${pct(stats.premiumUsers, stats.totalUsers)} dari total user`}
            accent={C.warning}
          />
          <StatCard
            label="Akun Aktif"
            value={stats.activeUsers}
            sub={`${n(stats.nonActiveUsers)} akun nonaktif`}
            accent={C.success}
          />
          <StatCard
            label="Soal BraveChoice"
            value={stats.totalQuestionsActive}
            sub="Soal aktif tersedia"
            accent={C.brand}
          />
          <StatCard
            label="Total Jawaban Quiz"
            value={stats.quizLogCount}
            sub="Seluruh log jawaban user"
            accent="#8b5cf6"
          />
        </div>

        {/* ── Row 2 ── */}
        <div className="tt-row-grid">
          {/* Soal per Segmen */}
          <SectionCard title="Soal BraveChoice per Segmen">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {SEGS.map((seg) => {
                const found = stats.segmentCounts.find(
                  (s) => s.segment === seg,
                );
                const count = found?.count ?? 0;
                const barW = Math.max(4, Math.round((count / maxSeg) * 100));
                const meta = SEG_META[seg]!;
                return (
                  <div key={seg}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 6,
                        gap: 8,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: C.text2,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {meta.label}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: meta.color,
                        }}
                      >
                        {count}
                      </p>
                    </div>
                    <div
                      style={{
                        height: 7,
                        borderRadius: 100,
                        background: "rgba(0,0,0,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${barW}%`,
                          height: "100%",
                          borderRadius: 100,
                          background: meta.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Komposisi Akun */}
          <SectionCard title="Komposisi Akun">
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                {
                  label: "Pengguna Aktif",
                  value: stats.activeUsers,
                  total: stats.totalUsers,
                  color: C.success,
                },
                {
                  label: "Pengguna Nonaktif",
                  value: stats.nonActiveUsers,
                  total: stats.totalUsers,
                  color: C.danger,
                },
                {
                  label: "Pengguna Premium",
                  value: stats.premiumUsers,
                  total: stats.totalUsers,
                  color: C.warning,
                },
                {
                  label: "Pengguna Basic",
                  value: stats.totalUsers - stats.premiumUsers,
                  total: stats.totalUsers,
                  color: C.text3,
                },
              ].map((row) => (
                <div key={row.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <p
                      style={{ fontSize: 12, fontWeight: 600, color: C.text2 }}
                    >
                      {row.label}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        color: row.color,
                      }}
                    >
                      {n(row.value)}{" "}
                      <span
                        style={{
                          fontWeight: 400,
                          color: C.text3,
                          fontSize: 10,
                        }}
                      >
                        ({pct(row.value, row.total)})
                      </span>
                    </p>
                  </div>
                  <div
                    style={{
                      height: 7,
                      borderRadius: 100,
                      background: "rgba(0,0,0,0.06)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: pct(row.value, row.total),
                        height: "100%",
                        borderRadius: 100,
                        background: row.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
