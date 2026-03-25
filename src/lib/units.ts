export type UnitSystem = 'metric' | 'imperial'

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 100) / 100
}

export function cmToFtIn(cm: number): { ft: number; inches: number } {
  const totalInches = cm / 2.54
  const ft = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return { ft, inches }
}

export function ftInToCm(ft: number, inches: number): number {
  return Math.round(ft * 30.48 + inches * 2.54)
}

export function formatWeight(kg: number, system: UnitSystem): string {
  if (system === 'imperial') {
    return `${kgToLbs(kg)} lbs`
  }
  return `${kg} kg`
}

export function formatHeight(cm: number, system: UnitSystem): string {
  if (system === 'imperial') {
    const { ft, inches } = cmToFtIn(cm)
    return `${ft}'${inches}"`
  }
  return `${cm} cm`
}
