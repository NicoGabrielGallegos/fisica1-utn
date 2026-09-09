export interface Formula {
  id: string
  sectionId: string
  name: string
  latex: string
  description: string
  derivationAvailable: boolean
}

export const formulas: Formula[] = [
  {
    id: 'mru-posicion',
    sectionId: 'cinematica',
    name: 'Posición en MRU',
    latex: 'x = x_0 + v \\cdot t',
    description: 'Posición de un móvil que se desplaza con velocidad constante.',
    derivationAvailable: false,
  },
  {
    id: 'mruv-velocidad',
    sectionId: 'cinematica',
    name: 'Velocidad en MRUV',
    latex: 'v = v_0 + a \\cdot t',
    description: 'Velocidad de un móvil que se desplaza con aceleración constante.',
    derivationAvailable: false,
  },
  {
    id: 'mruv-posicion',
    sectionId: 'cinematica',
    name: 'Posición en MRUV',
    latex: 'x = x_0 + v_0 \\cdot t + \\frac{1}{2} a \\cdot t^2',
    description: 'Posición de un móvil que se desplaza con aceleración constante.',
    derivationAvailable: false,
  },
  {
    id: 'ecuacion-complementaria',
    sectionId: 'cinematica',
    name: 'Ecuación complementaria',
    latex: 'v^2 = v_0^2 + 2a (x - x_0)',
    description: 'Relaciona la velocidad final con la posición, sin depender del tiempo.',
    derivationAvailable: true,
  },
  {
    id: 'tiro-oblicuo-x',
    sectionId: 'cinematica',
    name: 'Posición horizontal (tiro oblicuo)',
    latex: 'x = x_0 + v_0 \\cos\\theta \\cdot t',
    description: 'Componente horizontal de la posición en un tiro oblicuo (velocidad horizontal constante).',
    derivationAvailable: false,
  },
  {
    id: 'tiro-oblicuo-y',
    sectionId: 'cinematica',
    name: 'Posición vertical (tiro oblicuo)',
    latex: 'y = y_0 + v_0 \\sin\\theta \\cdot t - \\frac{1}{2} g \\cdot t^2',
    description: 'Componente vertical de la posición en un tiro oblicuo (MRUV bajo la gravedad).',
    derivationAvailable: false,
  },
]

export function formulasForSection(sectionId: string): Formula[] {
  return formulas.filter((formula) => formula.sectionId === sectionId)
}
