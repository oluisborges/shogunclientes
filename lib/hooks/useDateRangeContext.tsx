"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface DateRange {
  start: Date
  end: Date
}

interface DateRangeContextType {
  dateRange: DateRange | null
  setDateRange: (range: DateRange | null) => void
  compareRange: DateRange | null
  setCompareRange: (range: DateRange | null) => void
  compareMode: boolean
  setCompareMode: (mode: boolean) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | null>(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date()
    return { start, end }
  })
  const [compareRange, setCompareRange] = useState<DateRange | null>(null)
  const [compareMode, setCompareMode] = useState(false)

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange,
        compareRange,
        setCompareRange,
        compareMode,
        setCompareMode,
      }}
    >
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRangeContext() {
  const context = useContext(DateRangeContext)
  if (context === undefined) {
    throw new Error("useDateRangeContext must be used within a DateRangeProvider")
  }
  return context
}
