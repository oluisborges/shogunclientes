export const formatBRL = (value: number): string =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)

export const formatPercent = (value: number, decimals = 2): string =>
  `${value.toFixed(decimals)}%`

export const formatMultiplier = (value: number): string =>
  `${value.toFixed(1)}×`

export const formatNumber = (value: number): string =>
  new Intl.NumberFormat("pt-BR").format(value)

export const formatCompact = (value: number): string => {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`
  return formatBRL(value)
}
