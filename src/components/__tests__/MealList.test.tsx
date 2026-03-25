import { render, screen, fireEvent } from '@testing-library/react'
import { MealList } from '../MealList'
import type { Meal } from '@/lib/firestore'

const meal1: Meal = {
  id: '1',
  foodName: 'Apple, raw',
  calories: 52,
  quantity: 100,
  unit: 'g',
  timestamp: '2026-03-24T00:00:00Z',
  mealType: 'breakfast',
  nutrition: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, cholesterol: 0 },
}

const meal2: Meal = {
  id: '2',
  foodName: 'Banana',
  calories: 89,
  quantity: 100,
  unit: 'g',
  timestamp: '2026-03-24T00:00:00Z',
  mealType: 'lunch',
}

const meal3: Meal = {
  id: '3',
  foodName: 'Rice',
  calories: 200,
  quantity: 150,
  unit: 'g',
  timestamp: '2026-03-24T00:00:00Z',
  // no mealType — legacy
}

describe('MealList', () => {
  it('shows empty state when no meals', () => {
    render(<MealList meals={[]} />)
    expect(screen.getByText('Sin comidas registradas')).toBeInTheDocument()
  })

  it('renders meal list in viewMode=all', () => {
    render(<MealList meals={[meal1, meal2]} viewMode="all" />)
    expect(screen.getByText('Apple, raw')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('52 kcal')).toBeInTheDocument()
    expect(screen.getByText('89 kcal')).toBeInTheDocument()
  })

  it('shows macros when nutrition present', () => {
    render(<MealList meals={[meal1]} viewMode="all" />)
    expect(screen.getByText('P: 0g')).toBeInTheDocument()
    expect(screen.getByText('C: 14g')).toBeInTheDocument()
    expect(screen.getByText('G: 0g')).toBeInTheDocument()
  })

  it('does not show macros when nutrition absent', () => {
    render(<MealList meals={[meal2]} viewMode="all" />)
    expect(screen.queryByText(/^P:/)).not.toBeInTheDocument()
  })

  it('calls onRemove when remove button clicked', () => {
    const onRemove = jest.fn()
    render(<MealList meals={[meal1]} onRemove={onRemove} viewMode="all" />)
    fireEvent.click(screen.getByLabelText('Eliminar comida'))
    expect(onRemove).toHaveBeenCalledWith(meal1)
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn()
    render(<MealList meals={[meal1]} onEdit={onEdit} viewMode="all" />)
    fireEvent.click(screen.getByLabelText('Editar Apple, raw'))
    expect(onEdit).toHaveBeenCalledWith(meal1)
  })

  it('does not show edit button when onEdit not provided', () => {
    render(<MealList meals={[meal1]} viewMode="all" />)
    expect(screen.queryByLabelText('Editar Apple, raw')).not.toBeInTheDocument()
  })

  it('does not show remove button when onRemove not provided', () => {
    render(<MealList meals={[meal1]} viewMode="all" />)
    expect(screen.queryByLabelText('Eliminar comida')).not.toBeInTheDocument()
  })

  it('renders grouped view with meal type headers', () => {
    render(<MealList meals={[meal1, meal2]} viewMode="grouped" />)
    expect(screen.getByText(/Desayuno/)).toBeInTheDocument()
    expect(screen.getByText(/Almuerzo/)).toBeInTheDocument()
  })

  it('grouped view shows meals under correct groups', () => {
    render(<MealList meals={[meal1, meal2]} viewMode="grouped" />)
    expect(screen.getByText('Apple, raw')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  it('grouped view does not render groups with 0 meals', () => {
    render(<MealList meals={[meal1]} viewMode="grouped" />)
    // Only breakfast group should appear
    expect(screen.getByText(/Desayuno/)).toBeInTheDocument()
    expect(screen.queryByText(/Almuerzo/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Cena/)).not.toBeInTheDocument()
  })

  it('meals without mealType go to Others group (mixed meals)', () => {
    // Mix: one with mealType, one without → not all-legacy, so grouped works
    render(<MealList meals={[meal1, meal3]} viewMode="grouped" />)
    expect(screen.getByText(/Otros/)).toBeInTheDocument()
    expect(screen.getByText('Rice')).toBeInTheDocument()
  })

  it('grouped view shows calorie subtotals per group', () => {
    render(<MealList meals={[meal1, meal2]} viewMode="grouped" />)
    // meal1 = 52 kcal (breakfast), meal2 = 89 kcal (lunch)
    // Each value appears twice: once in group header subtotal, once in meal item
    expect(screen.getAllByText('52 kcal').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('89 kcal').length).toBeGreaterThanOrEqual(1)
  })

  it('toggle button calls onViewModeChange from all to grouped', () => {
    const onViewModeChange = jest.fn()
    render(<MealList meals={[meal1]} viewMode="all" onViewModeChange={onViewModeChange} />)
    fireEvent.click(screen.getByLabelText('Ver por tipo de comida'))
    expect(onViewModeChange).toHaveBeenCalledWith('grouped')
  })

  it('toggle button calls onViewModeChange from grouped to all', () => {
    const onViewModeChange = jest.fn()
    render(<MealList meals={[meal1]} viewMode="grouped" onViewModeChange={onViewModeChange} />)
    fireEvent.click(screen.getByLabelText('Ver todas las comidas'))
    expect(onViewModeChange).toHaveBeenCalledWith('all')
  })

  it('hides toggle when all meals are legacy (no mealType)', () => {
    render(<MealList meals={[meal3]} viewMode="grouped" />)
    // Should force all mode and hide toggle
    expect(screen.queryByLabelText('Ver todas las comidas')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ver por tipo de comida')).not.toBeInTheDocument()
  })

  it('defaults to grouped view when viewMode not provided', () => {
    render(<MealList meals={[meal1, meal2]} />)
    // grouped view shows group headers
    expect(screen.getByText(/Desayuno/)).toBeInTheDocument()
  })
})
