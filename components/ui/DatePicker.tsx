"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DateRange } from "@/types/date"

interface DatePickerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  placeholder?: string
  align?: "left" | "right"
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
]

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"]

const PRESETS = [
  { label: "Hoje", getValue: () => ({ start: new Date(), end: new Date() }) },
  { label: "Ontem", getValue: () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return { start: yesterday, end: yesterday }
  }},
  { label: "Últimos 7 dias", getValue: () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 6)
    return { start, end }
  }},
  { label: "Últimos 30 dias", getValue: () => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 29)
    return { start, end }
  }},
  { label: "Este mês", getValue: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start, end }
  }},
  { label: "Mês passado", getValue: () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { start, end }
  }},
]

export function DatePicker({ value, onChange, placeholder = "Selecione o período", align = "left" }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedRange, setSelectedRange] = useState<DateRange | null>(value || null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] = useState(value?.start || new Date())
  const [selectingStart, setSelectingStart] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sincronizar selectedRange com value das props
  useEffect(() => {
    if (value) {
      setSelectedRange(value)
      // Atualizar currentMonth para o mês da data inicial selecionada
      setCurrentMonth(value.start)
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
  }

  const getDisplayText = () => {
    if (!selectedRange?.start) return placeholder
    
    if (!selectedRange.end) {
      return `A partir de ${formatDate(selectedRange.start)}`
    }
    
    if (selectedRange.start.toDateString() === selectedRange.end.toDateString()) {
      return formatDate(selectedRange.start)
    }
    
    return `${formatDate(selectedRange.start)} → ${formatDate(selectedRange.end)}`
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      setSelectedRange({ start: date, end: date })
      setSelectingStart(false)
    } else {
      if (selectedRange && date < selectedRange.start) {
        setSelectedRange({ start: date, end: selectedRange.start })
      } else {
        setSelectedRange({ start: selectedRange!.start, end: date })
      }
      setSelectingStart(true)
      if (onChange && selectedRange) {
        onChange({ start: selectedRange.start, end: date })
      }
      setIsOpen(false)
    }
  }

  const handlePresetClick = (preset: typeof PRESETS[0]) => {
    const range = preset.getValue()
    setSelectedRange(range)
    if (onChange) {
      onChange(range)
    }
    setIsOpen(false)
  }

  const isDateInRange = (date: Date) => {
    if (!selectedRange) return false
    const compareDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const start = new Date(selectedRange.start.getFullYear(), selectedRange.start.getMonth(), selectedRange.start.getDate())
    const end = new Date(selectedRange.end.getFullYear(), selectedRange.end.getMonth(), selectedRange.end.getDate())
    return compareDate >= start && compareDate <= end
  }

  const isDateStart = (date: Date) => {
    if (!selectedRange) return false
    return date.toDateString() === selectedRange.start.toDateString()
  }

  const isDateEnd = (date: Date) => {
    if (!selectedRange) return false
    return date.toDateString() === selectedRange.end.toDateString()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const renderCalendar = (monthOffset: number = 0) => {
    const displayMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + monthOffset)
    const days = getDaysInMonth(displayMonth)

    return (
      <div className="flex-1">
        <div className="text-center font-semibold text-shogun-text-primary mb-2 text-sm font-[var(--font-display)]">
          {MONTHS[displayMonth.getMonth()]} {displayMonth.getFullYear()}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map((day, i) => (
            <div key={i} className="text-center text-xs text-shogun-text-muted font-medium font-[var(--font-display)]">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, i) => {
            if (!date) {
              return <div key={i} className="aspect-square" />
            }

            const inRange = isDateInRange(date)
            const isStart = isDateStart(date)
            const isEnd = isDateEnd(date)
            const today = isToday(date)

            return (
              <button
                key={i}
                onClick={() => handleDateClick(date)}
                onMouseEnter={() => setHoverDate(date)}
                className={cn(
                  "aspect-square rounded text-xs transition-colors relative font-[var(--font-display)]",
                  inRange && "bg-shogun-accent/20",
                  (isStart || isEnd) && "bg-shogun-accent text-shogun-bg-base font-semibold",
                  !inRange && !isStart && !isEnd && "hover:bg-shogun-bg-elevated text-shogun-text-primary",
                  today && !isStart && !isEnd && "border border-shogun-accent"
                )}
              >
                {date.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-shogun-bg-elevated border border-shogun-border rounded-lg text-sm font-[var(--font-display)] text-shogun-text-primary hover:border-shogun-accent hover:text-shogun-accent transition-colors"
      >
        <Calendar size={16} className="text-shogun-text-secondary" />
        <span>{getDisplayText()}</span>
        <ChevronRight size={16} className="text-shogun-text-secondary" />
      </button>

      {isOpen && (
        <>
          {/* Desktop - layout otimizado */}
          <div className={cn(
            "hidden md:block absolute top-full mt-2 bg-shogun-bg-base border border-shogun-border rounded-lg shadow-lg z-[100] p-4",
            align === "right" ? "right-0" : "left-0"
          )}>
            <div className="flex gap-4 w-[640px]">
              {/* Presets sidebar */}
              <div className="w-36 border-r border-shogun-border pr-4 flex-shrink-0">
                <div className="space-y-1">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset)}
                      className="w-full text-left px-3 py-2 rounded text-sm font-[var(--font-display)] text-shogun-text-secondary hover:bg-shogun-bg-elevated hover:text-shogun-text-primary transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Calendars */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-shogun-bg-elevated rounded transition-colors"
                  >
                    <ChevronLeft size={16} className="text-shogun-text-secondary" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-shogun-bg-elevated rounded transition-colors"
                  >
                    <ChevronRight size={16} className="text-shogun-text-secondary" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {renderCalendar(0)}
                  {renderCalendar(1)}
                </div>

                {selectedRange && (
                  <div className="mt-4 pt-4 border-t border-shogun-border text-center text-sm text-shogun-text-secondary font-[var(--font-display)]">
                    {formatDate(selectedRange.start)} → {formatDate(selectedRange.end)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile - responsive layout */}
          <div className={cn(
            "md:hidden absolute top-full mt-2 bg-shogun-bg-base border border-shogun-border rounded-lg shadow-lg z-[100] p-3 w-[calc(100vw-32px)] max-w-[320px]",
            align === "left" ? "left-0" : "right-0"
          )}>
            <div className="flex flex-col gap-3">
              {/* Presets - horizontal scroll */}
              <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => handlePresetClick(preset)}
                    className="flex-shrink-0 px-3 py-1.5 rounded text-xs font-[var(--font-display)] text-shogun-text-secondary hover:bg-shogun-bg-elevated hover:text-shogun-text-primary transition-colors whitespace-nowrap border border-shogun-border"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={prevMonth}
                    className="p-1 hover:bg-shogun-bg-elevated rounded transition-colors"
                  >
                    <ChevronLeft size={16} className="text-shogun-text-secondary" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1 hover:bg-shogun-bg-elevated rounded transition-colors"
                  >
                    <ChevronRight size={16} className="text-shogun-text-secondary" />
                  </button>
                </div>

                {/* Single calendar on mobile */}
                {renderCalendar(0)}

                {selectedRange && (
                  <div className="mt-3 pt-3 border-t border-shogun-border text-center text-xs text-shogun-text-secondary font-[var(--font-display)]">
                    {formatDate(selectedRange.start)} → {formatDate(selectedRange.end)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
