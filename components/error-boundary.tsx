"use client"

import React from "react"
import { AlertCircle, RefreshCw, Smartphone, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("🔥 ErrorBoundary caught an error:", error, errorInfo)
    
    // 记录设备信息以帮助调试
    if (typeof window !== 'undefined') {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        isMobile: /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()),
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
      
      console.error("📱 Device Info:", deviceInfo)
      console.error("📍 Component Stack:", errorInfo.componentStack)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
      }

      const isMobile = typeof window !== 'undefined' && 
        (/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase()) || 
         window.innerWidth < 768)

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {isMobile ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    <p className="font-medium">{isMobile ? "移动端" : "桌面端"}应用出现错误</p>
                  </div>
                  <p className="text-sm text-gray-600">{this.state.error?.message || "发生了未知错误"}</p>
                  {typeof window !== 'undefined' && (
                    <div className="text-xs text-gray-500 border-t pt-2">
                      <div>视口: {window.innerWidth}x{window.innerHeight}</div>
                      <div>浏览器: {navigator.userAgent.split(' ')[0]}</div>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button onClick={this.resetError} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                尝试恢复
              </Button>

              <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                刷新页面
              </Button>

              {isMobile && (
                <Button 
                  variant="outline" 
                  onClick={() => window.location.href = '/mobile-test'} 
                  className="w-full text-blue-600"
                >
                  移动端诊断
                </Button>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook版本的错误边界
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const handleError = React.useCallback((error: Error) => {
    console.error("Error caught by useErrorHandler:", error)
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { handleError, resetError }
}
