import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WellRun - Run well, live well',
  description: 'A modern, intelligent running companion that transforms your fitness journey into measurable progress',
  generator: 'v0.dev',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WellRun',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'theme-color': '#3b82f6',
    'msapplication-navbutton-color': '#3b82f6',
    'apple-mobile-web-app-title': 'WellRun',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* Safari兼容性增强 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WellRun" />
        <meta name="theme-color" content="#3b82f6" />
        
        {/* iOS Safari特定优化 */}
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 防止Safari缓存问题 */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
