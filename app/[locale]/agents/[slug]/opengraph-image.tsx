import { ImageResponse } from "next/og";
import { AGENT_BY_SLUG } from "@/lib/agents/identity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "AMANA agent profile";

export default async function AgentOg({ params }: { params: { slug: string } }) {
  const identity = AGENT_BY_SLUG[params.slug];
  if (!identity) {
    return new ImageResponse(
      (
        <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff", padding: 60, color: "#0a0a0a", fontFamily: "ui-monospace, SF Mono, monospace", fontSize: 40 }}>
          Agent not found
        </div>
      ),
      { ...size },
    );
  }

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
            <svg width={32} height={48} viewBox="0 0 648 972" style={{ display: "flex" }}>
              <path fillRule="evenodd" clipRule="evenodd" fill="#613BF9" d="M298 0V243C287.566 313.258 232.258 368.566 162 379V431C232.258 441.434 287.566 496.742 298 567V972H0V162C0 72.5312 72.5312 0 162 0H298Z" />
              <path fillRule="evenodd" clipRule="evenodd" fill="#613BF9" d="M350 567V810H486C575.469 810 648 737.469 648 648V0H350V243C360.434 313.258 415.742 368.566 486 379V431C415.742 441.434 360.434 496.742 350 567Z" />
            </svg>
            <div style={{ fontSize: 22, fontWeight: 600 }}>AMANA</div>
            <div style={{ fontSize: 16, color: "#858585", display: "flex" }}>
              // erc-8004 identity #{identity.identityId}
            </div>
          </div>
        </div>

        {/* Big avatar + name */}
        <div style={{ display: "flex", gap: 32, marginTop: 60, alignItems: "flex-start" }}>
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 18,
              background: "#ffffff",
              border: "1px solid #e8e8e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `inset 0 0 0 6px ${identity.accentColor}22`,
            }}
          >
            <div style={{ width: 56, height: 56, background: identity.accentColor, borderRadius: 8 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ fontSize: 26, color: "#858585", marginBottom: 6, display: "flex" }}>
              Agent #{identity.displayNumber}
            </div>
            <div style={{ fontSize: 82, fontWeight: 600, lineHeight: 1.0, letterSpacing: "-0.02em", display: "flex" }}>
              {identity.name}
            </div>
            <div style={{ fontSize: 20, color: "#5e5e5e", marginTop: 12, display: "flex", maxWidth: 760 }}>
              {identity.capabilities[0]}
            </div>
          </div>
        </div>

        {/* Address + skill */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 50 }}>
          <KV label="address" value={`${identity.address.slice(0, 18)}…${identity.address.slice(-10)}`} accent={identity.accentColor} />
          <KV label="skill" value={`skills/${identity.skillFile}`} accent={identity.accentColor} />
          <KV label="default action" value={identity.verb} accent={identity.accentColor} />
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 16,
            color: "#858585",
          }}
        >
          <div>amana-iota.vercel.app/agents/{identity.slug}</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["Allocator", "Risk", "Reporter"].map((n, i) => (
              <span
                key={n}
                style={{
                  background:
                    i === 0 ? "#a78bfa" : i === 1 ? "#fbbf24" : "#84cc16",
                  color: "white",
                  padding: "3px 9px",
                  borderRadius: 999,
                  fontSize: 12,
                  display: "flex",
                  opacity: n === identity.name.replace("Agent", "") ? 1 : 0.4,
                }}
              >
                {n}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function KV({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          fontSize: 12,
          color: "#858585",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          display: "flex",
          minWidth: 140,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, color: accent, display: "flex" }}>{value}</div>
    </div>
  );
}
