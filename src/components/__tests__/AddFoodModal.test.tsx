import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AddFoodModal } from '../AddFoodModal'
import { addCommunityFood } from '@/lib/communityFoods'

jest.mock('@/lib/communityFoods', () => ({
  addCommunityFood: jest.fn(),
}))

jest.mock('@/components/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'user1', displayName: 'Test User' } }),
}))

const mockAddCommunityFood = addCommunityFood as jest.MockedFunction<typeof addCommunityFood>

const mockFood = {
  id: 'abc',
  name: 'Tortilla',
  description: 'Tortilla',
  nutrition: { calories: 200, protein: 5, carbs: 40, fat: 3, fiber: 2, sugar: 1, sodium: 100, cholesterol: 0 },
  servingSize: 100,
  unit: 'g',
  createdBy: 'user1',
  createdAt: new Date().toISOString(),
  searchTerms: ['tortilla'],
  source: 'community' as const,
}

describe('AddFoodModal', () => {
  const mockOnAdd = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the form with required fields', () => {
    render(<AddFoodModal onAdd={mockOnAdd} onClose={mockOnClose} />)
    expect(screen.getByPlaceholderText(/Ej: Tortilla/i)).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<AddFoodModal onAdd={mockOnAdd} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText('Cancelar'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('calls onClose when × button is clicked', () => {
    render(<AddFoodModal onAdd={mockOnAdd} onClose={mockOnClose} />)
    fireEvent.click(screen.getByText('×'))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('submits form and calls onAdd on success', async () => {
    mockAddCommunityFood.mockResolvedValue(mockFood)
    render(<AddFoodModal onAdd={mockOnAdd} onClose={mockOnClose} />)

    fireEvent.change(screen.getByPlaceholderText(/Ej: Tortilla/i), { target: { value: 'Tortilla' } })
    fireEvent.click(screen.getByText('Guardar alimento'))

    await waitFor(() => expect(mockAddCommunityFood).toHaveBeenCalled())
    await waitFor(() => expect(mockOnAdd).toHaveBeenCalledWith(mockFood))
  })

  it('shows error message when submission fails', async () => {
    mockAddCommunityFood.mockRejectedValue(new Error('Network error'))
    render(<AddFoodModal onAdd={mockOnAdd} onClose={mockOnClose} />)

    fireEvent.change(screen.getByPlaceholderText(/Ej: Tortilla/i), { target: { value: 'Tortilla' } })
    fireEvent.click(screen.getByText('Guardar alimento'))

    await waitFor(() => expect(screen.getByText(/Network error/i)).toBeInTheDocument())
  })

  it('renders unit select with all options', () => {
    render(<AddFoodModal onAdd={mockOnAdd} onClose={mockOnClose} />)
    expect(screen.getByText(/g \(gramos\)/i)).toBeInTheDocument()
    expect(screen.getByText(/ml \(mililitros\)/i)).toBeInTheDocument()
  })
})
