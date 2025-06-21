"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Heart, Download, FolderSyncIcon as Sync, CheckCircle, AlertCircle, Smartphone } from "lucide-react"

interface HealthKitData {
  workouts: Array<{
    id: string
    type: string
    startDate: Date
    endDate: Date
    duration: number // minutes
    distance?: number // km
    calories?: number
    heartRate?: {
      average: number
      max: number
    }
  }>
  steps: Array<{
    date: Date
    count: number
  }>
  heartRate: Array<{
    date: Date
    value: number
  }>
}

interface AppleHealthIntegrationProps {
  onDataImported: (workouts: any[]) => void
}

export function AppleHealthIntegration({ onDataImported }: AppleHealthIntegrationProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [healthData, setHealthData] = useState<HealthKitData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncProgress, setSyncProgress] = useState(0)

  // 检测是否在支持的环境中
  const [isSupported, setIsSupported] = useState(false)
  const [platform, setPlatform] = useState<"ios" | "android" | "web">("web")

  useEffect(() => {
    detectPlatform()
  }, [])

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase()

    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios")
      // 检查是否在Capacitor或React Native环境中
      if (window.Capacitor || window.ReactNativeWebView) {
        setIsSupported(true)
      }
    } else if (/android/.test(userAgent)) {
      setPlatform("android")
      // Android可以通过Google Fit API
      setIsSupported(true)
    } else {
      setPlatform("web")
      // Web环境支持文件导入
      setIsSupported(true)
    }
  }

  // iOS HealthKit集成 (需要Capacitor插件)
  const connectToHealthKit = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // 检查HealthKit可用性
      if (!window.Capacitor?.Plugins?.HealthKit) {
        throw new Error("HealthKit plugin not available")
      }

      const { HealthKit } = window.Capacitor.Plugins

      // 请求权限
      const permissions = await HealthKit.requestPermissions({
        read: [
          "HKQuantityTypeIdentifierDistanceWalkingRunning",
          "HKQuantityTypeIdentifierActiveEnergyBurned",
          "HKQuantityTypeIdentifierHeartRate",
          "HKQuantityTypeIdentifierStepCount",
          "HKWorkoutTypeIdentifier",
        ],
      })

      if (permissions.granted) {
        setIsConnected(true)
        await syncHealthData()
      } else {
        throw new Error("HealthKit permissions denied")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to HealthKit")
    } finally {
      setIsLoading(false)
    }
  }

  // 同步HealthKit数据
  const syncHealthData = async () => {
    if (!window.Capacitor?.Plugins?.HealthKit) return

    setIsLoading(true)
    setSyncProgress(0)

    try {
      const { HealthKit } = window.Capacitor.Plugins
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000) // 30天前

      setSyncProgress(25)

      // 获取跑步锻炼数据
      const workouts = await HealthKit.queryWorkouts({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        workoutType: "HKWorkoutActivityTypeRunning",
      })

      setSyncProgress(50)

      // 获取心率数据
      const heartRateData = await HealthKit.querySamples({
        sampleType: "HKQuantityTypeIdentifierHeartRate",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      setSyncProgress(75)

      // 获取步数数据
      const stepsData = await HealthKit.querySamples({
        sampleType: "HKQuantityTypeIdentifierStepCount",
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      })

      setSyncProgress(100)

      // 处理数据
      const processedWorkouts = workouts.map((workout: any) => ({
        id: workout.uuid,
        type: "running",
        startDate: new Date(workout.startDate),
        endDate: new Date(workout.endDate),
        duration: Math.round((new Date(workout.endDate).getTime() - new Date(workout.startDate).getTime()) / 60000),
        distance: workout.totalDistance ? workout.totalDistance / 1000 : undefined, // 转换为km
        calories: workout.totalEnergyBurned,
        heartRate: workout.averageHeartRate
          ? {
              average: workout.averageHeartRate,
              max: workout.maxHeartRate,
            }
          : undefined,
      }))

      const healthKitData: HealthKitData = {
        workouts: processedWorkouts,
        steps: stepsData.map((step: any) => ({
          date: new Date(step.startDate),
          count: step.quantity,
        })),
        heartRate: heartRateData.map((hr: any) => ({
          date: new Date(hr.startDate),
          value: hr.quantity,
        })),
      }

      setHealthData(healthKitData)

      // 转换为应用格式并导入
      const convertedWorkouts = processedWorkouts.map((workout) => ({
        date: workout.startDate,
        distance: workout.distance || 0,
        duration: workout.duration,
        pace: workout.distance ? workout.duration / workout.distance : 0,
        location: "Apple Health Import",
        notes: `Imported from Apple Health. Calories: ${workout.calories || "N/A"}`,
        images: [],
      }))

      onDataImported(convertedWorkouts)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync HealthKit data")
    } finally {
      setIsLoading(false)
      setSyncProgress(0)
    }
  }

  // Web端文件导入功能
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      console.log(`开始处理文件: ${file.name}, 大小: ${file.size} bytes`)

      const text = await file.text()
      let data

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text)
      } else if (file.name.endsWith(".xml")) {
        // 检查是否是Apple Health导出文件
        if (!text.includes("HealthData") && !text.includes("Workout")) {
          throw new Error("这不是有效的Apple Health导出文件。请确保导出的是完整的健康数据。")
        }

        console.log("开始解析Apple Health XML文件...")
        data = parseAppleHealthXML(text)
      } else {
        throw new Error("不支持的文件格式。请使用 .xml (Apple Health导出) 或 .json 格式。")
      }

      // 处理导入的数据
      console.log("开始提取锻炼数据...")
      const workouts = extractWorkoutsFromData(data)

      if (workouts.length === 0) {
        throw new Error("未找到跑步数据。请确保您的Apple Health中有跑步或步行锻炼记录。")
      }

      console.log(`准备导入 ${workouts.length} 条记录`)
      onDataImported(workouts)

      setHealthData({ workouts: data.workouts || [], steps: [], heartRate: [] })
    } catch (err) {
      console.error("文件导入错误:", err)
      setError(err instanceof Error ? err.message : "文件导入失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 解析Apple Health XML导出文件
  const parseAppleHealthXML = (xmlText: string) => {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlText, "text/xml")

    const workouts: any[] = []

    // 查找所有Workout元素
    const workoutElements = xmlDoc.getElementsByTagName("Workout")

    console.log(`找到 ${workoutElements.length} 个锻炼记录`)

    for (let i = 0; i < workoutElements.length; i++) {
      const workout = workoutElements[i]
      const workoutType = workout.getAttribute("workoutActivityType")

      console.log(`锻炼类型: ${workoutType}`)

      // 支持多种跑步类型
      if (
        workoutType &&
        (workoutType.includes("Running") ||
          workoutType.includes("Walking") ||
          workoutType === "HKWorkoutActivityTypeRunning" ||
          workoutType === "HKWorkoutActivityTypeWalking")
      ) {
        const startDate = workout.getAttribute("startDate")
        const endDate = workout.getAttribute("endDate")
        const duration = workout.getAttribute("duration")
        const totalDistance = workout.getAttribute("totalDistance")
        const totalEnergyBurned = workout.getAttribute("totalEnergyBurned")

        console.log(`跑步记录: ${startDate}, 距离: ${totalDistance}, 时长: ${duration}`)

        workouts.push({
          startDate,
          endDate,
          duration: duration ? Number.parseFloat(duration) : null,
          totalDistance: totalDistance ? Number.parseFloat(totalDistance) : null,
          totalEnergyBurned: totalEnergyBurned ? Number.parseFloat(totalEnergyBurned) : null,
          workoutType,
        })
      }
    }

    console.log(`解析到 ${workouts.length} 条跑步记录`)
    return { workouts }
  }

  // 从数据中提取锻炼信息
  const extractWorkoutsFromData = (data: any) => {
    const workouts = data.workouts || []

    console.log(`开始处理 ${workouts.length} 条锻炼数据`)

    return workouts.map((workout: any, index: number) => {
      const startDate = new Date(workout.startDate)
      const endDate = new Date(workout.endDate)

      // 计算时长（分钟）
      let duration = workout.duration
      if (!duration && workout.startDate && workout.endDate) {
        duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60) // 转换为分钟
      }
      duration = Math.round(duration || 30) // 默认30分钟

      // 计算距离（公里）
      let distance = workout.totalDistance
      if (distance) {
        distance = distance / 1000 // 从米转换为公里
      } else {
        distance = 5 // 默认5公里
      }

      console.log(
        `处理记录 ${index + 1}: 日期=${startDate.toLocaleDateString()}, 距离=${distance}km, 时长=${duration}分钟`,
      )

      return {
        date: startDate,
        distance: Number.parseFloat(distance.toFixed(1)),
        duration: duration,
        pace: distance > 0 ? Number.parseFloat((duration / distance).toFixed(1)) : 6, // 计算配速
        location: "Apple Health Import",
        notes: `从Apple Health导入 ${workout.workoutType ? `(${workout.workoutType})` : ""}${workout.totalEnergyBurned ? ` • 消耗卡路里: ${Math.round(workout.totalEnergyBurned)}` : ""}`,
        images: [],
      }
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Apple Health 集成
        </CardTitle>
        <CardDescription>直接从Apple Health导入您的跑步数据，无需手动输入</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 平台检测 */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Smartphone className="h-4 w-4" />
          <span className="text-sm">
            检测到平台: <Badge variant="outline">{platform.toUpperCase()}</Badge>
          </span>
          {isSupported ? (
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              支持
            </Badge>
          ) : (
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertCircle className="h-3 w-3 mr-1" />
              部分支持
            </Badge>
          )}
        </div>

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* iOS HealthKit集成 */}
        {platform === "ios" && isSupported && (
          <div className="space-y-3">
            <h4 className="font-medium">HealthKit 直接集成</h4>
            {!isConnected ? (
              <Button onClick={connectToHealthKit} disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    连接中...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    连接 Apple Health
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">已连接到 Apple Health</span>
                </div>
                <Button onClick={syncHealthData} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Sync className="h-4 w-4 mr-2 animate-spin" />
                      同步中...
                    </>
                  ) : (
                    <>
                      <Sync className="h-4 w-4 mr-2" />
                      同步数据
                    </>
                  )}
                </Button>
                {syncProgress > 0 && (
                  <div className="space-y-2">
                    <Progress value={syncProgress} className="h-2" />
                    <p className="text-sm text-gray-600 text-center">{syncProgress}% 完成</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 文件导入选项 */}
        <div className="space-y-3">
          <h4 className="font-medium">文件导入</h4>
          <div className="space-y-2">
            <input
              type="file"
              accept=".xml,.json"
              onChange={handleFileImport}
              className="hidden"
              id="health-file-input"
            />
            <label htmlFor="health-file-input">
              <Button variant="outline" className="w-full cursor-pointer" asChild>
                <span>
                  <Download className="h-4 w-4 mr-2" />
                  导入 Apple Health 导出文件
                </span>
              </Button>
            </label>
            <p className="text-xs text-gray-500">支持 .xml (Apple Health导出) 和 .json 格式</p>
          </div>
        </div>

        {/* 导入说明 */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-800 mb-2">如何导出 Apple Health 数据：</h5>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>打开 iPhone 上的"健康"应用</li>
            <li>点击右上角的个人资料图片</li>
            <li>选择"导出所有健康数据"</li>
            <li>等待导出完成（可能需要几分钟）</li>
            <li>通过AirDrop、邮件或其他方式分享到电脑</li>
            <li>解压下载的zip文件，找到"export.xml"</li>
            <li>在此处上传 export.xml 文件</li>
          </ol>
          <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
            <p className="text-xs text-yellow-800">
              <strong>注意：</strong>确保上传的是解压后的 export.xml 文件，不是压缩包。文件通常比较大（几MB到几十MB）。
            </p>
          </div>
        </div>

        {/* 故障排除 */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-gray-800 mb-2">常见问题：</h5>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>如果显示"导入0条记录"，请确保您的健康应用中有跑步或步行锻炼数据</li>
            <li>支持的锻炼类型：跑步、步行、户外跑步、跑步机跑步</li>
            <li>如果文件太大无法上传，可以尝试只导出最近几个月的数据</li>
            <li>确保使用的是最新版本的iOS健康应用</li>
          </ul>
        </div>

        {/* 数据预览 */}
        {healthData && healthData.workouts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">导入的数据预览</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {healthData.workouts.slice(0, 5).map((workout, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{workout.distance?.toFixed(1) || "N/A"} km</p>
                    <p className="text-sm text-gray-600">
                      {workout.startDate.toLocaleDateString()} • {workout.duration} 分钟
                    </p>
                  </div>
                  <Badge variant="outline">{workout.type}</Badge>
                </div>
              ))}
              {healthData.workouts.length > 5 && (
                <p className="text-sm text-gray-500 text-center">还有 {healthData.workouts.length - 5} 条记录...</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
