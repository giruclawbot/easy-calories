const GOAL_KEY = 'ec_calorie_goal'
export const DEFAULT_GOAL = 2000

// localStorage cache — used when offline or before Firestore loads
export function getCachedGoal(): number {
  /* istanbul ignore next */
  if (typeof window === 'undefined') return DEFAULT_GOAL
  const stored = localStorage.getItem(GOAL_KEY)
  return stored ? parseInt(stored, 10) || DEFAULT_GOAL : DEFAULT_GOAL
}

export function setCachedGoal(goal: number): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(GOAL_KEY, goal.toString())
}

// Keep backward-compat exports
export const getStoredGoal = getCachedGoal
export const setStoredGoal = setCachedGoal
