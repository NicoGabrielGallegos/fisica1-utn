import type { ComponentType } from 'react'
import MruCalculator from '../pages/calculators/cinematica/MruCalculator'
import MruvCalculator from '../pages/calculators/cinematica/MruvCalculator'

export const calculatorComponents: Record<string, ComponentType> = {
  'cinematica/mru': MruCalculator,
  'cinematica/mruv': MruvCalculator,
}

export function calculatorComponentFor(sectionId: string, calculatorId: string): ComponentType | undefined {
  return calculatorComponents[`${sectionId}/${calculatorId}`]
}
