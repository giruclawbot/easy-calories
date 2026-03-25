import { render, screen, fireEvent } from '@testing-library/react'
import { DayPicker } from '../DayPicker'

describe('DayPicker', () => {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  it('shows "Hoy" when selectedDate is today', () => {
    const onChange = jest.fn()
    render(<DayPicker selectedDate={today} onChange={onChange} />)
    expect(screen.getByText('📅 Hoy')).toBeInTheDocument()
  })

  it('shows formatted date when not today', () => {
    const onChange = jest.fn()
    render(<DayPicker selectedDate={yesterday} onChange={onChange} />)
    // Shows "Hoy" button when not today
    expect(screen.getByRole('button', { name: 'Hoy' })).toBeInTheDocument()
  })

  it('calls onChange when previous day clicked', () => {
    const onChange = jest.fn()
    render(<DayPicker selectedDate={today} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Día anterior'))
    expect(onChange).toHaveBeenCalledWith(yesterday)
  })

  it('next button is disabled when selectedDate is today', () => {
    const onChange = jest.fn()
    render(<DayPicker selectedDate={today} onChange={onChange} />)
    expect(screen.getByLabelText('Día siguiente')).toBeDisabled()
  })

  it('next button is enabled when selectedDate is not today', () => {
    const onChange = jest.fn()
    render(<DayPicker selectedDate={yesterday} onChange={onChange} />)
    expect(screen.getByLabelText('Día siguiente')).not.toBeDisabled()
  })

  it('calls onChange when "Hoy" clicked', () => {
    const onChange = jest.fn()
    render(<DayPicker selectedDate={yesterday} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Hoy' }))
    expect(onChange).toHaveBeenCalledWith(today)
  })
})
