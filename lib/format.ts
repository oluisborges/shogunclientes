export function fmtBRLFull(n: number) {
  return `R$ ${Math.round(n).toLocaleString("pt-BR")}`
}

export function fmtBRLCents(n: number) {
  return `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toFixed(0)
}

export function fmtPct(n: number) {
  return `${n.toFixed(2)}%`
}

export function calcDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return ((curr - prev) / prev) * 100
}
