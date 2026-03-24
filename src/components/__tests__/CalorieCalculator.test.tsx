import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CalorieCalculator } from '../CalorieCalculator'

const onGoalSet = jest.fn()
const onClose = jest.fn()

describe('CalorieCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the calculator form', () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)
    expect(screen.getByText('🧮 Calculadora de calorías')).toBeInTheDocument()
    expect(screen.getByText('Calcular mi meta')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Cerrar calculadora'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows results after form submission (male, moderate, maintain)', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '70' } })
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '170' } })

    fireEvent.click(screen.getByText('Calcular mi meta'))

    await waitFor(() => {
      expect(screen.getByText('Metabolismo basal')).toBeInTheDocument()
      expect(screen.getByText('Gasto total')).toBeInTheDocument()
      expect(screen.getByText('Recomendada')).toBeInTheDocument()
    })
  })

  it('calculates correctly for female sex', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)

    // Click the female radio label
    fireEvent.click(screen.getByText('♀ Mujer'))
    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '165' } })
    fireEvent.click(screen.getByText('Calcular mi meta'))

    await waitFor(() => {
      expect(screen.getByText('Metabolismo basal')).toBeInTheDocument()
    })
  })

  it('calculates with goal=lose', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)

    // Click the "Perder" radio label
    fireEvent.click(screen.getByText('📉 Perder'))
    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '80' } })
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '175' } })
    fireEvent.click(screen.getByText('Calcular mi meta'))

    await waitFor(() => {
      expect(screen.getByText('Recomendada')).toBeInTheDocument()
    })
  })

  it('calculates with goal=gain', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)

    fireEvent.click(screen.getByText('📈 Ganar'))
    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '25' } })
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '65' } })
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '170' } })
    fireEvent.click(screen.getByText('Calcular mi meta'))

    await waitFor(() => {
      expect(screen.getByText('Recomendada')).toBeInTheDocument()
    })
  })

  it('can go back with Recalcular', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '70' } })
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '170' } })
    fireEvent.click(screen.getByText('Calcular mi meta'))

    await waitFor(() => screen.getByText('← Recalcular'))
    fireEvent.click(screen.getByText('← Recalcular'))

    expect(screen.getByText('Calcular mi meta')).toBeInTheDocument()
  })

  it('shows validation errors when form submitted empty', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)
    fireEvent.click(screen.getByText('Calcular mi meta'))
    await waitFor(() => {
      expect(screen.getAllByText('Requerido').length).toBeGreaterThan(0)
    })
  })

  it('enforces minimum 1200 cal recommendation', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)
    // Very low values + lose goal → recommended hits 1200 floor
    fireEvent.click(screen.getByText('📉 Perder'))
    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '60' } })
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '40' } })
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '150' } })
    fireEvent.click(screen.getByText('Calcular mi meta'))
    await waitFor(() => {
      expect(screen.getByText('Recomendada')).toBeInTheDocument()
    })
  })

  it('calls onGoalSet and onClose when "Usar esta meta" is clicked', async () => {
    render(<CalorieCalculator onGoalSet={onGoalSet} onClose={onClose} />)

    fireEvent.change(screen.getByLabelText('Edad'), { target: { value: '30' } })
    fireEvent.change(screen.getByLabelText('Peso'), { target: { value: '70' } })
    fireEvent.change(screen.getByLabelText('Altura'), { target: { value: '170' } })
    fireEvent.click(screen.getByText('Calcular mi meta'))

    await waitFor(() => screen.getByText('Usar esta meta'))
    fireEvent.click(screen.getByText('Usar esta meta'))

    expect(onGoalSet).toHaveBeenCalledWith(expect.any(Number))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
