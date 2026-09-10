import JXG from 'jsxgraph'
import { useEffect, useId, useRef, useState } from 'react'
import { InlineMath } from 'react-katex'
import { useTheme } from '../hooks/useTheme'
import { niceScale } from '../lib/niceScale'

export interface TrajectoryPoint {
  t: number
  x: number
}

const PALETTE = {
  light: {
    grid: '#e5e5e5',
    axis: '#737373',
    surface: '#ffffff',
    border: '#e5e5e5',
  },
  dark: {
    grid: '#262626',
    axis: '#a3a3a3',
    surface: '#171717',
    border: '#404040',
  },
} as const

// Which physical quantity a chart plots, not a literal color — each is a
// distinct hue so the sequence of charts under a calculator (position,
// velocity, acceleration) is visually distinguishable at a glance.
const LINE_COLORS = {
  blue: { light: '#0284c7', dark: '#38bdf8' },
  green: { light: '#16a34a', dark: '#4ade80' },
  red: { light: '#dc2626', dark: '#f87171' },
} as const

type ChartColor = keyof typeof LINE_COLORS

interface FunctionChartProps {
  /** The function to plot, in absolute time. Sampled by JSXGraph itself, so it stays exact at any zoom level. */
  fn: (t: number) => number
  /** The physically meaningful time interval the movement actually spans. */
  domain: [number, number]
  /** Points to mark with a dot and a dashed projection to each axis. */
  markers?: TrajectoryPoint[]
  /** Which hue plots the curve — semantic per quantity, not a literal color (defaults to "blue"). */
  color?: ChartColor
  /** LaTeX for the y-axis title (defaults to "x (m)"). */
  yLabel?: string
  /** LaTeX for the x-axis title (defaults to "t (s)"). */
  xLabel?: string
  /** Plain-text series name shown while hovering (defaults to "Posición"). */
  valueLabel?: string
  /** Plain-text unit appended to the hovered value (defaults to "m"). */
  valueUnit?: string
}

interface HoverState {
  t: number
  value: number
  left: number
  top: number
}

