"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Target,
  Plus,
  ActivityIcon,
  CalendarIcon,
  Clock,
  MapPin,
  TrendingUp,
  Award,
  Timer,
  Zap,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { SmartDataRecognition } from "@/components/smart-data-recognition"
import { AppleFitnessIntegration } from "@/components/apple-fitness-integration"
import { MobileLayout } from "@/components/mobile-layout"
import { MobileTabBar } from "@/components/mobile-tab-bar"
import { ActivityListItem } from "@/components/activity-list-item"
import { GoalCardIOS } from "@/components/goal-card-ios"
import { IOSCard, IOSCardHeader, IOSCardContent } from "@/components/ios-card"
import { MobileDatePicker } from "@/components/mobile-date-picker"
import { ErrorBoundary } from "@/components/error-boundary"
import { goalsApi, activitiesApi, statsApi } from "@/lib/api"
import type { CreateGoalRequest, CreateActivityRequest } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

interface ClientGoal {
  id: string
  title: string
  type: "distance" | "time" | "frequency"
  target: number
  current: number
  unit: string
  deadline: Date
  description?: string
  status: "active" | "completed" | "paused"
}

interface ClientActivity {
  id: string
  date: Date
  distance: number
  duration: number // in minutes
  pace: number // minutes per km
  location?: string
  notes?: string
  images?: string[] // base64 encoded images
}

// Helper function to safely parse activity images
const parseActivityImages = (images: any): string[] => {
  if (!images) return []
  if (Array.isArray(images)) return images
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

// Helper function for safe date formatting
const formatDate = (date: Date | string, formatString: string, useLocale: boolean = false) => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) {
      return "日期无效"
    }
    const options = useLocale ? { locale: zhCN } : {}
    return format(dateObj, formatString, options)
  } catch (error) {
    console.error('Date formatting error:', error)
    return "日期格式错误"
  }
}

// Helper function for safe number formatting
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

