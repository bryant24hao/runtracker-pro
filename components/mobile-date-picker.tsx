"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface MobileDatePickerProps {
  date: Date
  onDateChange: (date: Date) => void
  label?: string
  className?: string
}

export function MobileDatePicker({ date, onDateChange, label = "日期", className }: MobileDatePickerProps) {
  const [isNativePicker, setIsNativePicker] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 检测是否支持原生日期选择器
  const supportsDateInput = () => {
    const input = document.createElement("input")
    input.setAttribute("type", "date")
    return input.type === "date"
  }

  // 格式化日期为 YYYY-MM-DD 格式（HTML date input 需要的格式）
  const formatDateForInput = (date: Date) => {
    return format(date, "yyyy-MM-dd")
  }

  // 格式化显示日期，带错误处理
  const formatDisplayDate = (date: Date) => {
    try {
      return format(date, "yyyy年M月d日 EEEE", { locale: zhCN })
    } catch (error) {
      console.error('Date formatting error:', error)
      return "日期格式错误"
    }
  }

  // 处理原生日期输入的变化
  const handleNativeDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value)
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate)
    }
  }

  // 手动日期选择器
  const ManualDatePicker = () => {
    const [year, setYear] = useState(date.getFullYear())
    const [month, setMonth] = useState(date.getMonth() + 1)
    const [day, setDay] = useState(date.getDate())

    const handleDateUpdate = (newYear: number, newMonth: number, newDay: number) => {
      const newDate = new Date(newYear, newMonth - 1, newDay)
      if (!isNaN(newDate.getTime())) {
        onDateChange(newDate)
      }
    }

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const daysInMonth = new Date(year, month, 0).getDate()
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label className="text-xs">年</Label>
            <select
              value={year}
              onChange={(e) => {
                const newYear = Number.parseInt(e.target.value)
                setYear(newYear)
                handleDateUpdate(newYear, month, day)
              }}
              className="w-full p-2 border rounded-md text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">月</Label>
            <select
              value={month}
              onChange={(e) => {
                const newMonth = Number.parseInt(e.target.value)
                setMonth(newMonth)
                handleDateUpdate(year, newMonth, day)
              }}
              className="w-full p-2 border rounded-md text-sm"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">日</Label>
            <select
              value={day}
              onChange={(e) => {
                const newDay = Number.parseInt(e.target.value)
                setDay(newDay)
                handleDateUpdate(year, month, newDay)
              }}
              className="w-full p-2 border rounded-md text-sm"
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  {d}日
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>

      {/* 显示当前选择的日期 */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
        <CalendarIcon className="h-4 w-4 text-gray-500" />
        <span className="font-medium" suppressHydrationWarning>
          {isClient ? formatDisplayDate(date) : "选择日期"}
        </span>
      </div>

      {/* 原生日期选择器（如果支持） */}
      {supportsDateInput() && (
        <div className="space-y-2">
          <Input type="date" value={formatDateForInput(date)} onChange={handleNativeDateChange} className="w-full" />
        </div>
      )}

      {/* 手动日期选择器 */}
      <ManualDatePicker />

      {/* 快速选择按钮 */}
      <div className="flex gap-2 flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => onDateChange(new Date())} className="text-xs">
          今天
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const yesterday = new Date()
            yesterday.setDate(yesterday.getDate() - 1)
            onDateChange(yesterday)
          }}
          className="text-xs"
        >
          昨天
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            const lastWeek = new Date()
            lastWeek.setDate(lastWeek.getDate() - 7)
            onDateChange(lastWeek)
          }}
          className="text-xs"
        >
          一周前
        </Button>
      </div>
    </div>
  )
}
