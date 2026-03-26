"use client"

import { useState, useEffect, useRef } from "react"
import { Calendar, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateRangePicker } from "./DateRangePicker"
import type { DateRange } from "@/types/date"

interface DateSpeakerProps {
  value?: DateRange
  onChange?: (range: DateRange) => void
  placeholder?: string
}

export function DateSpeaker({ value, onChange, placeholder = "Selecione o período" }: DateSpeakerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  const getDisplayText = () => {
    if (!value?.start) return placeholder
    
    if (!value.end) {
      return `A partir de ${formatDate(value.start)}`
    }
    
    if (value.start.toDateString() === value.end.toDateString()) {
      return formatDate(value.start)
    }
    
    return `${formatDate(value.start)} → ${formatDate(value.end)}`
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg border font-[var(--font-display)] font-medium text-sm transition-all",
          "bg-shogun-bg-elevated text-shogun-text-secondary border-shogun-border hover:border-shogun-accent hover:text-shogun-accent"
        )}
      >
        <Calendar size={16} />
        <span>{getDisplayText()}</span>
        <ChevronDown size={16} className="ml-auto" />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-shogun-bg-base border border-shogun-border rounded-lg shadow-lg p-4">
          <div className="max-w-[90vw] overflow-x-auto">
            <DateRangePicker
              value={value}
              isOpen={isOpen}
              onChange={(range) => {
                onChange?.(range)
                if (range?.start && range?.end) {
                  setIsOpen(false)
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
