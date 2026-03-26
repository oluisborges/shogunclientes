"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: string
  header: string
  width?: string
  align?: "left" | "right" | "center"
  render: (row: T, index: number) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey: (row: T) => string
  expandedContent?: (row: T) => ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  expandedContent,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead className="sticky top-0 z-10">
          <tr className="bg-shogun-bg-base border-b border-shogun-border">
            {expandedContent && <th className="w-10" />}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "text-label px-4 py-3 font-semibold",
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                      ? "text-center"
                      : "text-left"
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => {
            const key = rowKey(row)
            const isExpanded = expandedRows.has(key)

            return (
              <TableRow
                key={key}
                row={row}
                index={index}
                columns={columns}
                isExpanded={isExpanded}
                hasExpandedContent={!!expandedContent}
                onToggle={() => toggleRow(key)}
                onRowClick={onRowClick}
                expandedContent={expandedContent}
              />
            )
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-shogun-text-muted text-sm font-[var(--font-display)]">
          Nenhum dado encontrado
        </div>
      )}
    </div>
  )
}

function TableRow<T>({
  row,
  index,
  columns,
  isExpanded,
  hasExpandedContent,
  onToggle,
  onRowClick,
  expandedContent,
}: {
  row: T
  index: number
  columns: Column<T>[]
  isExpanded: boolean
  hasExpandedContent: boolean
  onToggle: () => void
  onRowClick?: (row: T) => void
  expandedContent?: (row: T) => ReactNode
}) {
  return (
    <>
      <tr
        className={cn(
          "border-b border-shogun-border/50 transition-colors duration-[120ms]",
          index % 2 === 0 ? "bg-shogun-bg-surface" : "bg-shogun-bg-base",
          "hover:bg-shogun-bg-elevated",
          isExpanded && "border-l-2 border-l-shogun-accent",
          (hasExpandedContent || onRowClick) && "cursor-pointer"
        )}
        onClick={() => {
          if (hasExpandedContent) onToggle()
          if (onRowClick) onRowClick(row)
        }}
      >
        {hasExpandedContent && (
          <td className="px-2 py-3">
            <ChevronDown
              size={16}
              className={cn(
                "text-shogun-text-muted transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
          </td>
        )}
        {columns.map((col) => (
          <td
            key={col.key}
            className={cn(
              "px-4 py-3 text-sm",
              col.align === "right"
                ? "text-right"
                : col.align === "center"
                  ? "text-center"
                  : "text-left"
            )}
          >
            {col.render(row, index)}
          </td>
        ))}
      </tr>
      {hasExpandedContent && isExpanded && (
        <tr>
          <td
            colSpan={columns.length + 1}
            className="p-0"
          >
            <div
              className="overflow-hidden transition-all duration-200 ease-in-out border-t border-b"
              style={{
                borderColor: "rgba(149,214,0,0.20)",
              }}
            >
              <div className="p-6">{expandedContent!(row)}</div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

export function DataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-px">
      <div className="h-10 bg-shogun-bg-base rounded skeleton-pulse" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-14 bg-shogun-bg-elevated rounded skeleton-pulse"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}
