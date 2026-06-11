"use client";

export function VaultStateDiagram() {
  return (
    <svg viewBox="0 0 280 180" className="w-full h-auto" aria-hidden>
      {/* dotted grid bg */}
      <defs>
        <pattern id="vgrid" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#e8e8e8" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="280" height="180" fill="url(#vgrid)" />

      {/* Center vault box */}
      <rect x="116" y="74" width="48" height="32" fill="#5b3df0" />
      <text x="140" y="93" fill="white" fontSize="10" fontFamily="monospace" textAnchor="middle">ATMA</text>

      {/* 4 asset boxes around */}
      <rect x="20" y="40" width="38" height="22" fill="#a78bfa" />
      <text x="39" y="54" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">USDY</text>

      <rect x="222" y="40" width="38" height="22" fill="#84cc16" />
      <text x="241" y="54" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">mUSD</text>

      <rect x="20" y="118" width="38" height="22" fill="#fbbf24" />
      <text x="39" y="132" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">AAVE</text>

      <rect x="222" y="118" width="38" height="22" fill="#f9a8d4" />
      <text x="241" y="132" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">MI4</text>

      {/* Connecting lines */}
      <line x1="58" y1="51" x2="116" y2="80" stroke="#0a0a0a" strokeWidth="1" />
      <line x1="222" y1="51" x2="164" y2="80" stroke="#0a0a0a" strokeWidth="1" />
      <line x1="58" y1="129" x2="116" y2="100" stroke="#0a0a0a" strokeWidth="1" />
      <line x1="222" y1="129" x2="164" y2="100" stroke="#0a0a0a" strokeWidth="1" />

    </svg>
  );
}

export function AgentSwarmDiagram() {
  return (
    <svg viewBox="0 0 280 180" className="w-full h-auto" aria-hidden>
      <defs>
        <pattern id="agrid" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#e8e8e8" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="280" height="180" fill="url(#agrid)" />

      {/* 3 agent circles */}
      <circle cx="80" cy="90" r="22" fill="none" stroke="#0a0a0a" strokeWidth="1.5" />
      <text x="80" y="93" fill="#0a0a0a" fontSize="9" fontFamily="monospace" textAnchor="middle">ALLOC</text>

      <circle cx="140" cy="60" r="22" fill="none" stroke="#0a0a0a" strokeWidth="1.5" />
      <text x="140" y="63" fill="#0a0a0a" fontSize="9" fontFamily="monospace" textAnchor="middle">RISK</text>

      <circle cx="200" cy="90" r="22" fill="none" stroke="#0a0a0a" strokeWidth="1.5" />
      <text x="200" y="93" fill="#0a0a0a" fontSize="9" fontFamily="monospace" textAnchor="middle">RPRT</text>

      {/* central skill block */}
      <rect x="116" y="120" width="48" height="22" fill="#5b3df0" />
      <text x="140" y="134" fill="white" fontSize="9" fontFamily="monospace" textAnchor="middle">SKILLS</text>

      {/* lines */}
      <line x1="80" y1="112" x2="120" y2="120" stroke="#0a0a0a" strokeWidth="1" />
      <line x1="140" y1="82" x2="140" y2="120" stroke="#0a0a0a" strokeWidth="1" />
      <line x1="200" y1="112" x2="160" y2="120" stroke="#0a0a0a" strokeWidth="1" />

    </svg>
  );
}

export function AttestationDiagram() {
  return (
    <svg viewBox="0 0 280 180" className="w-full h-auto" aria-hidden>
      {/* Header */}
      <rect x="0" y="0" width="280" height="20" fill="#f4f4f4" />
      <text x="12" y="14" fill="#5e5e5e" fontSize="9" fontFamily="monospace">ERC-8004 reputation registry</text>
      <circle cx="268" cy="10" r="3" fill="#84cc16" />

      {/* 3 rows of attestations */}
      {[34, 64, 94, 124, 154].map((y, i) => (
        <g key={y}>
          <rect x="12" y={y} width="256" height="22" fill={i === 1 ? "#5b3df0" : "white"} stroke="#e8e8e8" />
          <text x="20" y={y + 14} fill={i === 1 ? "white" : "#5e5e5e"} fontSize="9" fontFamily="monospace">
            tx 0x{(0x4f8a + i * 0xa1b).toString(16).slice(0, 4)}...
          </text>
          <text x="100" y={y + 14} fill={i === 1 ? "white" : "#5e5e5e"} fontSize="9" fontFamily="monospace">
            ALLOC#{i + 1}
          </text>
          <text x="170" y={y + 14} fill={i === 1 ? "white" : "#5e5e5e"} fontSize="9" fontFamily="monospace">
            ATTEST_REP
          </text>
          <rect x="240" y={y + 6} width="20" height="10" fill={i === 1 ? "white" : "#0a0a0a"} />
        </g>
      ))}
    </svg>
  );
}

export function PolicyAsDataDiagram() {
  return (
    <svg viewBox="0 0 280 180" className="w-full h-auto" aria-hidden>
      <defs>
        <pattern id="pgrid" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#e8e8e8" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="280" height="180" fill="url(#pgrid)" />

      {/* file icon */}
      <rect x="40" y="36" width="68" height="84" fill="white" stroke="#0a0a0a" strokeWidth="1.5" />
      <path d="M40 36l16 16h-16z" fill="#0a0a0a" />
      <line x1="50" y1="60" x2="98" y2="60" stroke="#e8e8e8" strokeWidth="1" />
      <line x1="50" y1="70" x2="92" y2="70" stroke="#e8e8e8" strokeWidth="1" />
      <line x1="50" y1="80" x2="98" y2="80" stroke="#e8e8e8" strokeWidth="1" />
      <line x1="50" y1="90" x2="80" y2="90" stroke="#e8e8e8" strokeWidth="1" />
      <line x1="50" y1="100" x2="96" y2="100" stroke="#e8e8e8" strokeWidth="1" />
      <text x="74" y="48" fill="#0a0a0a" fontSize="7" fontFamily="monospace" textAnchor="middle">SKILL.md</text>

      {/* arrow */}
      <path d="M120 78l32 0M150 72l8 6-8 6" stroke="#0a0a0a" strokeWidth="1.5" fill="none" />

      {/* destination — agent */}
      <rect x="170" y="50" width="70" height="56" fill="#5b3df0" />
      <text x="205" y="74" fill="white" fontSize="10" fontFamily="monospace" textAnchor="middle">CLAUDE</text>
      <text x="205" y="88" fill="rgba(255,255,255,0.7)" fontSize="8" fontFamily="monospace" textAnchor="middle">reasons</text>

    </svg>
  );
}
