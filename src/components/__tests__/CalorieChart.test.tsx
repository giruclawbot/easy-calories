import { render, screen } from '@testing-library/react'
import { CalorieChart } from '../CalorieChart'

// Mock recharts to avoid canvas issues in jsdom
jest.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
}))

describe('CalorieChart', () => {
  it('renders chart container', () => {
    render(<CalorieChart data={{}} />)
    expect(screen.getByText('Calorías esta semana')).toBeInTheDocument()
  })

  it('shows goal text with default goal', () => {
    render(<CalorieChart data={{}} />)
    expect(screen.getByText(/Meta: 2000 kcal/)).toBeInTheDocument()
  })

  it('shows goal text with custom goal', () => {
    render(<CalorieChart data={{}} goal={1800} />)
    expect(screen.getByText(/Meta: 1800 kcal/)).toBeInTheDocument()
  })

  it('renders bar chart when data provided', () => {
    render(<CalorieChart data={{ '2026-03-24': 1500, '2026-03-23': 2200 }} goal={2000} />)
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })
})
