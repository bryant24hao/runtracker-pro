"use client"

import { useState, useEffect, type ReactNode } from "react"
import { ChevronLeft, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

interface MobileLayoutProps {
  children: ReactNode
  title?: string
  showBackButton?: boolean
  onBack?: () => void
  className?: string
}

export function MobileLayout({
  children,
  title = "RunTracker Pro",
  showBackButton = false,
  onBack,
  className,
}: MobileLayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  // 检测是否为iOS设备
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent.toLowerCase()
      setIsIOS(/iphone|ipad|ipod/.test(userAgent))

      const handleScroll = () => {
        setIsScrolled(window.scrollY > 10)
      }

      window.addEventListener("scroll", handleScroll)
      return () => window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <div
      className={cn("min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-100", isIOS && "pb-safe-bottom", className)}
    >
      {/* iOS风格的顶部导航栏 */}
      <header
        className={cn(
          "sticky top-0 z-40 w-full pt-safe-top",
          "transition-all duration-200",
          isScrolled ? "bg-white/80 backdrop-blur-md border-b shadow-sm" : "bg-transparent",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center">
            {showBackButton ? (
              <Button variant="ghost" size="icon" className="mr-2 rounded-full" onClick={onBack}>
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">返回</span>
              </Button>
            ) : (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">菜单</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="pt-safe w-[80%] max-w-[300px]">
                  <SheetHeader>
                    <SheetTitle>RunTracker Pro</SheetTitle>
                  </SheetHeader>
                  <MobileNavigation />
                </SheetContent>
              </Sheet>
            )}
          </div>

          <div className="text-lg font-semibold">{title}</div>

          <div className="w-10">{/* 占位，保持标题居中 */}</div>
        </div>
      </header>

      {/* 主内容区域 */}
      <main className="px-4 pb-24 pt-4">{children}</main>
    </div>
  )
}

function MobileNavigation() {
  const navItems = [
    { name: "仪表盘", href: "#dashboard" },
    { name: "目标", href: "#goals" },
    { name: "活动", href: "#activities" },
    { name: "Apple Fitness", href: "#fitness" },
    { name: "历史", href: "#history" },
    { name: "设置", href: "#settings" },
  ]

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 py-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.name}>
              <a href={item.href} className="flex items-center px-2 py-3 rounded-lg hover:bg-gray-100">
                <span className="text-base">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t py-4">
        <p className="text-sm text-gray-500 text-center">版本 1.0.0</p>
      </div>
    </div>
  )
}
