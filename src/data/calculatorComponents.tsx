import type { ComponentType } from 'react'
import MruCalculator from '../pages/calculators/cinematica/MruCalculator'

export const calculatorComponents: Record<string, ComponentType> = {
  'cinematica/mru': MruCalculator,
}

export function calculatorComponentFor(sectionId: string, calculatorId: string): ComponentType | undefined {
  return calculatorComponents[`${sectionId}/${calculatorId}`]
}
