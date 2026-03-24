import { render, screen, fireEvent, act } from '@testing-library/react'
import { PWAInstaller } from '../PWAInstaller'

// Mock serviceWorker globally
const mockRegister = jest.fn().mockResolvedValue({})
Object.defineProperty(global.navigator, 'serviceWorker', {
  value: { register: mockRegister },
  writable: true,
  configurable: true,
})

describe('PWAInstaller', () => {
  beforeEach(() => {
    mockRegister.mockClear()
  })

  it('renders nothing by default (no install prompt)', () => {
    const { container } = render(<PWAInstaller />)
    expect(container).toBeEmptyDOMElement()
  })

  it('registers service worker on mount', () => {
    render(<PWAInstaller />)
    expect(mockRegister).toHaveBeenCalledWith('/sw.js')
  })

  it('shows banner when beforeinstallprompt fires', async () => {
    render(<PWAInstaller />)

    const mockPrompt = jest.fn()
    const event = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jest.fn(),
      prompt: mockPrompt,
    })

    await act(async () => {
      window.dispatchEvent(event)
    })

    expect(screen.getByText('Instalar Easy Calories')).toBeInTheDocument()
  })

  it('hides banner when close button clicked', async () => {
    render(<PWAInstaller />)

    const event = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jest.fn(),
      prompt: jest.fn(),
    })

    await act(async () => {
      window.dispatchEvent(event)
    })

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Cerrar banner de instalación'))
    })

    expect(screen.queryByText('Instalar Easy Calories')).not.toBeInTheDocument()
  })

  it('calls prompt and hides banner when install clicked', async () => {
    render(<PWAInstaller />)

    const mockPrompt = jest.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jest.fn(),
      prompt: mockPrompt,
    })

    await act(async () => {
      window.dispatchEvent(event)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Instalar'))
    })

    expect(mockPrompt).toHaveBeenCalled()
    expect(screen.queryByText('Instalar Easy Calories')).not.toBeInTheDocument()
  })
})



describe('PWAInstaller', () => {
  it('renders nothing by default (no install prompt)', () => {
    const { container } = render(<PWAInstaller />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows banner when beforeinstallprompt fires', async () => {
    render(<PWAInstaller />)

    const mockPrompt = jest.fn()
    const event = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jest.fn(),
      prompt: mockPrompt,
    })

    await act(async () => {
      window.dispatchEvent(event)
    })

    expect(screen.getByText('Instalar Easy Calories')).toBeInTheDocument()
  })

  it('hides banner when close button clicked', async () => {
    render(<PWAInstaller />)

    const event = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jest.fn(),
      prompt: jest.fn(),
    })

    await act(async () => {
      window.dispatchEvent(event)
    })

    expect(screen.getByText('Instalar Easy Calories')).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(screen.getByLabelText('Cerrar banner de instalación'))
    })

    expect(screen.queryByText('Instalar Easy Calories')).not.toBeInTheDocument()
  })

  it('calls prompt and hides banner when install clicked', async () => {
    render(<PWAInstaller />)

    const mockPrompt = jest.fn().mockResolvedValue(undefined)
    const event = Object.assign(new Event('beforeinstallprompt'), {
      preventDefault: jest.fn(),
      prompt: mockPrompt,
    })

    await act(async () => {
      window.dispatchEvent(event)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Instalar'))
    })

    expect(mockPrompt).toHaveBeenCalled()
    expect(screen.queryByText('Instalar Easy Calories')).not.toBeInTheDocument()
  })
})
