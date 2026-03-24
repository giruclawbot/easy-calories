const GOAL_KEY = 'ec_calorie_goal'
export const DEFAULT_GOAL = 2000

export function getStoredGoal(): number {
  if (typeof window === 'undefined') return DEFAULT_GOAL
  const stored = localStorage.getItem(GOAL_KEY)
  return stored ? parseInt(stored) : DEFAULT_GOAL
}

export function setStoredGoal(goal: number): void {
  localStorage.setItem(GOAL_KEY, goal.toString())
}
