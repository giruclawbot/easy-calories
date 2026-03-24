import { render, screen, fireEvent, act } from '@testing-library/react'
import { EditMealModal } from '../EditMealModal'
import type { Meal } from '@/lib/firestore'

const mockMeal: Meal = {
  id: '1',
  foodName: 'Apple, raw',
  calories: 52,
  quantity: 100,
  unit: 'g',
  timestamp: '2026-03-24T00:00:00Z',
  nutrition: {
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10,
    sodium: 1,
    cholesterol: 0,
  },
}

describe('EditMealModal', () => {
  const onSave = jest.fn()
  const onClose = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it('renders with meal name', () => {
    render(<EditMealModal meal={mockMeal} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('Apple, raw')).toBeInTheDocument()
    expect(screen.getByText('Editar porción')).toBeInTheDocument()
  })

  it('shows macro preview', () => {
    render(<EditMealModal meal={mockMeal} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('Proteína')).toBeInTheDocument()
    expect(screen.getByText('Carbs')).toBeInTheDocument()
    expect(screen.getByText('Grasa')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    render(<EditMealModal meal={mockMeal} onSave={onSave} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Cerrar'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('handles meal without nutrition', async () => {
    const mealNoNutrition: Meal = {
      id: '2',
      foodName: 'Unknown food',
      calories: 100,
      quantity: 100,
      unit: 'g',
      timestamp: '2026-03-24T00:00:00Z',
    }
    render(<EditMealModal meal={mealNoNutrition} onSave={onSave} onClose={onClose} />)
    expect(screen.getByText('Unknown food')).toBeInTheDocument()
    await act(async () => {
      fireEvent.click(screen.getByText('Guardar'))
    })
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      calories: 100,
    }))
  })

  it('calls onSave with updated meal on submit', async () => {
    render(<EditMealModal meal={mockMeal} onSave={onSave} onClose={onClose} />)
    const input = screen.getByPlaceholderText('Cantidad')
    fireEvent.change(input, { target: { value: '200' } })
    await act(async () => {
      fireEvent.click(screen.getByText('Guardar'))
    })
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      quantity: 200,
      calories: 104, // 52 * 2
    }))
  })
})
