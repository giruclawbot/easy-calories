'use client'
import { useEffect, useRef, useState } from 'react'
import { getFoodByBarcode, FoodItem } from '@/lib/usda'

interface Props {
  onFound: (food: FoodItem) => void
  onClose: () => void
}

export function BarcodeScanner({ onFound, onClose }: Props) {
  const [status, setStatus] = useState<'loading' | 'scanning' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const scannerRef = useRef<boolean>(false)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let QuaggaInstance: any = null

    async function start() {
      try {
        const mod = await import('@ericblade/quagga2')
        QuaggaInstance = mod.default

        QuaggaInstance.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: document.querySelector('#barcode-scanner-container') as HTMLElement,
              constraints: { facingMode: 'environment', width: 640, height: 480 },
            },
            decoder: { readers: ['ean_reader', 'upc_reader', 'ean_8_reader'] },
            locate: true,
          },
          (err: Error | null) => {
            if (err) {
              setStatus('error')
              setErrorMsg('No se pudo acceder a la cámara')
              return
            }
            QuaggaInstance.start()
            scannerRef.current = true
            setStatus('scanning')
          }
        )

        QuaggaInstance.onDetected(async (result: { codeResult: { code: string | null } }) => {
          const code = result.codeResult.code
          if (!code || !scannerRef.current) return
          scannerRef.current = false
          QuaggaInstance.stop()
          setStatus('loading')
          const food = await getFoodByBarcode(code)
          if (food) {
            onFound(food)
          } else {
            setErrorMsg(`No se encontró el producto (${code})`)
            setStatus('error')
          }
        })
      } catch {
        setStatus('error')
        setErrorMsg('Error al cargar el escáner')
      }
    }

    start()

    return () => {
      if (QuaggaInstance && scannerRef.current) {
        QuaggaInstance.stop()
      }
    }
  }, [onFound])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h3 className="font-bold text-white">📷 Escanear código de barras</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
        </div>

        {status === 'loading' && (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {status === 'error' && (
          <div className="p-6 text-center">
            <p className="text-red-400 mb-4">{errorMsg}</p>
            <button onClick={onClose} className="bg-gray-800 text-white px-4 py-2 rounded-lg">Cerrar</button>
          </div>
        )}

        <div
          id="barcode-scanner-container"
          className={`relative ${status === 'scanning' ? 'block' : 'hidden'}`}
          style={{ height: 280 }}
        >
          {status === 'scanning' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="w-48 h-24 border-2 border-emerald-400 rounded-lg opacity-70" />
            </div>
          )}
        </div>

        {status === 'scanning' && (
          <p className="text-xs text-gray-400 text-center p-3">Apunta al código de barras del producto</p>
        )}
      </div>
    </div>
  )
}
