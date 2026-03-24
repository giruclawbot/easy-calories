import { getStoredGoal, setStoredGoal, DEFAULT_GOAL } from '../goals'

describe('goals', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns DEFAULT_GOAL when nothing stored', () => {
    expect(getStoredGoal()).toBe(DEFAULT_GOAL)
  })

  it('returns stored goal after setStoredGoal', () => {
    setStoredGoal(1800)
    expect(getStoredGoal()).toBe(1800)
  })

  it('returns value for invalid stored string (NaN)', () => {
    localStorage.setItem('ec_calorie_goal', 'not-a-number')
    const result = getStoredGoal()
    expect(typeof result).toBe('number')
  })

  it('DEFAULT_GOAL is 2000', () => {
    expect(DEFAULT_GOAL).toBe(2000)
  })

  it('setStoredGoal stores as string in localStorage', () => {
    setStoredGoal(2500)
    expect(localStorage.getItem('ec_calorie_goal')).toBe('2500')
  })

  it('returns custom goal value', () => {
    setStoredGoal(1500)
    expect(getStoredGoal()).toBe(1500)
  })
})
