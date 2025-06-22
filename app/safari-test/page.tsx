"use client"

import { useState, useEffect } from "react"

export default function SafariTestPage() {
  const [mounted, setMounted] = useState(false)
  const [info, setInfo] = useState<string>("")

  useEffect(() => {
    setMounted(true)
    
    try {
      const ua = navigator.userAgent || "Unknown"
      const platform = navigator.platform || "Unknown"
      const vendor = navigator.vendor || "Unknown"
      
      const deviceInfo = {
        isSafari: /Safari/.test(ua) && !/Chrome/.test(ua),
        isIOS: /iPad|iPhone|iPod/.test(platform) || /iPad|iPhone|iPod/.test(ua),
        isWebKit: /WebKit/.test(ua),
        hasTouch: 'ontouchstart' in window,
        width: window.innerWidth,
        height: window.innerHeight,
        userAgent: ua.substring(0, 50) + "..."
      }
      
      setInfo(JSON.stringify(deviceInfo, null, 2))
      
      console.log("Safari Test - Device Info:", deviceInfo)
    } catch (error) {
      console.error("Safari Test Error:", error)
      setInfo("Error: " + error)
    }
  }, [])

  if (!mounted) {
    return (
      <div style={{ 
        padding: '20px', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh'
      }}>
        <h1>加载中...</h1>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      backgroundColor: '#f0f0f0',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>Safari兼容性测试</h1>
      
      <div style={{ 
        backgroundColor: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>设备信息</h2>
        <pre style={{ 
          fontSize: '12px', 
          overflow: 'auto',
          backgroundColor: '#f8f8f8',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
          {info}
        </pre>
      </div>

      <div style={{ 
        backgroundColor: 'white', 
        padding: '15px', 
        borderRadius: '8px',
        marginBottom: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#666', marginBottom: '10px' }}>功能测试</h2>
        
        <button 
          style={{
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            marginRight: '10px',
            marginBottom: '10px',
            cursor: 'pointer'
          }}
          onClick={() => {
            alert('按钮点击测试成功！')
          }}
        >
          测试按钮
        </button>

        <button 
          style={{
            backgroundColor: '#34C759',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            marginRight: '10px',
            marginBottom: '10px',
            cursor: 'pointer'
          }}
          onClick={async () => {
            try {
              const response = await fetch('/api/test-delete')
              const data = await response.json()
              alert('API测试成功: ' + JSON.stringify(data))
            } catch (error) {
              alert('API测试失败: ' + error)
            }
          }}
        >
          测试API
        </button>

        <div style={{ marginTop: '15px' }}>
          <a 
            href="/" 
            style={{
              color: '#007AFF',
              textDecoration: 'none',
              fontSize: '16px',
              padding: '10px',
              border: '1px solid #007AFF',
              borderRadius: '8px',
              display: 'inline-block'
            }}
          >
            返回主应用
          </a>
        </div>
      </div>

      <div style={{ 
        backgroundColor: '#FFE5E5', 
        padding: '15px', 
        borderRadius: '8px',
        border: '1px solid #FFB3B3'
      }}>
        <h3 style={{ color: '#D32F2F', margin: '0 0 10px 0' }}>如果主应用无法打开：</h3>
        <p style={{ margin: '0', color: '#666' }}>
          1. 清除Safari浏览器缓存<br/>
          2. 重启Safari浏览器<br/>
          3. 检查网络连接<br/>
          4. 尝试刷新页面
        </p>
      </div>
    </div>
  )
} 