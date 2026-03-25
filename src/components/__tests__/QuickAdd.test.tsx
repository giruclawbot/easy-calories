import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { QuickAdd } from '../QuickAdd'
import { getFrequentFoods, dismissFrequentFood } from '@/lib/firestore'

jest.mock('@/lib/firestore', () => ({
  getFrequentFoods: jest.fn(),
  dismissFrequentFood: jest.fn(),
}))

const mockGetFrequentFoods = getFrequentFoods as jest.MockedFunction<typeof getFrequentFoods>
const mockDismissFrequentFood = dismissFrequentFood as jest.MockedFunction<typeof dismissFrequentFood>

const sampleFoods = [
  { foodName: 'Chicken Breast', calories: 165, quantity: 100, unit: 'g', count: 5, lastUsed: '2026-03-25T00:00:00Z', dismissed: false },
  { foodName: 'Brown Rice', calories: 216, quantity: 100, unit: 'g', count: 3, lastUsed: '2026-03-24T00:00:00Z', dismissed: false },
]

describe('QuickAdd', () => {
  const mockOnAdd = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    mockDismissFrequentFood.mockResolvedValue(undefined)
  })

  it('renders nothing when no frequent foods', async () => {
    mockGetFrequentFoods.mockResolvedValue([])
    const { container } = render(<QuickAdd uid="user1" onAdd={mockOnAdd} />)
    await waitFor(() => expect(mockGetFrequentFoods).toHaveBeenCalledWith('user1'))
    expect(container.firstChild).toBeNull()
  })

  it('renders food cards when frequent foods exist', async () => {
    mockGetFrequentFoods.mockResolvedValue(sampleFoods)
    render(<QuickAdd uid="user1" onAdd={mockOnAdd} />)
    await waitFor(() => expect(screen.getByText('Chicken Breast')).toBeInTheDocument())
    expect(screen.getByText('Brown Rice')).toBeInTheDocument()
    expect(screen.getByText('165 kcal')).toBeInTheDocument()
  })

  it('clicking "+ Add" calls onAdd with correct meal data', async () => {
    mockGetFrequentFoods.mockResolvedValue(sampleFoods)
    render(<QuickAdd uid="user1" onAdd={mockOnAdd} />)
    await waitFor(() => screen.getByText('Chicken Breast'))

    const addButtons = screen.getAllByText('+ Agregar')
    await act(async () => {
      fireEvent.click(addButtons[0])
    })

    expect(mockOnAdd).toHaveBeenCalledWith({
      foodName: 'Chicken Breast',
      calories: 165,
      quantity: 100,
      unit: 'g',
      nutrition: undefined,
    })
  })

  it('clicking × calls dismissFrequentFood and removes card from DOM', async () => {
    mockGetFrequentFoods.mockResolvedValue(sampleFoods)
    render(<QuickAdd uid="user1" onAdd={mockOnAdd} />)
    await waitFor(() => screen.getByText('Chicken Breast'))

    const dismissButtons = screen.getAllByRole('button', { name: /ocultar/i })
    await act(async () => {
      fireEvent.click(dismissButtons[0])
    })

    expect(mockDismissFrequentFood).toHaveBeenCalledWith('user1', 'Chicken Breast')
    await waitFor(() => expect(screen.queryByText('Chicken Breast')).not.toBeInTheDocument())
  })
})
