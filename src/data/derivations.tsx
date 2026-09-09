import type { ComponentType } from 'react'
import EcuacionComplementaria from '../pages/formulas/cinematica/EcuacionComplementaria'

export const derivations: Record<string, ComponentType> = {
  'cinematica/ecuacion-complementaria': EcuacionComplementaria,
}

export function derivationFor(sectionId: string, formulaId: string): ComponentType | undefined {
  return derivations[`${sectionId}/${formulaId}`]
}
