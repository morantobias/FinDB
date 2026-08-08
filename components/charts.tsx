"use client"

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell,
} from "recharts"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1"]

interface ChartProps {
  data: any[]
  className?: string
}

/** Bar chart for comparing metrics across banks. */
export function BankComparisonChart({ data, className }: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-500 py-10">No comparison data available.</div>
  }

  const dataKey = Object.keys(data[0]).find(k => k !== "name" && k !== "bank_name") || "value"

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="name" angle={-35} textAnchor="end" height={80} tick={{ fill: "#94a3b8", fontSize: 11 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
          />
          <Bar dataKey={dataKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Line chart for tracking ratio trends over time. */
export function RatioTrendChart({ data, className }: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-500 py-10">No trend data available.</div>
  }

  const lines = Object.keys(data[0]).filter(k => k !== "period" && k !== "name")

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
          />
          <Legend wrapperStyle={{ color: "#e2e8f0" }} />
          {lines.map((line, i) => (
            <Line key={line} type="monotone" dataKey={line} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Donut chart for balance sheet composition. */
export function CompositionChart({ data, className }: ChartProps) {
  if (!data || data.length === 0) {
    return <div className="text-center text-slate-500 py-10">No composition data available.</div>
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={{ stroke: "#94a3b8" }}
          >
            {data.map((_entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#e2e8f0" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
