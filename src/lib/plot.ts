export interface PlotPoint {
  t: number
  x: number
}

/**
 * A quantity to plot, given as the actual function of time plus the physical
 * time interval it spans. The plotting library samples `fn` itself, so the
 * curve stays exact at any zoom level instead of being frozen at whatever
 * resolution it was pre-sampled with.
 */
export interface PlotFunction {
  fn: (t: number) => number
  domain: [number, number]
}
