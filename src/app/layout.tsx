import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { UserJotWidget } from '@/components/UserJotWidget'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '5 Lines Story - AI-Powered Storytelling',
  description: 'Create compelling stories with AI using the 5-line methodology. Transform your ideas into structured narratives in any language.',
  keywords: ['storytelling', 'AI', 'narrative', 'writing', 'creative', '5 lines'],
  authors: [{ name: '5 Lines Story' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#0ea5e9',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    siteName: '5 Lines Story',
    title: '5 Lines Story - AI-Powered Storytelling',
    description: 'Create compelling stories with AI using the 5-line methodology',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#0ea5e9',
          colorBackground: '#ffffff',
          colorText: '#1e293b',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          {children}
          <UserJotWidget />
        </body>
      </html>
    </ClerkProvider>
  )
}
