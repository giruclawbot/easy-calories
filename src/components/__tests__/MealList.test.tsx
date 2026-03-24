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
  nutrition: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, sugar: 10, sodium: 1, cholesterol: 0 },
}

const meal2: Meal = {
  id: '2',
  foodName: 'Banana',
  calories: 89,
  quantity: 100,
  unit: 'g',
  timestamp: '2026-03-24T00:00:00Z',
}

describe('MealList', () => {
  it('shows empty state when no meals', () => {
    render(<MealList meals={[]} />)
    expect(screen.getByText('No hay comidas registradas')).toBeInTheDocument()
  })

  it('renders meal list', () => {
    render(<MealList meals={[meal1, meal2]} />)
    expect(screen.getByText('Apple, raw')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('52 kcal')).toBeInTheDocument()
    expect(screen.getByText('89 kcal')).toBeInTheDocument()
  })

  it('shows macros when nutrition present', () => {
    render(<MealList meals={[meal1]} />)
    expect(screen.getByText('P: 0g')).toBeInTheDocument()
    expect(screen.getByText('C: 14g')).toBeInTheDocument()
    expect(screen.getByText('G: 0g')).toBeInTheDocument()
  })

  it('does not show macros when nutrition absent', () => {
    render(<MealList meals={[meal2]} />)
    expect(screen.queryByText(/^P:/)).not.toBeInTheDocument()
  })

  it('calls onRemove when remove button clicked', () => {
    const onRemove = jest.fn()
    render(<MealList meals={[meal1]} onRemove={onRemove} />)
    fireEvent.click(screen.getByLabelText('Eliminar comida'))
    expect(onRemove).toHaveBeenCalledWith(meal1)
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = jest.fn()
    render(<MealList meals={[meal1]} onEdit={onEdit} />)
    fireEvent.click(screen.getByLabelText('Editar Apple, raw'))
    expect(onEdit).toHaveBeenCalledWith(meal1)
  })

  it('does not show edit button when onEdit not provided', () => {
    render(<MealList meals={[meal1]} />)
    expect(screen.queryByLabelText('Editar Apple, raw')).not.toBeInTheDocument()
  })

  it('does not show remove button when onRemove not provided', () => {
    render(<MealList meals={[meal1]} />)
    expect(screen.queryByLabelText('Eliminar comida')).not.toBeInTheDocument()
  })
})
