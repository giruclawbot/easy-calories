import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { HydrationTracker } from '../HydrationTracker'
import { getHydrationLog, addHydration, resetHydration } from '@/lib/firestore'

jest.mock('@/lib/firestore', () => ({
  getHydrationLog: jest.fn(),
  addHydration: jest.fn(),
  resetHydration: jest.fn(),
}))

const mockGetHydrationLog = getHydrationLog as jest.MockedFunction<typeof getHydrationLog>
const mockAddHydration = addHydration as jest.MockedFunction<typeof addHydration>
const mockResetHydration = resetHydration as jest.MockedFunction<typeof resetHydration>

const defaultProps = {
  uid: 'user1',
  date: '2026-03-26',
  goalMl: 2000,
  isToday: true,
}

describe('HydrationTracker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAddHydration.mockResolvedValue(undefined)
    mockResetHydration.mockResolvedValue(undefined)
  })

  it('renders with 0ml when no log exists', async () => {
    mockGetHydrationLog.mockResolvedValue(null)
    render(<HydrationTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetHydrationLog).toHaveBeenCalledWith('user1', '2026-03-26'))
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('shows current totalMl when log exists with 500ml', async () => {
    mockGetHydrationLog.mockResolvedValue({
      date: '2026-03-26',
      totalMl: 500,
      logs: [{ ml: 500, timestamp: '2026-03-26T10:00:00Z' }],
    })
    render(<HydrationTracker {...defaultProps} />)
    await waitFor(() => expect(screen.getByText('500')).toBeInTheDocument())
  })

  it('shows goal value', async () => {
    mockGetHydrationLog.mockResolvedValue(null)
    render(<HydrationTracker {...defaultProps} goalMl={2500} />)
    await waitFor(() => expect(screen.getByText(/2500/)).toBeInTheDocument())
  })

  it('clicking +250ml calls addHydration with 250', async () => {
    mockGetHydrationLog.mockResolvedValue(null)
    render(<HydrationTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetHydrationLog).toHaveBeenCalled())

    const btn = screen.getByText('+250ml')
    await act(async () => { fireEvent.click(btn) })
    expect(mockAddHydration).toHaveBeenCalledWith('user1', '2026-03-26', 250)
  })

  it('reset button shows confirm state on click', async () => {
    mockGetHydrationLog.mockResolvedValue(null)
    render(<HydrationTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetHydrationLog).toHaveBeenCalled())

    const resetBtn = screen.getByLabelText('Reiniciar')
    fireEvent.click(resetBtn)
    expect(screen.getByText('¿Reiniciar el registro de hoy?')).toBeInTheDocument()
  })

  it('confirming reset calls resetHydration', async () => {
    mockGetHydrationLog.mockResolvedValue(null)
    render(<HydrationTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetHydrationLog).toHaveBeenCalled())

    fireEvent.click(screen.getByLabelText('Reiniciar'))
    await act(async () => { fireEvent.click(screen.getByText('Sí')) })
    expect(mockResetHydration).toHaveBeenCalledWith('user1', '2026-03-26')
  })

  it('canceling reset hides confirm state', async () => {
    mockGetHydrationLog.mockResolvedValue(null)
    render(<HydrationTracker {...defaultProps} />)
    await waitFor(() => expect(mockGetHydrationLog).toHaveBeenCalled())

    fireEvent.click(screen.getByLabelText('Reiniciar'))
    expect(screen.getByText('¿Reiniciar el registro de hoy?')).toBeInTheDocument()
    fireEvent.click(screen.getByText('No'))
    expect(screen.queryByText('¿Reiniciar el registro de hoy?')).not.toBeInTheDocument()
  })

  it('read-only: no add buttons when isToday=false', async () => {
    mockGetHydrationLog.mockResolvedValue({
      date: '2026-03-25',
      totalMl: 1000,
      logs: [],
    })
    render(<HydrationTracker {...defaultProps} date="2026-03-25" isToday={false} />)
    await waitFor(() => expect(mockGetHydrationLog).toHaveBeenCalled())

    expect(screen.queryByText('+250ml')).not.toBeInTheDocument()
    expect(screen.getByText('Solo lectura — selecciona hoy para registrar')).toBeInTheDocument()
  })
})
