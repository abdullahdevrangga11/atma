import { ImageResponse } from "next/og";
import { runStore } from "@/lib/store/runStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AMANA orchestration run";

/**
 * Open Graph image for a specific run permalink.
 *
 * Renders a Twitter-friendly summary card: outperformance bps, risk outcome,
 * agent signatures. Generated on-demand from runStore; falls back to a clean
 * "Run not found" plate when the in-memory store has expired.
 */
export default async function RunOg({ params }: { params: { id: string } }) {
  const run = runStore.get(params.id);

  if (!run) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: "#ffffff",
            color: "#0a0a0a",
            fontFamily: "ui-monospace, SF Mono, monospace",
            padding: 60,
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontSize: 22, color: "#858585" }}>// run not found</div>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.05 }}>
            AMANA · run expired
          </div>
          <div style={{ fontSize: 22, color: "#858585" }}>
            amana-iota.vercel.app
          </div>
        </div>
      ),
      { ...size },
    );
  }

  const accent = "#613BF9";
  const lime = "#84cc16";
  const totalMs = run.finishedAt - run.startedAt;
  const outBps = run.report.outperformanceBps.vsDoNothing;
  const outcome =
    run.risk.level === "trigger"
      ? "Defensive exit"
      : run.debate
        ? "Survived a veto"
        : "Clean allocation";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          padding: 60,
          fontFamily: "ui-monospace, SF Mono, monospace",
          color: "#0a0a0a",
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width={36} height={54} viewBox="0 0 648 972" style={{ display: "flex" }}>
              <path fillRule="evenodd" clipRule="evenodd" fill={accent} d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z" />
              <path fillRule="evenodd" clipRule="evenodd" fill={accent} d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z" />
            </svg>
            <div style={{ fontSize: 24, fontWeight: 600 }}>AMANA</div>
            <div style={{ fontSize: 18, color: "#858585" }}>
              treasury orchestration · mantle
            </div>
          </div>
          <div
            style={{
              fontSize: 16,
              color: "#858585",
              border: "1px solid #e8e8e8",
              padding: "8px 16px",
              borderRadius: 999,
              display: "flex",
            }}
          >
            {totalMs}ms · {run.steps.length} agents
          </div>
        </div>

        {/* Centerpiece */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 60 }}>
          <div style={{ fontSize: 20, color: "#858585", marginBottom: 8, display: "flex" }}>
            // {outcome.toLowerCase()}
          </div>
          <div
            style={{
              fontSize: 100,
              fontWeight: 600,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              color: outBps >= 0 ? accent : "#dc2626",
              display: "flex",
            }}
          >
            {outBps >= 0 ? "+" : ""}{outBps} bps
          </div>
          <div style={{ fontSize: 30, color: "#5e5e5e", marginTop: 16, display: "flex" }}>
            annualised, vs do-nothing
          </div>
        </div>

        {/* Stat strip */}
        <div style={{ display: "flex", gap: 24, marginTop: 50 }}>
          <Stat label="actual APY" value={`${(run.report.actualAPYBps / 100).toFixed(2)}%`} />
          <Stat label="risk level" value={run.risk.level} accent={run.risk.level === "ok" ? lime : "#ea580c"} />
          <Stat label="cost" value={run.totalCostCents !== undefined ? `$${(run.totalCostCents / 100).toFixed(4)}` : "—"} />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 18,
            color: "#858585",
          }}
        >
          <div>amana-iota.vercel.app/runs/{params.id.slice(0, 16)}…</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ background: "#a78bfa", color: "white", padding: "4px 10px", borderRadius: 999 }}>Allocator</span>
            <span style={{ background: "#fbbf24", color: "white", padding: "4px 10px", borderRadius: 999 }}>Risk</span>
            <span style={{ background: "#84cc16", color: "white", padding: "4px 10px", borderRadius: 999 }}>Reporter</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#fafafa",
        border: "1px solid #e8e8e8",
        padding: "18px 22px",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 14, color: "#858585", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex" }}>
        {label}
      </div>
      <div style={{ fontSize: 32, fontWeight: 600, color: accent ?? "#0a0a0a", display: "flex" }}>
        {value}
      </div>
    </div>
  );
}
