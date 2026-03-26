export const formatDateBR = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

export const formatDateShort = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  })
}

export const getWeekOfMonth = (date: Date): number => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1)
  const dayOfMonth = date.getDate()
  const firstDayOfWeek = firstDay.getDay()
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7)
}

export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate()
}

export const getDayOfMonth = (): number => {
  return new Date().getDate()
}

export const getDaysElapsedInMonth = (): number => {
  return new Date().getDate()
}

export const getDaysRemainingInMonth = (): number => {
  const now = new Date()
  const totalDays = getDaysInMonth(now.getFullYear(), now.getMonth() + 1)
  return totalDays - now.getDate()
}

export const getMonthName = (month: number): string => {
  const date = new Date(2024, month - 1, 1)
  return date.toLocaleDateString("pt-BR", { month: "long" })
}

export const getWeekRef = (date: Date): string => {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const diff = date.getTime() - startOfYear.getTime()
  const weekNumber = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${year}-W${String(weekNumber).padStart(2, "0")}`
}
