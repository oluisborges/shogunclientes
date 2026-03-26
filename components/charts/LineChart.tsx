"use client"

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"

interface DataSet {
  dataKey: string
  name: string
  color: string
  strokeDasharray?: string
}

interface LineChartProps {
  data: Record<string, unknown>[]
  dataSets: DataSet[]
  xAxisKey: string
  referenceLine?: { y: number; label: string; color: string }
  height?: number
}

export function LineChartComponent({
  data,
  dataSets,
  xAxisKey,
  referenceLine,
  height = 300,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A5444" />
        <XAxis
          dataKey={xAxisKey}
          stroke="#808080"
          tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
        />
        <YAxis
          stroke="#808080"
          tick={{ fontSize: 11, fontFamily: "var(--font-data)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1A3A31",
            border: "1px solid #2A5444",
            borderRadius: "6px",
            fontFamily: "var(--font-data)",
            fontSize: "12px",
            color: "#E8F0EB",
          }}
        />
        <Legend
          wrapperStyle={{
            fontFamily: "var(--font-display)",
            fontSize: "11px",
            color: "#808080",
          }}
        />
        {dataSets.map((ds) => (
          <Line
            key={ds.dataKey}
            type="monotone"
            dataKey={ds.dataKey}
            name={ds.name}
            stroke={ds.color}
            strokeWidth={2}
            strokeDasharray={ds.strokeDasharray}
            dot={false}
            activeDot={{ r: 4, fill: ds.color }}
          />
        ))}
        {referenceLine && (
          <ReferenceLine
            y={referenceLine.y}
            label={{
              value: referenceLine.label,
              position: "right",
              fill: referenceLine.color,
              fontSize: 11,
              fontFamily: "var(--font-data)",
            }}
            stroke={referenceLine.color}
            strokeDasharray="5 5"
          />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}
