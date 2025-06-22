"use client"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { MapPin, Timer, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

// 安全的数字格式化函数
const safeToFixed = (value: any, digits: number = 1): string => {
  if (value === null || value === undefined || value === '') {
    return "0"
  }
  const num = Number(value)
  if (isNaN(num)) {
    return "0"
  }
  return num.toFixed(digits)
}

interface ActivityListItemProps {
  activity: {
    id: string
    date: Date
    distance: number
    duration: number
    pace: number
    location?: string
    notes?: string
    images?: string[]
  }
  onClick?: () => void
}

export function ActivityListItem({ activity, onClick }: ActivityListItemProps) {
  const [isClient, setIsClient] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatDate = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) {
        return "日期无效"
      }
      return format(dateObj, "M月d日 EEEE", { locale: zhCN })
    } catch (error) {
      console.error('Date formatting error:', error)
      return "日期格式错误"
    }
  }

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
        "active:bg-gray-50 transition-colors duration-150",
        "mb-3",
      )}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-base">{activity.distance} km</h3>
              <Badge variant="outline" className="font-medium">
                {safeToFixed(activity.pace, 1)} 配速
              </Badge>
            </div>

            <p className="text-sm text-gray-500" suppressHydrationWarning>
              {isClient ? formatDate(activity.date) : "加载中..."}
            </p>

            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-gray-600">
                <Timer className="h-4 w-4 mr-1" />
                <span className="text-sm">{activity.duration} 分钟</span>
              </div>

              {activity.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm truncate max-w-[150px]">{activity.location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {activity.notes && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{activity.notes}</p>}

        {activity.images && activity.images.length > 0 && (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {activity.images.map((image, index) => (
              <img
                key={index}
                src={image || "/placeholder.svg"}
                alt={`活动图片 ${index + 1}`}
                className="h-16 w-16 object-cover rounded-md flex-shrink-0"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
