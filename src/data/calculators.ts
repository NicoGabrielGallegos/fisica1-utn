export interface Calculator {
  id: string
  sectionId: string
  title: string
  description: string
  available: boolean
  /** ids of formulas (from data/formulas.ts) used by this calculator */
  formulaIds: string[]
}

export const calculators: Calculator[] = [
  {
    id: 'mru',
    sectionId: 'cinematica',
    title: 'MRU',
    description: 'Movimiento Rectilíneo Uniforme: posición, velocidad y tiempo con velocidad constante.',
    available: true,
    formulaIds: ['mru-posicion'],
  },
  {
    id: 'mruv',
    sectionId: 'cinematica',
    title: 'MRUV',
    description: 'Movimiento Rectilíneo Uniformemente Variado: posición, velocidad, aceleración y tiempo.',
    available: false,
    formulaIds: ['mruv-velocidad', 'mruv-posicion', 'ecuacion-complementaria'],
  },
  {
    id: 'tiro-vertical',
    sectionId: 'cinematica',
    title: 'Tiro vertical',
    description: 'Lanzamiento vertical hacia arriba o hacia abajo bajo la acción de la gravedad.',
    available: false,
    formulaIds: ['mruv-velocidad', 'mruv-posicion', 'ecuacion-complementaria'],
  },
  {
    id: 'caida-libre',
    sectionId: 'cinematica',
    title: 'Caída libre',
    description: 'Movimiento de un objeto en caída libre, partiendo del reposo.',
    available: false,
    formulaIds: ['mruv-velocidad', 'mruv-posicion', 'ecuacion-complementaria'],
  },
  {
    id: 'tiro-oblicuo',
    sectionId: 'cinematica',
    title: 'Tiro oblicuo',
    description: 'Movimiento parabólico de un proyectil lanzado con un ángulo respecto a la horizontal.',
    available: false,
    formulaIds: ['tiro-oblicuo-x', 'tiro-oblicuo-y'],
  },
  {
    id: 'encuentro',
    sectionId: 'cinematica',
    title: 'Encuentro',
    description: 'Punto e instante de encuentro entre dos móviles con movimientos propios.',
    available: false,
    formulaIds: ['mru-posicion', 'mruv-posicion'],
  },
]

export function calculatorsForSection(sectionId: string): Calculator[] {
  return calculators.filter((calculator) => calculator.sectionId === sectionId)
}
