"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"

interface CircularProgressProps {
  value: number
  max: number
  size?: number
  label?: string
}

export function CircularProgress({
  value,
  max,
  size = 120,
  label,
}: CircularProgressProps) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const data = [
    { name: "filled", value: percent },
    { name: "empty", value: 100 - percent },
  ]

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={size * 0.35}
            outerRadius={size * 0.45}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill="#95D600" />
            <Cell fill="#1F4438" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[var(--font-data)] text-lg font-bold text-shogun-accent">
          {Math.round(percent)}%
        </span>
        {label && (
          <span className="text-shogun-text-muted text-[9px] font-[var(--font-display)] uppercase">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}
