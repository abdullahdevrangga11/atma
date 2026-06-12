import { ImageResponse } from "next/og";
import { marketplaceStore } from "@/lib/store/marketplaceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AMANA marketplace skill";

const AGENT_BG: Record<string, string> = {
  allocator: "#ede9fe",
  risk: "#ffedd5",
  reporter: "#ecfccb",
};
const AGENT_FG: Record<string, string> = {
  allocator: "#5b3df0",
  risk: "#ea580c",
  reporter: "#65a30d",
};

export default async function MarketplaceOg({ params }: { params: { id: string } }) {
  const entry = marketplaceStore.get(params.id);

  if (!entry) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff", padding: 60, color: "#0a0a0a", fontFamily: "ui-monospace, SF Mono, monospace", fontSize: 40 }}>
          Skill not found
        </div>
      ),
      { ...size },
    );
  }

  const bg = AGENT_BG[entry.agent];
  const fg = AGENT_FG[entry.agent];

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
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 32, height: 32, background: "#5b3df0", borderRadius: 6 }} />
            <div style={{ fontSize: 22, fontWeight: 600 }}>AMANA</div>
            <div style={{ fontSize: 16, color: "#858585" }}>// marketplace</div>
          </div>
          <div
            style={{
              fontSize: 14,
              padding: "6px 14px",
              borderRadius: 999,
              background: bg,
              color: fg,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
              display: "flex",
            }}
          >
            {entry.agent}
          </div>
        </div>

        {/* Centerpiece */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 50, flex: 1 }}>
          <div style={{ fontSize: 22, color: "#858585", marginBottom: 14, display: "flex" }}>
            @{entry.author}
          </div>
          <div
            style={{
              fontSize: 78,
              fontWeight: 600,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              marginBottom: 26,
              display: "flex",
            }}
          >
            {entry.title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#5e5e5e",
              maxWidth: 1000,
              lineHeight: 1.3,
              display: "flex",
            }}
          >
            {entry.tagline}
          </div>
        </div>

        {/* Stats strip */}
        <div style={{ display: "flex", gap: 18, marginTop: 30 }}>
          <Stat label="stars" value={entry.stars.toString()} accent={fg} />
          <Stat label="forks" value={entry.forks.toString()} accent={fg} />
          <Stat label="runs" value={entry.runCount.toString()} accent={fg} />
          <Stat label="bytes" value={entry.body.length.toString()} accent="#0a0a0a" />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 16,
            color: "#858585",
          }}
        >
          <div>atma-iota.vercel.app/marketplace/{params.id.slice(0, 14)}…</div>
          <div style={{ display: "flex" }}>policy is forkable</div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#fafafa",
        border: "1px solid #e8e8e8",
        padding: "14px 20px",
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ fontSize: 12, color: "#858585", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: accent, display: "flex" }}>
        {value}
      </div>
    </div>
  );
}
