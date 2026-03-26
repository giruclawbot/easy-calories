/**
 * Ideal hydration calculator
 *
 * Sources:
 * - National Academies of Medicine (NAM/IOM) Dietary Reference Intakes for Water (2004)
 *   Total adequate intake: 3.7L/day men, 2.7L/day women (all sources including food)
 *   Drinking water alone ~80% of that: ~2950ml men, ~2150ml women
 * - WHO Nutrient Requirements guidelines
 * - Base formula: 35ml × kg bodyweight (clinical standard for hydration needs)
 * - Activity multipliers: based on ACSM exercise science guidelines
 *   (additional 400-600ml per hour of moderate exercise)
 */

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

export interface HydrationInputs {
  weightKg: number
  sex?: 'male' | 'female'
  activity?: ActivityLevel
}

export interface HydrationResult {
  recommendedMl: number        // final rounded recommendation
  baseMl: number               // before activity/sex adjustment
  activityBonusMl: number      // ml added for activity
  sexAdjustmentMl: number      // ml adjusted for sex
  breakdown: string            // human-readable formula explanation
}

// Activity multipliers derived from NAM + ACSM guidelines
const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary:  1.0,   // desk job, no exercise
  light:      1.1,   // light exercise 1-3 days/wk → +~10%
  moderate:   1.2,   // moderate exercise 3-5 days/wk → +~20%
  active:     1.35,  // hard exercise 6-7 days/wk → +~35%
  very_active: 1.5,  // twice/day training or physical job → +~50%
}

// Sex correction: NAM recommends ~2.7L/day for women vs ~3.7L/day for men
// That's ~27% less for women → we apply -10% since base formula (35ml/kg) skews male
const SEX_CORRECTION: Record<string, number> = {
  male:   0,
  female: -0.10,
}

/**
 * Calculate ideal daily water intake in ml.
 *
 * Formula:
 *   base = 35ml × weightKg
 *   adjusted = base × activityMultiplier
 *   sexAdjusted = adjusted × (1 + sexCorrection)
 *   result = round to nearest 50ml, clamp to [1500, 4500]
 */
export function calculateIdealHydration(inputs: HydrationInputs): HydrationResult {
  const { weightKg, sex = 'male', activity = 'sedentary' } = inputs

  const baseMl = 35 * weightKg
  const multiplier = ACTIVITY_MULTIPLIER[activity]
  const activityAdjusted = baseMl * multiplier
  const activityBonusMl = activityAdjusted - baseMl

  const sexCorrection = SEX_CORRECTION[sex] ?? 0
  const sexAdjusted = activityAdjusted * (1 + sexCorrection)
  const sexAdjustmentMl = sexAdjusted - activityAdjusted

  // Round to nearest 50ml, clamp between 1500ml and 4500ml
  const raw = Math.round(sexAdjusted / 50) * 50
  const recommendedMl = Math.max(1500, Math.min(4500, raw))

  const breakdown = `35ml × ${weightKg}kg × ${multiplier}${sexCorrection !== 0 ? ` × ${(1 + sexCorrection).toFixed(2)}` : ''}`

  return {
    recommendedMl,
    baseMl: Math.round(baseMl),
    activityBonusMl: Math.round(activityBonusMl),
    sexAdjustmentMl: Math.round(sexAdjustmentMl),
    breakdown,
  }
}
