export interface SectionPart {
  id: string
  order: number
  title: string
  description: string
}

export const sections: SectionPart[] = [
  {
    id: 'cinematica',
    order: 1,
    title: 'Cinemática',
    description: 'Movimiento en línea recta. Movimiento en dos dimensiones.',
  },
  {
    id: 'dinamica-y-energia',
    order: 2,
    title: 'Dinámica y energía',
    description: 'Leyes de Newton. Trabajo, energía y potencia. Impulso y cantidad de movimiento.',
  },
  {
    id: 'rotacion',
    order: 3,
    title: 'Rotación',
    description: 'Rotación de cuerpos rígidos. Dinámica del movimiento rotacional.',
  },
  {
    id: 'fluidos-y-periodico',
    order: 4,
    title: 'Fluidos y movimiento periódico',
    description: 'Mecánica de fluidos. Movimiento periódico.',
  },
]
