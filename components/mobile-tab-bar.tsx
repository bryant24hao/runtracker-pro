"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ActivityIcon, Target, Calendar, BarChart, Settings } from "lucide-react"

interface MobileTabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function MobileTabBar({ activeTab, onTabChange }: MobileTabBarProps) {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase()
    setIsIOS(/iphone|ipad|ipod/.test(userAgent))
    }
  }, [])

  const tabs = [
    { id: "dashboard", label: "仪表盘", icon: ActivityIcon },
    { id: "goals", label: "目标", icon: Target },
    { id: "activities", label: "活动", icon: Calendar },
    { id: "fitness", label: "Fitness", icon: BarChart },
    { id: "history", label: "历史", icon: Settings },
  ]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-white border-t pb-safe-bottom",
        "flex items-center justify-around",
        isIOS ? "shadow-[0_-1px_0_rgba(0,0,0,0.1)]" : "shadow-md",
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id

        return (
          <button
            key={tab.id}
            className={cn(
              "flex flex-1 flex-col items-center justify-center py-2",
              "transition-colors duration-200",
              isActive ? "text-blue-600" : "text-gray-500",
            )}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon className={cn("h-6 w-6", isActive && "text-blue-600")} />
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
