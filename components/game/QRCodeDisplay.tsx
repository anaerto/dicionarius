'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

interface QRCodeDisplayProps {
  url: string
}

export default function QRCodeDisplay({ url }: QRCodeDisplayProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    .then(setQrCodeUrl)
    .catch(console.error)
  }, [url])

  if (!qrCodeUrl) {
    return (
      <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
        <span className="text-gray-500">Gerando QR Code...</span>
      </div>
    )
  }

  return (
    <div className="qr-code">
      <img src={qrCodeUrl} alt="QR Code para entrar no jogo" className="w-48 h-48" />
      <p className="text-sm text-gray-600 mt-2 text-center">
        Escaneie para entrar no jogo
      </p>
      <p className="text-xs text-gray-500 mt-1 text-center break-all">
        {url}
      </p>
    </div>
  )
}