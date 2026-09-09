import { InlineMath } from 'react-katex'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useTheme } from '../hooks/useTheme'
import { isOnScale, niceScale } from '../lib/niceScale'

export interface TrajectoryPoint {
  t: number
  x: number
}

const PALETTE = {
  light: {
    line: '#0284c7',
    grid: '#e5e5e5',
    axis: '#737373',
    surface: '#ffffff',
    border: '#e5e5e5',
  },
  dark: {
    line: '#38bdf8',
    grid: '#262626',
    axis: '#a3a3a3',
    surface: '#171717',
    border: '#404040',
  },
} as const

interface PositionTimeChartProps {
  data: TrajectoryPoint[]
  /** LaTeX for the y-axis title (defaults to "x (m)"). */
  yLabel?: string
  /** LaTeX for the x-axis title (defaults to "t (s)"). */
  xLabel?: string
}

export default function PositionTimeChart({
  data,
  yLabel = 'x\\ (\\text{m})',
  xLabel = 't\\ (\\text{s})',
}: PositionTimeChartProps) {
  const { theme } = useTheme()
  const colors = PALETTE[theme]

  const tScale = niceScale(
    Math.min(...data.map((p) => p.t)),
    Math.max(...data.map((p) => p.t)),
  )
  const xScale = niceScale(
    Math.min(...data.map((p) => p.x)),
    Math.max(...data.map((p) => p.x)),
  )

  // Points that don't land on a grid line get dashed projection lines to each
  // axis instead of a stray, unevenly-spaced tick — the exact value is still
  // readable from the tooltip on hover.
  const projections = data.flatMap((point, index) => {
    const lines = []
    if (!isOnScale(point.t, tScale)) {
      lines.push(
        <ReferenceLine
          key={`v-${index}`}
          segment={[
            { x: point.t, y: xScale.min },
            { x: point.t, y: point.x },
          ]}
          stroke={colors.axis}
          strokeDasharray="4 4"
          strokeWidth={1}
          ifOverflow="visible"
        />,
      )
    }
    if (!isOnScale(point.x, xScale)) {
      lines.push(
        <ReferenceLine
          key={`h-${index}`}
          segment={[
            { x: tScale.min, y: point.x },
            { x: point.t, y: point.x },
          ]}
          stroke={colors.axis}
          strokeDasharray="4 4"
          strokeWidth={1}
          ifOverflow="visible"
        />,
      )
    }
    return lines
  })

  return (
    <div className="w-full">
      {/* Y-axis title: plain, non-rotated, sitting right above the axis (not Recharts' SVG label, so it can render via KaTeX). */}
      <div className="pl-16 text-xs" style={{ color: colors.axis }}>
        <InlineMath math={yLabel} />
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid stroke={colors.grid} strokeWidth={1} />
            <XAxis
              dataKey="t"
              type="number"
              domain={[tScale.min, tScale.max]}
              ticks={tScale.ticks}
              stroke={colors.grid}
              tick={{ fill: colors.axis, fontSize: 12 }}
              tickLine={{ stroke: colors.grid }}
            />
            <YAxis
              dataKey="x"
              width={64}
              domain={[xScale.min, xScale.max]}
              ticks={xScale.ticks}
              stroke={colors.grid}
              tick={{ fill: colors.axis, fontSize: 12 }}
              tickLine={{ stroke: colors.grid }}
            />
            <Tooltip
              cursor={{ stroke: colors.axis, strokeWidth: 1 }}
              contentStyle={{
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: 8,
                fontSize: 12,
              }}
              labelFormatter={(label) => `t = ${label} s`}
              formatter={(value) => [`${value} m`, 'Posición']}
            />
            {projections}
            <Line
              type="linear"
              dataKey="x"
              stroke={colors.line}
              strokeWidth={2}
              dot={{ r: 4, fill: colors.line, stroke: colors.surface, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* X-axis title, right-aligned under the axis. */}
      <div className="pr-4 text-right text-xs" style={{ color: colors.axis }}>
        <InlineMath math={xLabel} />
      </div>
    </div>
  )
}