export default function FunctionChart({
  fn,
  domain,
  markers = [],
  color = 'blue',
  yLabel = 'x\\ (\\text{m})',
  xLabel = 't\\ (\\text{s})',
  valueLabel = 'Posición',
  valueUnit = 'm',
}: FunctionChartProps) {
  const { theme } = useTheme()
  const colors = PALETTE[theme]
  const lineColor = LINE_COLORS[color][theme]
  const boardId = `chart-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [hover, setHover] = useState<HoverState | null>(null)

  const fnRef = useRef(fn)
  fnRef.current = fn

  const [t0, tf] = domain

  // The board is imperative, so it's rebuilt only when the plotted data really
  // changes — not on every render. Sampling the function at a few fixed points
  // detects a changed function without depending on the closure's identity,
  // which would otherwise rebuild (and reset the user's pan/zoom) constantly.
  const shapeKey = [0, 0.25, 0.5, 0.75, 1].map((f) => fn(t0 + (tf - t0) * f)).join(',')
  const dataKey = `${t0}|${tf}|${shapeKey}|${JSON.stringify(markers)}|${theme}|${color}`

  useEffect(() => {
    const curveSamples: number[] = []
    for (let i = 0; i <= 64; i++) {
      curveSamples.push(fnRef.current(t0 + ((tf - t0) * i) / 64))
    }
    const yValues = [...curveSamples, ...markers.map((p) => p.x)].filter(Number.isFinite)
    const tValues = [t0, tf, ...markers.map((p) => p.t)].filter(Number.isFinite)

    const tScale = niceScale(Math.min(...tValues), Math.max(...tValues))
    const yScale = niceScale(Math.min(...yValues), Math.max(...yValues))
    const tRange = tScale.max - tScale.min
    const yRange = yScale.max - yScale.min

    // The axes are inset from the board edges, so the window is padded a little
    // past the plotted area to keep the curve clear of them.
    let left = tScale.min - tRange * 0.1
    let right = tScale.max + tRange * 0.04
    let top = yScale.max + yRange * 0.06
    let bottom = yScale.min - yRange * 0.12

    // Square grid cells: one tick step spans the same number of pixels on both
    // axes. A literal 1:1 ratio between the raw values can't work — the axes
    // carry different units (seconds against metres), and matching them would
    // squash the curve into a vertical sliver. The window is only ever grown,
    // symmetrically, so squaring the cells never crops the plotted data.
    const container = document.getElementById(boardId)
    const width = container?.clientWidth ?? 1
    const height = container?.clientHeight ?? 1
    const targetRatio = (width * tScale.step) / (height * yScale.step)
    if ((right - left) / (top - bottom) < targetRatio) {
      const grow = (targetRatio * (top - bottom) - (right - left)) / 2
      left -= grow
      right += grow
    } else {
      const grow = ((right - left) / targetRatio - (top - bottom)) / 2
      top += grow
      bottom -= grow
    }

    const board = JXG.JSXGraph.initBoard(boardId, {
      boundingbox: [left, top, right, bottom],
      keepAspectRatio: false,
      axis: false,
      grid: false,
      showCopyright: false,
      showNavigation: false,
      showInfobox: false,
      pan: { enabled: true, needShift: false, needTwoFingers: false },
      // Wheel zoom stays behind Shift so scrolling the page over a chart still scrolls the page.
      zoom: { wheel: true, needShift: true, min: 0.1, max: 50 },
    })

    // JSXGraph writes its own inline styles onto the container when a board is
    // created, which clobbers React's background when the theme is toggled
    // while a board already exists.
    board.containerObj.style.backgroundColor = colors.surface

    board.suspendUpdate()

    // The axes hug the left/bottom edges of the *current* view rather than the
    // origin, so they read as a plot (no crossing axes, no arrowheads) and stay
    // on screen while the user pans or zooms. JSXGraph's own position:'fixed'
    // anchoring does the same thing but hides its tick labels, hence the
    // function-valued coordinates instead. The inset leaves room for the labels.
    const view = () => board.getBoundingBox()
    const axisX = () => view()[0] + (44 * (view()[2] - view()[0])) / board.canvasWidth
    const axisY = () => view()[3] + (26 * (view()[1] - view()[3])) / board.canvasHeight

    const axisAttributes = (isHorizontal: boolean) => ({
      straightFirst: false,
      straightLast: false,
      firstArrow: false,
      lastArrow: false,
      strokeColor: colors.axis,
      strokeWidth: 1,
      highlight: false,
      layer: 4,
      ticks: {
        // Fixed spacing straight from niceScale: letting JSXGraph insert its own
        // ticks subdivides the step and crowds the axis.
        ticksDistance: isHorizontal ? tScale.step : yScale.step,
        insertTicks: false,
        minorTicks: 0,
        drawZero: true,
        includeBoundaries: true,
        majorHeight: 6,
        strokeColor: colors.axis,
        strokeWidth: 1,
        highlight: false,
        label: {
          fontSize: 12,
          strokeColor: colors.axis,
          cssStyle: 'font-family: inherit',
          highlight: false,
          ...(isHorizontal
            ? { offset: [0, -10], anchorX: 'middle', anchorY: 'top' }
            : { offset: [-10, 0], anchorX: 'right', anchorY: 'middle' }),
        },
      },
    })

    const xAxis = board.create(
      'axis',
      [
        [axisX, axisY],
        [() => view()[2], axisY],
      ],
      axisAttributes(true),
    )
    const yAxis = board.create(
      'axis',
      [
        [axisX, axisY],
        [axisX, () => view()[1]],
      ],
      axisAttributes(false),
    )

    // Grid tied to those axes, so its lines always line up with the tick labels.
    board.create('grid', [xAxis, yAxis], {
      strokeColor: colors.grid,
      strokeWidth: 1,
      strokeOpacity: 1,
      minorElements: 0,
      layer: 2,
    })

    // Every marker gets dashed projections to both axes, whether or not it lands
    // on a grid line, so the start and end of the movement are always readable.
    const projectionAttributes = {
      strokeColor: colors.axis,
      strokeWidth: 1,
      dash: 2,
      fixed: true,
      highlight: false,
      layer: 5,
    }
    // Endpoints are functions of the current view so each projection keeps
    // reaching its axis after the user pans or zooms. Function-valued points are
    // also non-draggable, unlike points built from literal coordinates.
    for (const point of markers) {
      board.create(
        'segment',
        [
          [() => point.t, () => board.getBoundingBox()[3]],
          [() => point.t, () => point.x],
        ],
        projectionAttributes,
      )
      board.create(
        'segment',
        [
          [() => board.getBoundingBox()[0], () => point.x],
          [() => point.t, () => point.x],
        ],
        projectionAttributes,
      )
    }

    board.create('functiongraph', [(t: number) => fnRef.current(t), t0, tf], {
      strokeColor: lineColor,
      strokeWidth: 2,
      fixed: true,
      highlight: false,
      layer: 6,
    })

    for (const point of markers) {
      board.create('point', [point.t, point.x], {
        face: 'o',
        size: 3,
        fillColor: lineColor,
        strokeColor: colors.surface,
        strokeWidth: 2,
        fixed: true,
        highlight: false,
        withLabel: false,
        showInfobox: false,
        layer: 7,
      })
    }

    const cursor = board.create('point', [t0, fnRef.current(t0)], {
      face: 'o',
      size: 3,
      fillColor: lineColor,
      strokeColor: colors.surface,
      strokeWidth: 2,
      fixed: true,
      highlight: false,
      withLabel: false,
      showInfobox: false,
      visible: false,
      layer: 8,
    })

    board.unsuspendUpdate()

    const handleMove = (event: PointerEvent) => {
      const [t] = board.getUsrCoordsOfMouse(event)
      const lo = Math.min(t0, tf)
      const hi = Math.max(t0, tf)
      if (t < lo || t > hi) {
        cursor.setAttribute({ visible: false })
        setHover(null)
        return
      }
      const value = fnRef.current(t)
      if (!Number.isFinite(value)) return
      cursor.setPosition(JXG.COORDS_BY_USER, [t, value])
      cursor.setAttribute({ visible: true })
      board.update()
      setHover({ t, value, left: event.offsetX, top: event.offsetY })
    }

    board.on('move', handleMove)

    return () => {
      board.off('move', handleMove)
      JXG.JSXGraph.freeBoard(board)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, boardId])

  const handleLeave = () => setHover(null)

  return (
    <div className="w-full">
      {/* Y-axis title: plain, non-rotated, sitting right above the axis, rendered as HTML so it can go through KaTeX. */}
      <div className="pl-6 text-xs" style={{ color: colors.axis }}>
        <InlineMath math={yLabel} />
      </div>

      <div className="relative">
        <div
          id={boardId}
          className="function-chart-board relative h-60 w-full touch-none overflow-hidden rounded-md"
          onMouseLeave={handleLeave}
          style={{ background: colors.surface }}
        />
        {hover && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border px-2 py-1 text-xs whitespace-nowrap"
            style={{
              background: colors.surface,
              borderColor: colors.border,
              left: hover.left + 12,
              top: hover.top + 12,
            }}
          >
            <div style={{ color: colors.axis }}>{`t = ${hover.t.toFixed(2)} s`}</div>
            <div className="font-medium">{`${valueLabel}: ${hover.value.toFixed(2)} ${valueUnit}`}</div>
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between pr-4 text-xs" style={{ color: colors.axis }}>
        <span className="text-[11px]">Arrastrá para desplazar · Shift + rueda para hacer zoom</span>
        <InlineMath math={xLabel} />
      </div>
    </div>
  )
}
