export interface WeekData {
  weekNumber: number
  startDate: Date
  endDate: Date
  period: string
  meta: number
  faturamento: number
  trafego: number
  isFuture: boolean
}

export interface MonthData {
  year: number
  month: number
  weeks: WeekData[]
  totalMeta: number
  totalFaturamento: number
  totalTrafego: number
  percentAtingido: number
}

export interface WeekRange {
  start: Date
  end: Date
}

/**
 * Calcula as semanas de um mês seguindo a lógica:
 * - Semana 1 começa sempre no dia 1 do mês
 * - Uma nova semana começa todo domingo
 * - A semana vai até o sábado seguinte ou até o último dia do mês
 */
export function calculateWeeks(date: Date): WeekRange[] {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const weeks: WeekRange[] = []
  let currentStart = firstDay
  
  while (currentStart <= lastDay) {
    // Encontrar o próximo sábado ou o último dia do mês
    let currentEnd = new Date(currentStart)
    currentEnd.setDate(currentEnd.getDate() + (6 - currentEnd.getDay())) // Próximo sábado
    
    // Se o sábado for além do último dia do mês, usar o último dia
    if (currentEnd > lastDay) {
      currentEnd = lastDay
    }
    
    weeks.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    })
    
    // Próxima semana começa no domingo seguinte
    const nextSunday = new Date(currentEnd)
    nextSunday.setDate(nextSunday.getDate() + 1) // Domingo
    
    if (nextSunday > lastDay) {
      break
    }
    
    currentStart = nextSunday
  }
  
  return weeks
}

/**
 * Formata valor monetário em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

/**
 * Formata percentual
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}
