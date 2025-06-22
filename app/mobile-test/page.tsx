"use client"

import { useState, useEffect } from "react"

export default function MobileTestPage() {
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    if (typeof window !== 'undefined') {
      const info = {
        userAgent: navigator.userAgent,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
      setDeviceInfo(info)
    }
  }, [])

  if (!isClient) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">移动端测试页面</h1>
        
        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">设备信息</h2>
          <div className="space-y-2 text-sm">
            {Object.entries(deviceInfo).map(([key, value]) => (
              <div key={key} className="flex">
                <span className="font-medium w-32">{key}:</span>
                <span className="flex-1 break-all">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">API测试</h2>
          <div className="space-y-2">
            <button 
              className="block w-full bg-blue-500 text-white p-2 rounded"
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-delete', { method: 'GET' })
                  const data = await response.json()
                  alert(`API测试成功: ${JSON.stringify(data)}`)
                } catch (error) {
                  alert(`API测试失败: ${error}`)
                }
              }}
            >
              测试API连接
            </button>
            
            <button 
              className="block w-full bg-green-500 text-white p-2 rounded"
              onClick={async () => {
                try {
                  const response = await fetch('/api/goals', { method: 'GET' })
                  const data = await response.json()
                  alert(`目标API成功: 找到${data.goals?.length || 0}个目标`)
                } catch (error) {
                  alert(`目标API失败: ${error}`)
                }
              }}
            >
              测试目标API
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">移动端特性测试</h2>
          <div className="space-y-2">
            <div>
              Touch支持: {typeof window !== 'undefined' && 'ontouchstart' in window ? '✅' : '❌'}
            </div>
            <div>
              移动端浏览器: {/android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(navigator.userAgent) ? '✅' : '❌'}
            </div>
            <div>
              小屏幕: {window.innerWidth < 768 ? '✅' : '❌'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 