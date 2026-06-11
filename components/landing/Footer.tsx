"use client";

import Link from "next/link";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { name: "Vault", href: "/vault" },
      { name: "Reports", href: "/reports" },
      { name: "Skills", href: "/skills" },
    ],
  },
  {
    title: "Developers",
    links: [
      { name: "Documentation", href: "https://github.com/abdullahdevrangga11/atma" },
      { name: "Architecture", href: "https://github.com/abdullahdevrangga11/atma#architecture" },
      { name: "Risk Model", href: "https://github.com/abdullahdevrangga11/atma/blob/main/RISK_MODEL.md" },
      { name: "Block Explorer", href: "https://sepolia.mantlescan.xyz" },
    ],
  },
  {
    title: "Ecosystem",
    links: [
      { name: "Mantle", href: "https://www.mantle.xyz" },
      { name: "Ondo USDY", href: "https://ondo.finance" },
      { name: "Aave V3", href: "https://aave.com" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Hackathon", href: "https://dorahacks.io/hackathon/mantleturingtesthackathon2026" },
      { name: "Build Log", href: "https://github.com/abdullahdevrangga11/atma/blob/main/progress.md" },
      { name: "Brand", href: "/about" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[var(--color-bg)] border-t border-[var(--color-border)]">
      <div className="container-atma pt-16 pb-12">
        <div className="grid md:grid-cols-12 gap-12 mb-16">
          <div className="md:col-span-4">
            <div className="flex items-center gap-2 mb-6">
              <span className="block w-6 h-6 rounded-[3px] bg-[var(--color-primary)]" aria-hidden />
              <span className="text-[15px] font-medium">ATMA</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="block w-2 h-2 rounded-full bg-[var(--color-success)] pulse-soft" />
              <span className="text-[13px] text-[var(--color-text-secondary)]">All Systems Operational</span>
            </div>
            <p className="text-[14px] text-[var(--color-text-secondary)] leading-relaxed mb-6 max-w-[280px]">
              Build the future of treasury on Mantle.
            </p>
            <div className="flex items-center gap-3">
              <SocialIcon href="https://x.com/" label="X" path="M2 2l8 8M10 2l-8 8" />
              <SocialIcon href="https://github.com/abdullahdevrangga11/atma" label="GitHub" path="M6 2a4 4 0 0 0-1.3 7.8C4.9 9.9 5 9.7 5 9.6V8.5c-1.1.2-1.4-.5-1.4-.5-.2-.5-.5-.6-.5-.6-.4-.3 0-.3 0-.3.4 0 .6.4.6.4.4.7 1 .5 1.3.4 0-.3.2-.5.3-.6-.9-.1-1.8-.4-1.8-2 0-.4.2-.8.4-1-.1-.1-.2-.5 0-1.1 0 0 .4-.1 1.2.4.4-.1.7-.2 1.1-.2.4 0 .7 0 1.1.2.8-.5 1.2-.4 1.2-.4.2.6.1 1 0 1.1.3.2.4.6.4 1 0 1.6-.9 1.9-1.8 2 .1.1.3.4.3.8v1.2c0 .1 0 .3.3.2A4 4 0 0 0 6 2z" />
              <SocialIcon href="#" label="Discord" path="M3 4.5C3.5 3.5 5 3 6 3l.5 1c-1 .2-1.5.5-2 1m6-1c-.5-1 .5-1 2-1.5-.3 1-.6.8-1 1m-3 7s-1 1-2 1-1.5-.5-1.5-.5m4 0s1 1 2 1 1.5-.5 1.5-.5M3 9c.5 1 2.5 1.5 4.5 1.5S11.5 10 12 9M5 7v.5M9 7v.5" />
              <SocialIcon href="mailto:abdullahdevrangga@gmail.com" label="Email" path="M2 3h10v8H2zM2 3l5 4 5-4" />
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <p className="text-[13px] font-medium mb-4">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.name}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                    >
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-8 border-t border-[var(--color-border)]">
          <p className="text-[12px] text-[var(--color-text-muted)]">
            © 2026 ATMA. Built by Devrangga Hazza Mahiswara · UGM SE '23 · Yogyakarta 🇮🇩
          </p>
          <div className="flex items-center gap-4 text-[12px] text-[var(--color-text-muted)]">
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--color-text)] transition-colors">Privacy Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, label, path }: { href: string; label: string; path: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="w-8 h-8 rounded-full border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:border-[var(--color-text)] hover:text-[var(--color-text)] transition-colors"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d={path} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </a>
  );
}
