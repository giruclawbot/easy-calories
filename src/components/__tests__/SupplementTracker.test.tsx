import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SupplementTracker } from '../SupplementTracker'
import { getSupplementLog, addSupplement, removeSupplement } from '@/lib/firestore'
import { searchSupplements } from '@/lib/usda'

jest.mock('@/lib/firestore', () => ({
  getSupplementLog: jest.fn(),
  addSupplement: jest.fn(),
  removeSupplement: jest.fn(),
}))

jest.mock('@/lib/usda', () => ({
  searchSupplements: jest.fn(),
}))

const mockGetSupplementLog = getSupplementLog as jest.MockedFunction<typeof getSupplementLog>
const mockAddSupplement = addSupplement as jest.MockedFunction<typeof addSupplement>
const mockRemoveSupplement = removeSupplement as jest.MockedFunction<typeof removeSupplement>
const mockSearchSupplements = searchSupplements as jest.MockedFunction<typeof searchSupplements>

const defaultProps = {
  uid: 'user1',
  date: '2026-03-26',
  isToday: true,
}

describe('SupplementTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSupplementLog.mockResolvedValue(null)
    mockAddSupplement.mockResolvedValue(undefined)
    mockRemoveSupplement.mockResolvedValue(undefined)
    mockSearchSupplements.mockResolvedValue([])
  })

  it('renders component with search tab active', async () => {
    render(<SupplementTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetSupplementLog).toHaveBeenCalledWith('user1', '2026-03-26'))
    expect(screen.getByPlaceholderText(/suplemento/i)).toBeInTheDocument()
  })

  it('shows teal header with 💊', async () => {
    render(<SupplementTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetSupplementLog).toHaveBeenCalled())
    expect(screen.getByText(/💊/)).toBeInTheDocument()
  })

  it('shows empty log state when no entries', async () => {
    mockGetSupplementLog.mockResolvedValue(null)
    render(<SupplementTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetSupplementLog).toHaveBeenCalled())
    fireEvent.click(screen.getByText(/registros/i))
    await waitFor(() => {
      expect(screen.getByText(/sin suplementos registrados/i)).toBeInTheDocument()
    })
  })

  it('shows supplement entries when log has data', async () => {
    mockGetSupplementLog.mockResolvedValue({
      date: '2026-03-26',
      entries: [
        {
          id: 'e1',
          name: 'Vitamin C',
          amount: 1,
          unit: 'tablet',
          calories: 0,
          timestamp: '2026-03-26T10:00:00Z',
        },
      ],
    })
    render(<SupplementTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetSupplementLog).toHaveBeenCalled())
    fireEvent.click(screen.getByText(/registros/i))
    await waitFor(() => {
      expect(screen.getByText('Vitamin C')).toBeInTheDocument()
    })
  })

  it('remove button calls removeSupplement', async () => {
    mockGetSupplementLog.mockResolvedValue({
      date: '2026-03-26',
      entries: [
        {
          id: 'e1',
          name: 'Creatine',
          amount: 5,
          unit: 'g',
          calories: 0,
          timestamp: '2026-03-26T10:00:00Z',
        },
      ],
    })
    render(<SupplementTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetSupplementLog).toHaveBeenCalled())
    fireEvent.click(screen.getByText(/registros/i))
    await waitFor(() => expect(screen.getByText('Creatine')).toBeInTheDocument())
    const removeBtn = screen.getByLabelText('Remove')
    await act(async () => { fireEvent.click(removeBtn) })
    expect(mockRemoveSupplement).toHaveBeenCalledWith('user1', '2026-03-26', 'e1')
  })

  it('caloric supplement shows caloric badge', async () => {
    mockSearchSupplements.mockResolvedValue([
      {
        fdcId: 1,
        description: 'Whey Protein',
        brandOwner: 'Brand',
        nutrition: { calories: 400, protein: 80, carbs: 10, fat: 5, fiber: 0, sugar: 2, sodium: 100, cholesterol: 0 },
      },
    ])
    render(<SupplementTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetSupplementLog).toHaveBeenCalled())
    const input = screen.getByPlaceholderText(/suplemento/i)
    fireEvent.change(input, { target: { value: 'whey' } })
    await waitFor(() => expect(mockSearchSupplements).toHaveBeenCalled(), { timeout: 600 })
    await waitFor(() => expect(screen.getByText('Whey Protein')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Whey Protein'))
    const amountInput = screen.getByPlaceholderText(/cantidad/i)
    fireEvent.change(amountInput, { target: { value: '100' } })
    await waitFor(() => {
      expect(screen.getByText(/cuenta en tus calorías/i)).toBeInTheDocument()
    })
  })

  it('non-caloric shows tracking-only badge', async () => {
    mockSearchSupplements.mockResolvedValue([
      {
        fdcId: 2,
        description: 'Creatine Monohydrate',
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0 },
      },
    ])
    render(<SupplementTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetSupplementLog).toHaveBeenCalled())
    const input = screen.getByPlaceholderText(/suplemento/i)
    fireEvent.change(input, { target: { value: 'creatine' } })
    await waitFor(() => expect(mockSearchSupplements).toHaveBeenCalled(), { timeout: 600 })
    await waitFor(() => expect(screen.getByText('Creatine Monohydrate')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Creatine Monohydrate'))
    await waitFor(() => {
      expect(screen.getByText(/solo seguimiento/i)).toBeInTheDocument()
    })
  })
})
