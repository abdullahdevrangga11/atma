export function formatUSD(amount: bigint | number, decimals: number = 2): string {
  const value = typeof amount === "bigint" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(bps: number, decimals: number = 2): string {
  return (bps / 100).toFixed(decimals) + "%";
}

export function formatBps(bps: number): string {
  return `${bps > 0 ? "+" : ""}${bps} bps`;
}

export function shortenAddress(addr: string, chars: number = 6): string {
  if (!addr || addr.length < chars * 2 + 2) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-4)}`;
}

export function formatLargeNumber(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toString();
}
