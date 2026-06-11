/**
 * Minimal line-based LCS diff. Produces a sequence of diff lines suitable for
 * a side-by-side or unified render. Implemented from scratch (no `diff` lib
 * dependency) — fine for short skill markdown payloads (<2k lines).
 */

export type DiffLine =
  | { kind: "same"; left: number; right: number; text: string }
  | { kind: "add"; right: number; text: string }
  | { kind: "del"; left: number; text: string };

export function diffLines(a: string, b: string): DiffLine[] {
  const A = a.split("\n");
  const B = b.split("\n");
  const m = A.length;
  const n = B.length;

  // LCS table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (A[i] === B[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (A[i] === B[j]) {
      out.push({ kind: "same", left: i + 1, right: j + 1, text: A[i] });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ kind: "del", left: i + 1, text: A[i] });
      i++;
    } else {
      out.push({ kind: "add", right: j + 1, text: B[j] });
      j++;
    }
  }
  while (i < m) out.push({ kind: "del", left: ++i, text: A[i - 1] });
  while (j < n) out.push({ kind: "add", right: ++j, text: B[j - 1] });
  return out;
}

/** Quick summary counts for header chips. */
export function diffStats(lines: DiffLine[]): { added: number; removed: number } {
  let added = 0;
  let removed = 0;
  for (const l of lines) {
    if (l.kind === "add") added++;
    else if (l.kind === "del") removed++;
  }
  return { added, removed };
}
