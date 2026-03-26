"use client"

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface BarDataSet {
  dataKey: string
  name: string
  color: string
}

interface BarChartProps {
  data: Record<string, unknown>[]
  dataSets: BarDataSet[]
  xAxisKey: string
  height?: number
}

export function BarChartComponent({
  data,
  dataSets,
  xAxisKey,
  height = 300,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
          <Bar
            key={ds.dataKey}
            dataKey={ds.dataKey}
            name={ds.name}
            fill={ds.color}
            radius={[2, 2, 0, 0]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  )
}
