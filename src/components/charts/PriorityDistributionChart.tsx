"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface PriorityDistributionChartProps {
  data: {
    name: string
    value: number
    color: string
  }[]
}

// Custom tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-900">{payload[0].payload.name}</p>
        <p className="text-sm text-gray-600">
          Count: <span className="font-semibold">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

// Custom label on top of bars
const CustomLabel = (props: any) => {
  const { x, y, width, value } = props
  if (value === 0) return null
  
  return (
    <text
      x={x + width / 2}
      y={y - 5}
      fill="#666"
      textAnchor="middle"
      className="text-xs font-semibold"
    >
      {value}
    </text>
  )
}

export default function PriorityDistributionChart({ data }: PriorityDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        <p>No data available</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))
  const yAxisDomain = [0, Math.ceil(maxValue * 1.2)] // Add 20% padding

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="name"
          stroke="#666"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          stroke="#666"
          domain={yAxisDomain}
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="value"
          radius={[4, 4, 0, 0]}
          label={<CustomLabel />}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