export default function RunningGoalApp() {
  const { toast } = useToast()
  const [isMobile, setIsMobile] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [goals, setGoals] = useState<ClientGoal[]>([])
  const [activities, setActivities] = useState<ClientActivity[]>([])
  const [stats, setStats] = useState({ totalDistance: 0, totalTime: 0, totalRuns: 0, avgPace: 0 })
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false)
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<ClientActivity | null>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [isEditGoalDialogOpen, setIsEditGoalDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<ClientGoal | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Safari兼容的客户端初始化
  useEffect(() => {
    // 立即设置客户端状态，避免Safari延迟问题
    setIsClient(true)
    
    const detectMobile = () => {
      try {
        // Safari兼容的移动端检测
        const ua = navigator.userAgent || ""
        const vendor = navigator.vendor || ""
        const platform = navigator.platform || ""
        
        // 检测iOS设备 (包括Safari的特殊情况)
        const isIOS = /iPad|iPhone|iPod/.test(platform) || 
                     /iPad|iPhone|iPod/.test(ua) ||
                     (platform === 'MacIntel' && navigator.maxTouchPoints > 1) // iPad在Safari中伪装成Mac
        
        // 检测Android
        const isAndroid = /Android/.test(ua)
        
        // 检测其他移动设备
        const isOtherMobile = /Mobile|Opera Mini|webOS|BlackBerry|IEMobile/i.test(ua)
        
        // 屏幕尺寸检测 (Safari兼容)
        const screenWidth = window.screen?.width || window.innerWidth || 0
        const isSmallScreen = screenWidth < 768
        
        // Touch支持检测
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        
        const isMobileDevice = isIOS || isAndroid || isOtherMobile || (isSmallScreen && hasTouch)
        
        console.log("🔍 Mobile Detection:", {
          isIOS,
          isAndroid, 
          isOtherMobile,
          isSmallScreen,
          hasTouch,
          isMobileDevice,
          ua: ua.substring(0, 100),
          platform,
          vendor,
          screenWidth
        })
        
        setIsMobile(isMobileDevice)
      } catch (error) {
        console.error("Error in mobile detection:", error)
        // 失败时默认为小屏幕设备
        setIsMobile(window.innerWidth < 768)
      }
    }

    // 立即检测，不使用setTimeout
    detectMobile()
    
    // 监听resize事件
    const handleResize = () => {
      detectMobile()
    }
    
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 加载数据
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)

      // 并行加载所有数据
      const [goalsData, activitiesData, statsData] = await Promise.all([
        goalsApi.getAll(),
        activitiesApi.getAll(),
        statsApi.get(),
      ])

      // 转换目标数据格式
      const clientGoals: ClientGoal[] = goalsData.map((goal) => ({
        id: goal.id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        current: goal.current_value,
        unit: goal.unit,
        deadline: new Date(goal.deadline),
        description: goal.description,
        status: goal.status,
      }))

      // 转换活动数据格式
      const clientActivities: ClientActivity[] = activitiesData.map((activity) => ({
        id: activity.id,
        date: new Date(activity.date),
        distance: activity.distance,
        duration: activity.duration,
        pace: activity.pace,
        location: activity.location,
        notes: activity.notes,
        images: parseActivityImages(activity.images),
      }))

      setGoals(clientGoals)
      setActivities(clientActivities)
      setStats({
        totalDistance: statsData.overall.totalDistance,
        totalTime: statsData.overall.totalTime,
        totalRuns: statsData.overall.totalRuns,
        avgPace: statsData.overall.avgPace,
      })
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "加载失败",
        description: "无法加载数据，请刷新页面重试",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addGoal = async (goalData: Omit<ClientGoal, "id" | "current" | "status">) => {
    try {
      const createRequest: CreateGoalRequest = {
        title: goalData.title,
        type: goalData.type,
        target: goalData.target,
        unit: goalData.unit,
        deadline: goalData.deadline.toISOString().split("T")[0],
        description: goalData.description,
      }

      const newGoal = await goalsApi.create(createRequest)

      const clientGoal: ClientGoal = {
        id: newGoal.id,
        title: newGoal.title,
        type: newGoal.type,
        target: newGoal.target,
        current: newGoal.current_value,
        unit: newGoal.unit,
        deadline: new Date(newGoal.deadline),
        description: newGoal.description,
        status: newGoal.status,
      }

      setGoals((prev) => [...prev, clientGoal])
      setIsGoalDialogOpen(false)

      // 重新加载统计数据
      try {
        const statsData = await statsApi.get()
        setStats({
          totalDistance: statsData.overall.totalDistance,
          totalTime: statsData.overall.totalTime,
          totalRuns: statsData.overall.totalRuns,
          avgPace: statsData.overall.avgPace,
        })
      } catch (error) {
        console.error("Error updating stats:", error)
      }

      toast({
        title: "目标创建成功",
        description: `目标"${newGoal.title}"已创建`,
      })
    } catch (error) {
      console.error("Error creating goal:", error)
      toast({
        title: "创建失败",
        description: "无法创建目标，请重试",
        variant: "destructive",
      })
    }
  }

  const addActivity = async (activityData: Omit<ClientActivity, "id">) => {
    try {
      const createRequest: CreateActivityRequest = {
        date: activityData.date.toISOString().split("T")[0],
        distance: activityData.distance,
        duration: activityData.duration,
        pace: activityData.pace,
        location: activityData.location,
        notes: activityData.notes,
        images: activityData.images,
      }

      const newActivity = await activitiesApi.create(createRequest)

      const clientActivity: ClientActivity = {
        id: newActivity.id,
        date: new Date(newActivity.date),
        distance: newActivity.distance,
        duration: newActivity.duration,
        pace: newActivity.pace,
        location: newActivity.location,
        notes: newActivity.notes,
        images: parseActivityImages(newActivity.images),
      }

      setActivities((prev) => [...prev, clientActivity])
      setIsActivityDialogOpen(false)

      // 重新加载目标数据以更新进度
      const goalsData = await goalsApi.getAll()
      const clientGoals: ClientGoal[] = goalsData.map((goal) => ({
        id: goal.id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        current: goal.current_value,
        unit: goal.unit,
        deadline: new Date(goal.deadline),
        description: goal.description,
        status: goal.status,
      }))
      setGoals(clientGoals)

      // 重新加载统计数据
      const statsData = await statsApi.get()
      setStats({
        totalDistance: statsData.overall.totalDistance,
        totalTime: statsData.overall.totalTime,
        totalRuns: statsData.overall.totalRuns,
        avgPace: statsData.overall.avgPace,
      })

      toast({
        title: "活动记录成功",
        description: "跑步活动已记录，目标进度已更新",
      })
    } catch (error) {
      console.error("Error creating activity:", error)
      toast({
        title: "记录失败",
        description: "无法记录活动，请重试",
        variant: "destructive",
      })
    }
  }

  const handleAppleFitnessImport = async (importedWorkouts: any[]) => {
    try {
      const promises = importedWorkouts.map(async (workout) => {
        const createRequest: CreateActivityRequest = {
          date: workout.date.toISOString().split("T")[0],
          distance: workout.distance,
          duration: workout.duration,
          pace: workout.pace,
          location: workout.location,
          notes: workout.notes,
          images: workout.images || [],
        }
        return activitiesApi.create(createRequest)
      })

      await Promise.all(promises)

      // 重新加载数据
      await loadData()

      toast({
        title: "导入成功",
        description: `成功从Apple Fitness导入 ${importedWorkouts.length} 条跑步记录！`,
      })
    } catch (error) {
      console.error("导入Apple Fitness数据时出错:", error)
      toast({
        title: "导入失败",
        description: "导入数据时出现错误，请重试",
        variant: "destructive",
      })
    }
  }

  const updateActivity = async (updatedActivity: ClientActivity) => {
    try {
      const updateRequest = {
        date: updatedActivity.date.toISOString().split("T")[0],
        distance: updatedActivity.distance,
        duration: updatedActivity.duration,
        pace: updatedActivity.pace,
        location: updatedActivity.location,
        notes: updatedActivity.notes,
        images: updatedActivity.images,
      }

      await activitiesApi.update(updatedActivity.id, updateRequest)

      setActivities((prev) => prev.map((activity) => (activity.id === updatedActivity.id ? updatedActivity : activity)))

      // 重新加载目标数据以更新进度
      const goalsData = await goalsApi.getAll()
      const clientGoals: ClientGoal[] = goalsData.map((goal) => ({
        id: goal.id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        current: goal.current_value,
        unit: goal.unit,
        deadline: new Date(goal.deadline),
        description: goal.description,
        status: goal.status,
      }))
      setGoals(clientGoals)

      // 重新加载统计数据
      const statsData = await statsApi.get()
      setStats({
        totalDistance: statsData.overall.totalDistance,
        totalTime: statsData.overall.totalTime,
        totalRuns: statsData.overall.totalRuns,
        avgPace: statsData.overall.avgPace,
      })

      setIsEditDialogOpen(false)
      setEditingActivity(null)

      toast({
        title: "更新成功",
        description: "活动记录已更新",
      })
    } catch (error) {
      console.error("Error updating activity:", error)
      toast({
        title: "更新失败",
        description: "无法更新活动记录，请重试",
        variant: "destructive",
      })
    }
  }

  const deleteActivity = async (activityId: string) => {
    const confirmed = confirm("确定要删除这条跑步记录吗？")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete activity")
      }

      setActivities((prev) => prev.filter((activity) => activity.id !== activityId))

      // 重新加载目标数据以更新进度
      const goalsData = await goalsApi.getAll()
      const clientGoals: ClientGoal[] = goalsData.map((goal) => ({
        id: goal.id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        current: goal.current_value,
        unit: goal.unit,
        deadline: new Date(goal.deadline),
        description: goal.description,
        status: goal.status,
      }))
      setGoals(clientGoals)

      // 重新加载统计数据
      const statsData = await statsApi.get()
      setStats({
        totalDistance: statsData.overall.totalDistance,
        totalTime: statsData.overall.totalTime,
        totalRuns: statsData.overall.totalRuns,
        avgPace: statsData.overall.avgPace,
      })

      toast({
        title: "删除成功",
        description: "跑步记录已删除",
      })
    } catch (error) {
      console.error("Error deleting activity:", error)
      toast({
        title: "删除失败",
        description: "无法删除记录，请重试",
        variant: "destructive",
      })
    }
  }

  const updateGoal = async (updatedGoal: ClientGoal) => {
    try {
      const updateRequest = {
        title: updatedGoal.title,
        type: updatedGoal.type,
        target: updatedGoal.target,
        unit: updatedGoal.unit,
        deadline: updatedGoal.deadline.toISOString().split("T")[0],
        description: updatedGoal.description,
        status: updatedGoal.status,
      }

      const response = await fetch(`/api/goals/${updatedGoal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateRequest),
      })

      if (!response.ok) {
        throw new Error("Failed to update goal")
      }

      const { goal } = await response.json()

      const clientGoal: ClientGoal = {
        id: goal.id,
        title: goal.title,
        type: goal.type,
        target: goal.target,
        current: goal.current_value,
        unit: goal.unit,
        deadline: new Date(goal.deadline),
        description: goal.description,
        status: goal.status,
      }

      setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? clientGoal : g)))
      setIsEditGoalDialogOpen(false)
      setEditingGoal(null)

      // 重新加载统计数据
      try {
        const statsData = await statsApi.get()
        setStats({
          totalDistance: statsData.overall.totalDistance,
          totalTime: statsData.overall.totalTime,
          totalRuns: statsData.overall.totalRuns,
          avgPace: statsData.overall.avgPace,
        })
      } catch (error) {
        console.error("Error updating stats:", error)
      }

      toast({
        title: "更新成功",
        description: "目标已更新",
      })
    } catch (error) {
      console.error("Error updating goal:", error)
      toast({
        title: "更新失败",
        description: "无法更新目标，请重试",
        variant: "destructive",
      })
    }
  }

  const deleteGoal = async (goalId: string) => {
    const confirmed = confirm("确定要删除这个目标吗？")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete goal")
      }

      setGoals((prev) => prev.filter((goal) => goal.id !== goalId))

      // 重新加载统计数据
      try {
        const statsData = await statsApi.get()
        setStats({
          totalDistance: statsData.overall.totalDistance,
          totalTime: statsData.overall.totalTime,
          totalRuns: statsData.overall.totalRuns,
          avgPace: statsData.overall.avgPace,
        })
      } catch (error) {
        console.error("Error updating stats:", error)
      }

      toast({
        title: "删除成功",
        description: "目标已删除",
      })
    } catch (error) {
      console.error("Error deleting goal:", error)
      toast({
        title: "删除失败",
        description: "无法删除目标，请重试",
        variant: "destructive",
      })
    }
  }

  const getProgressPercentage = (goal: ClientGoal) => {
    return Math.min((goal.current / goal.target) * 100, 100)
  }

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 p-8">
          <div className="w-16 h-16 mx-auto">
            <svg className="animate-spin h-16 w-16 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-700">正在初始化应用...</p>
          <p className="text-sm text-gray-500">请稍等片刻</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4 p-8">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600" />
          <p className="text-lg font-medium text-gray-700">加载数据中...</p>
          <p className="text-sm text-gray-500">正在获取您的跑步数据</p>
        </div>
      </div>
    )
  }

  // 移动端渲染
  if (isMobile) {
    console.log("🔍 Rendering mobile version", { isMobile, isClient, isLoading })
    
    return (
      <ErrorBoundary>
        <div className="mobile-app-wrapper">
          <MobileLayout
          title={
            activeTab === "dashboard"
              ? "RunTracker Pro"
              : activeTab === "goals"
                ? "跑步目标"
                : activeTab === "activities"
                  ? "跑步记录"
                  : activeTab === "fitness"
                    ? "Apple Fitness"
                    : "跑步历史"
          }
        >
          {/* 仪表盘 */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-2 gap-3">
                <IOSCard className="bg-blue-50 border-blue-100">
                  <IOSCardContent className="p-3">
                    <div className="flex flex-col items-center">
                      <MapPin className="h-6 w-6 text-blue-600 mb-1" />
                      <p className="text-xl font-bold">{safeToFixed(stats.totalDistance, 1)}</p>
                      <p className="text-xs text-gray-600">总距离 (km)</p>
                    </div>
                  </IOSCardContent>
                </IOSCard>

                <IOSCard className="bg-green-50 border-green-100">
                  <IOSCardContent className="p-3">
                    <div className="flex flex-col items-center">
                      <Clock className="h-6 w-6 text-green-600 mb-1" />
                      <p className="text-xl font-bold">
                        {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
                      </p>
                      <p className="text-xs text-gray-600">总时长</p>
                    </div>
                  </IOSCardContent>
                </IOSCard>

                <IOSCard className="bg-orange-50 border-orange-100">
                  <IOSCardContent className="p-3">
                    <div className="flex flex-col items-center">
                      <Zap className="h-6 w-6 text-orange-600 mb-1" />
                      <p className="text-xl font-bold">{stats.totalRuns}</p>
                      <p className="text-xs text-gray-600">总跑步次数</p>
                    </div>
                  </IOSCardContent>
                </IOSCard>

                <IOSCard className="bg-purple-50 border-purple-100">
                  <IOSCardContent className="p-3">
                    <div className="flex flex-col items-center">
                      <Timer className="h-6 w-6 text-purple-600 mb-1" />
                      <p className="text-xl font-bold">{safeToFixed(stats.avgPace, 1)}</p>
                      <p className="text-xs text-gray-600">平均配速 (min/km)</p>
                    </div>
                  </IOSCardContent>
                </IOSCard>
              </div>

              {/* 活跃目标 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">活跃目标</h2>
                  <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => setActiveTab("goals")}>
                    查看全部
                  </Button>
                </div>

                {goals
                  .filter((goal) => goal.status === "active")
                  .slice(0, 2)
                  .map((goal) => (
                    <GoalCardIOS 
                      key={goal.id} 
                      goal={goal} 
                      onEdit={(goal) => {
                        setEditingGoal(goal)
                        setIsEditGoalDialogOpen(true)
                      }}
                      onDelete={deleteGoal}
                    />
                  ))}

                {goals.filter((goal) => goal.status === "active").length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">没有活跃目标，创建一个开始吧！</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsGoalDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      添加目标
                    </Button>
                  </div>
                )}
              </div>

              {/* 最近活动 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold">最近活动</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600"
                    onClick={() => setActiveTab("activities")}
                  >
                    查看全部
                  </Button>
                </div>

                {activities
                  .slice(-2)
                  .reverse()
                  .map((activity) => (
                    <ActivityListItem
                      key={activity.id}
                      activity={activity}
                      onClick={() => {
                        setEditingActivity(activity)
                        setIsEditDialogOpen(true)
                      }}
                    />
                  ))}

                {activities.length === 0 && (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <p className="text-gray-500">没有记录活动，记录你的第一次跑步！</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsActivityDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      记录跑步
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 其他标签页内容保持不变... */}
          {/* 目标页面 */}
          {activeTab === "goals" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">跑步目标</h2>
                <Button size="sm" onClick={() => setIsGoalDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加目标
                </Button>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => (
                  <GoalCardIOS 
                    key={goal.id} 
                    goal={goal} 
                    onEdit={(goal) => {
                      setEditingGoal(goal)
                      setIsEditGoalDialogOpen(true)
                    }}
                    onDelete={deleteGoal}
                  />
                ))}

                {goals.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-2">还没有设置跑步目标</p>
                    <Button onClick={() => setIsGoalDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      创建第一个目标
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 活动页面 */}
          {activeTab === "activities" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">跑步记录</h2>
                <Button size="sm" onClick={() => setIsActivityDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  记录跑步
                </Button>
              </div>

              <div className="space-y-3">
                {activities
                  .slice()
                  .reverse()
                  .map((activity) => (
                    <ActivityListItem
                      key={activity.id}
                      activity={activity}
                      onClick={() => {
                        setEditingActivity(activity)
                        setIsEditDialogOpen(true)
                      }}
                    />
                  ))}

                {activities.length === 0 && (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <p className="text-gray-500 mb-2">还没有记录跑步活动</p>
                    <Button onClick={() => setIsActivityDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      记录第一次跑步
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Apple Fitness页面 */}
          {activeTab === "fitness" && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Apple Fitness 集成</h2>
              <AppleFitnessIntegration onDataImported={handleAppleFitnessImport} />
            </div>
          )}

          {/* 历史页面 */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">跑步历史</h2>

              <IOSCard>
                <IOSCardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">表现趋势</h3>
                  </div>
                </IOSCardHeader>
                <IOSCardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>最佳配速</span>
                      <span className="font-medium">
                        {activities.length > 0 ? safeToFixed(Math.min(...activities.map((a) => a.pace)), 1) : "0"} min/km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>最长距离</span>
                      <span className="font-medium">
                        {activities.length > 0 ? safeToFixed(Math.max(...activities.map((a) => a.distance)), 1) : "0"} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>最长时间</span>
                      <span className="font-medium">
                        {activities.length > 0 ? Math.max(...activities.map((a) => a.duration)) : "0"} min
                      </span>
                    </div>
                  </div>
                </IOSCardContent>
              </IOSCard>

              <IOSCard>
                <IOSCardHeader>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold">成就</h3>
                  </div>
                </IOSCardHeader>
                <IOSCardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">完成的目标</p>
                      <p className="text-sm text-gray-600">
                        {goals.filter((g) => g.status === "completed").length} 个目标达成
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <ActivityIcon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">总活动次数</p>
                      <p className="text-sm text-gray-600">{activities.length} 次跑步</p>
                    </div>
                  </div>
                </IOSCardContent>
              </IOSCard>
            </div>
          )}
        </MobileLayout>

        {/* 底部导航栏 */}
        <MobileTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 对话框组件保持不变... */}
        {/* 添加目标对话框 */}
        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>创建新目标</DialogTitle>
              <DialogDescription>设置一个新的跑步目标来追踪你的进度</DialogDescription>
            </DialogHeader>
            <GoalForm onSubmit={addGoal} isMobile={isMobile} />
          </DialogContent>
        </Dialog>

        {/* 添加活动对话框 */}
        <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>记录跑步活动</DialogTitle>
              <DialogDescription>记录你最新的跑步数据</DialogDescription>
            </DialogHeader>
            <ActivityForm onSubmit={addActivity} isMobile={isMobile} />
          </DialogContent>
        </Dialog>

        {/* 编辑活动对话框 */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑跑步记录</DialogTitle>
              <DialogDescription>修改您的跑步数据</DialogDescription>
            </DialogHeader>
            {editingActivity && (
              <ActivityForm
                onSubmit={(activityData) => {
                  const updatedActivity: ClientActivity = {
                    ...activityData,
                    id: editingActivity.id,
                  }
                  updateActivity(updatedActivity)
                }}
                initialData={editingActivity}
                isEditing={true}
                isMobile={isMobile}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* 编辑目标对话框 */}
        <Dialog open={isEditGoalDialogOpen} onOpenChange={setIsEditGoalDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑目标</DialogTitle>
              <DialogDescription>修改您的跑步目标</DialogDescription>
            </DialogHeader>
            {editingGoal && (
              <GoalForm
                onSubmit={(goalData) => {
                  const updatedGoal: ClientGoal = {
                    ...goalData,
                    id: editingGoal.id,
                    current: editingGoal.current,
                    status: editingGoal.status,
                  }
                  updateGoal(updatedGoal)
                }}
                initialData={editingGoal}
                isEditing={true}
                isMobile={isMobile}
              />
            )}
          </DialogContent>
        </Dialog>
        </div>
      </ErrorBoundary>
    )
  }

  // 桌面端渲染保持类似结构，但使用API数据...
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-2">
              <ActivityIcon className="h-8 w-8 text-blue-600" />
              RunTracker Pro
            </h1>
            <p className="text-gray-600">Track your running goals and achieve new milestones</p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{safeToFixed(stats.totalDistance, 1)}</p>
                    <p className="text-sm text-gray-600">Total Distance (km)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.floor(stats.totalTime / 60)}h {stats.totalTime % 60}m
                    </p>
                    <p className="text-sm text-gray-600">Total Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{stats.totalRuns}</p>
                    <p className="text-sm text-gray-600">Total Runs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Timer className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{safeToFixed(stats.avgPace, 1)}</p>
                    <p className="text-sm text-gray-600">Avg Pace (min/km)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="dashboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="fitness">Apple Fitness</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Goals */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Active Goals
                    </CardTitle>
                    <CardDescription>Your current running objectives</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goals
                      .filter((goal) => goal.status === "active")
                      .slice(0, 3)
                      .map((goal) => (
                        <div key={goal.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{goal.title}</h4>
                            <Badge variant="outline">
                              {safeToFixed(goal.current, 1)}/{goal.target} {goal.unit}
                            </Badge>
                          </div>
                          <Progress value={getProgressPercentage(goal)} className="h-2" />
                          <p className="text-sm text-gray-600">Due: {format(goal.deadline, "MMM dd, yyyy")}</p>
                        </div>
                      ))}
                    {goals.filter((goal) => goal.status === "active").length === 0 && (
                      <p className="text-gray-500 text-center py-4">No active goals. Create one to get started!</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ActivityIcon className="h-5 w-5" />
                      Recent Activities
                    </CardTitle>
                    <CardDescription>Your latest running sessions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activities
                      .slice(-3)
                      .reverse()
                      .map((activity) => (
                        <div key={activity.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{activity.distance}km run</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(activity.date, "MMM dd")} • {activity.duration}min • {safeToFixed(activity.pace, 1)}{" "}
                              min/km
                            </p>
                          </div>
                          <Badge variant="secondary">{safeToFixed(activity.pace, 1)} pace</Badge>
                        </div>
                      ))}
                    {activities.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No activities yet. Log your first run!</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Goals Tab */}
            <TabsContent value="goals" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Running Goals</h2>
                <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Goal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Goal</DialogTitle>
                      <DialogDescription>Set a new running goal to track your progress</DialogDescription>
                    </DialogHeader>
                    <GoalForm onSubmit={addGoal} isMobile={isMobile} />
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => (
                  <Card key={goal.id} className={goal.status === "completed" ? "border-green-200 bg-green-50" : ""}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                          {goal.description && <CardDescription>{goal.description}</CardDescription>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={goal.status === "completed" ? "default" : "secondary"}>{goal.status}</Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                setEditingGoal(goal)
                                setIsEditGoalDialogOpen(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => deleteGoal(goal.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>
                            {safeToFixed(goal.current, 1)}/{goal.target} {goal.unit}
                          </span>
                        </div>
                        <Progress value={getProgressPercentage(goal)} className="h-2" />
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Deadline</span>
                        <span>{formatDate(goal.deadline, "MMM dd, yyyy")}</span>
                      </div>
                      {goal.status === "completed" && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium">Goal Achieved!</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Activities Tab */}
            <TabsContent value="activities" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Log Activity</h2>
                <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Run
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Log Running Activity</DialogTitle>
                      <DialogDescription>Record your latest running session</DialogDescription>
                    </DialogHeader>
                    <ActivityForm onSubmit={addActivity} isMobile={isMobile} />
                  </DialogContent>
                </Dialog>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Your running history</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activities
                      .slice()
                      .reverse()
                      .map((activity) => (
                        <div key={activity.id} className="flex justify-between items-start p-4 border rounded-lg">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-4">
                              <h4 className="font-medium">{activity.distance}km Run</h4>
                              <Badge variant="outline">{safeToFixed(activity.pace, 1)} min/km</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatDate(activity.date, "EEEE, MMM dd, yyyy", true)} • {activity.duration} minutes
                            </p>
                            {activity.location && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {activity.location}
                              </p>
                            )}
                            {activity.notes && <p className="text-sm text-gray-600 italic">{activity.notes}</p>}
                            {activity.images && activity.images.length > 0 && (
                              <div className="mt-3">
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                  {activity.images.map((image, index) => (
                                    <img
                                      key={index}
                                      src={image || "/placeholder.svg"}
                                      alt={`Run photo ${index + 1}`}
                                      className="h-20 w-20 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                      onClick={() => {
                                        const modal = document.createElement("div")
                                        modal.className =
                                          "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
                                        modal.innerHTML = `
          <div class="relative max-w-4xl max-h-full">
            <img src="${image}" alt="Run photo" class="max-w-full max-h-full object-contain rounded-lg" />
            <button class="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        `
                                        modal.onclick = (e) => {
                                          if (e.target === modal || (e.target as Element)?.closest("button")) {
                                            document.body.removeChild(modal)
                                          }
                                        }
                                        document.body.appendChild(modal)
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="text-lg font-bold">{activity.distance}km</p>
                              <p className="text-sm text-gray-600">{activity.duration}min</p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingActivity(activity)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => deleteActivity(activity.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {activities.length === 0 && (
                      <p className="text-gray-500 text-center py-8">
                        No activities logged yet. Start by recording your first run!
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 编辑活动对话框 */}
              <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>编辑跑步记录</DialogTitle>
                    <DialogDescription>修改您的跑步数据</DialogDescription>
                  </DialogHeader>
                  {editingActivity && (
                    <ActivityForm
                      onSubmit={(activityData) => {
                        const updatedActivity: ClientActivity = {
                          ...activityData,
                          id: editingActivity.id,
                        }
                        updateActivity(updatedActivity)
                      }}
                      initialData={editingActivity}
                      isEditing={true}
                      isMobile={isMobile}
                    />
                  )}
                </DialogContent>
              </Dialog>

            </TabsContent>

            {/* Apple Fitness Integration Tab */}
            <TabsContent value="fitness" className="space-y-6">
              <h2 className="text-2xl font-bold">Apple Fitness 集成</h2>
              <AppleFitnessIntegration onDataImported={handleAppleFitnessImport} />
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <h2 className="text-2xl font-bold">Running History</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Best Pace</span>
                        <span className="font-medium">
                          {activities.length > 0 ? safeToFixed(Math.min(...activities.map((a) => a.pace)), 1) : "0"} min/km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Longest Run</span>
                        <span className="font-medium">
                          {activities.length > 0 ? safeToFixed(Math.max(...activities.map((a) => a.distance)), 1) : "0"} km
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Longest Duration</span>
                        <span className="font-medium">
                          {activities.length > 0 ? Math.max(...activities.map((a) => a.duration)) : "0"} min
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Award className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Goals Completed</p>
                          <p className="text-sm text-gray-600">
                            {goals.filter((g) => g.status === "completed").length} goals achieved
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <ActivityIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">Total Activities</p>
                          <p className="text-sm text-gray-600">{activities.length} runs logged</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* 全局编辑目标对话框 */}
        <Dialog open={isEditGoalDialogOpen} onOpenChange={setIsEditGoalDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑目标</DialogTitle>
              <DialogDescription>修改您的跑步目标</DialogDescription>
            </DialogHeader>
            {editingGoal && (
              <GoalForm
                onSubmit={(goalData) => {
                  const updatedGoal: ClientGoal = {
                    ...goalData,
                    id: editingGoal.id,
                    current: editingGoal.current,
                    status: editingGoal.status,
                  }
                  updateGoal(updatedGoal)
                }}
                initialData={editingGoal}
                isEditing={true}
                isMobile={isMobile}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ErrorBoundary>
  )
}

function GoalForm({
  onSubmit,
  initialData,
  isEditing = false,
  isMobile = false,
}: {
  onSubmit: (goal: Omit<ClientGoal, "id" | "current" | "status">) => void
  initialData?: ClientGoal
  isEditing?: boolean
  isMobile?: boolean
}) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    type: (initialData?.type as "distance" | "time" | "frequency") || "distance",
    target: initialData?.target.toString() || "",
    unit: initialData?.unit || "km",
    deadline: initialData?.deadline || undefined,
    description: initialData?.description || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.target || !formData.deadline) return

    onSubmit({
      title: formData.title,
      type: formData.type,
      target: Number.parseFloat(formData.target),
      unit: formData.unit,
      deadline: formData.deadline,
      description: formData.description,
    })

    setFormData({
      title: "",
      type: "distance",
      target: "",
      unit: "km",
      deadline: undefined,
      description: "",
    })
  }

  const getUnitOptions = () => {
    switch (formData.type) {
      case "distance":
        return ["km", "miles"]
      case "time":
        return ["minutes", "hours"]
      case "frequency":
        return ["runs", "sessions"]
      default:
        return ["km"]
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">目标标题</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="例如：本月跑步100公里"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">目标类型</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) =>
              setFormData({
                ...formData,
                type: value,
                unit: value === "distance" ? "km" : value === "time" ? "minutes" : "runs",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">距离</SelectItem>
              <SelectItem value="time">时间</SelectItem>
              <SelectItem value="frequency">频率</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="target">目标值</Label>
          <Input
            id="target"
            type="number"
            value={formData.target}
            onChange={(e) => setFormData({ ...formData, target: e.target.value })}
            placeholder="100"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="unit">单位</Label>
        <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getUnitOptions().map((unit) => (
              <SelectItem key={unit} value={unit}>
                {unit}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        {isMobile ? (
          <MobileDatePicker
            date={formData.deadline || new Date()}
            onDateChange={(date) => setFormData({ ...formData, deadline: date })}
            label="截止日期"
          />
        ) : (
          <>
            <Label>截止日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? formatDate(formData.deadline, "yyyy年M月d日", true) : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={(date) => setFormData({ ...formData, deadline: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      <div>
        <Label htmlFor="description">描述（可选）</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="关于你目标的额外详情..."
        />
      </div>

      <Button type="submit" className="w-full">
        {isEditing ? "更新目标" : "创建目标"}
      </Button>
    </form>
  )
}

function ActivityForm({
  onSubmit,
  initialData,
  isEditing = false,
  isMobile = false,
}: {
  onSubmit: (activity: Omit<ClientActivity, "id">) => void
  initialData?: ClientActivity
  isEditing?: boolean
  isMobile?: boolean
}) {
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date(),
    distance: initialData?.distance?.toString() || "",
    duration: initialData?.duration?.toString() || "",
    location: initialData?.location || "",
    notes: initialData?.notes || "",
    images: initialData?.images || ([] as string[]),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.distance || !formData.duration) return

    const distance = Number.parseFloat(formData.distance)
    const duration = Number.parseInt(formData.duration)
    const pace = duration / distance // minutes per km

    onSubmit({
      date: formData.date,
      distance,
      duration,
      pace,
      location: formData.location,
      notes: formData.notes,
      images: formData.images,
    })

    // 只有在非编辑模式下才重置表单
    if (!isEditing) {
      setFormData({
        date: new Date(),
        distance: "",
        duration: "",
        location: "",
        notes: "",
        images: [],
      })
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Limit to 5 images total
    const remainingSlots = 5 - formData.images.length
    const filesToProcess = files.slice(0, remainingSlots)

    filesToProcess.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert(`图片 ${file.name} 太大了。请选择小于5MB的图片。`)
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const base64String = event.target?.result as string
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, base64String],
        }))
      }
      reader.readAsDataURL(file)
    })

    // Clear the input
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        {isMobile ? (
          <MobileDatePicker
            date={formData.date}
            onDateChange={(date) => setFormData({ ...formData, date })}
            label="跑步日期"
          />
        ) : (
          <>
            <Label>日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(formData.date, "yyyy年M月d日")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.date}
                  onSelect={(date) => date && setFormData({ ...formData, date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="distance">距离 (km)</Label>
          <Input
            id="distance"
            type="number"
            step="0.1"
            value={formData.distance}
            onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
            placeholder="5.0"
            required
          />
        </div>

        <div>
          <Label htmlFor="duration">时长 (分钟)</Label>
          <Input
            id="duration"
            type="number"
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="30"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">地点（可选）</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="中央公园"
        />
      </div>

      <div>
        <Label htmlFor="notes">备注（可选）</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="跑步感受如何？有什么观察..."
        />
      </div>

      <div>
        <Label htmlFor="images">上传照片（可选）</Label>
        <div className="space-y-3">
          <Input
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="cursor-pointer"
          />
          {formData.images.length > 0 && (
            <div className="space-y-3">
              <SmartDataRecognition
                images={formData.images}
                onDataExtracted={(data) => {
                  setFormData((prev) => ({
                    ...prev,
                    distance: data.distance || prev.distance,
                    duration: data.duration || prev.duration,
                    location: data.location || prev.location,
                    date: data.date || prev.date,
                  }))
                }}
              />
            </div>
          )}
          {formData.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {formData.images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image || "/placeholder.svg"}
                    alt={`上传 ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500">上传跑步路线、数据或风景照片（最多5张）</p>
        </div>
      </div>

      {formData.distance && formData.duration && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>计算配速：</strong>{" "}
            {safeToFixed(Number.parseInt(formData.duration) / Number.parseFloat(formData.distance), 1)} min/km
          </p>
        </div>
      )}

      <div className="sticky bottom-0 bg-white pt-4 border-t">
        <Button type="submit" className="w-full">
          {isEditing ? "更新记录" : "记录活动"}
        </Button>
      </div>
    </form>
  )
}
