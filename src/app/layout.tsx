import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YHEPL ERP',
  description: 'Yogashri Heavy Engineering — Production ERP',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
