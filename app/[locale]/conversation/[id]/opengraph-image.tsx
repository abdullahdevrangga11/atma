import { ImageResponse } from "next/og";
import { runStore } from "@/lib/store/runStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AMANA agent conversation";

export default async function ConversationOg({ params }: { params: { id: string } }) {
  const run = runStore.get(params.id);
  const accent = "#613BF9";

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
          <div style={{ fontSize: 22, color: "#858585" }}>// conversation</div>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.05 }}>
            Conversation expired
          </div>
          <div style={{ fontSize: 22, color: "#858585" }}>amana-iota.vercel.app</div>
        </div>
      ),
      { ...size },
    );
  }

  const subtitle = run.debate
    ? `${run.debate.length} veto · ${run.steps.length} messages`
    : `${run.steps.length} messages · clean handoff`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          padding: 56,
          fontFamily: "ui-monospace, SF Mono, monospace",
          color: "#0a0a0a",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width={32} height={48} viewBox="0 0 648 972" style={{ display: "flex" }}>
              <path fillRule="evenodd" clipRule="evenodd" fill={accent} d="M298 243V0H162C72.5312 0 0 72.5312 0 162V674L298 972V567C287.566 496.742 232.258 441.434 162 431V379C232.258 368.566 287.566 313.258 298 243Z" />
              <path fillRule="evenodd" clipRule="evenodd" fill={accent} d="M350 810V567C360.434 496.742 415.742 441.434 486 431V379C415.742 368.566 360.434 313.258 350 243V0L648 298V648C648 737.469 575.469 810 486 810H350Z" />
            </svg>
            <div style={{ fontSize: 22, fontWeight: 600 }}>AMANA</div>
            <div style={{ fontSize: 16, color: "#858585" }}>// agent conversation</div>
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#5e5e5e",
              border: "1px solid #e8e8e8",
              padding: "6px 14px",
              borderRadius: 999,
              display: "flex",
            }}
          >
            #orchestration-{params.id.slice(4, 12)}
          </div>
        </div>

        {/* Centerpiece */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 50 }}>
          <div style={{ fontSize: 18, color: "#858585", marginBottom: 8, display: "flex" }}>
            {subtitle}
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 600,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              color: accent,
              display: "flex",
            }}
          >
            {run.debate
              ? `Survived ${run.debate.length} veto${run.debate.length === 1 ? "" : "s"}`
              : run.risk.level === "trigger"
                ? "Defensive exit"
                : "Clean handoff"}
          </div>
        </div>

        {/* Agent rows — pseudo-chat preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 38 }}>
          <AgentRow
            color="#a78bfa"
            name="AllocatorAgent#1"
            line={`Proposed +${run.proposal.expectedAPYBps} bps · risk ${run.proposal.riskScore}/10`}
          />
          <AgentRow
            color="#fbbf24"
            name="RiskAgent#2"
            line={`${run.risk.level === "ok" ? "✓ approved" : run.risk.level === "warn" ? "⚠ warned" : "💀 defensive exit"} · ${run.risk.signal}`}
          />
          <AgentRow
            color="#84cc16"
            name="ReporterAgent#3"
            line={`Signed digest · +${run.report.outperformanceBps.vsDoNothing} bps vs nothing`}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 14,
            color: "#858585",
          }}
        >
          <div>amana-iota.vercel.app/conversation/{params.id.slice(0, 16)}…</div>
          <div style={{ display: "flex" }}>{run.totalCostCents !== undefined ? `cost $${(run.totalCostCents / 100).toFixed(4)}` : ""}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function AgentRow({ color, name, line }: { color: string; name: string; line: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 26, height: 26, background: color, borderRadius: 5, display: "flex" }} />
      <div style={{ fontSize: 18, fontWeight: 600, minWidth: 220, display: "flex" }}>{name}</div>
      <div style={{ fontSize: 16, color: "#5e5e5e", display: "flex" }}>{line}</div>
    </div>
  );
}
