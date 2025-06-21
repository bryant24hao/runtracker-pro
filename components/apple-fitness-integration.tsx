"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Download, AlertCircle, Smartphone, Heart, Timer, Info } from "lucide-react"

interface AppleFitnessWorkout {
  id: string
  workoutType: string
  startDate: Date
  endDate: Date
  duration: number // seconds
  totalDistance?: number // meters
  totalEnergyBurned?: number // calories
  averageHeartRate?: number
  maxHeartRate?: number
  elevationGained?: number
  averagePace?: number // seconds per meter
  splits?: Array<{
    distance: number
    time: number
    pace: number
  }>
  route?: {
    locations: Array<{
      latitude: number
      longitude: number
      timestamp: Date
    }>
  }
}

interface AppleFitnessIntegrationProps {
  onDataImported: (workouts: any[]) => void
}

export function AppleFitnessIntegration({ onDataImported }: AppleFitnessIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [fitnessData, setFitnessData] = useState<AppleFitnessWorkout[]>([])
  const [error, setError] = useState<string | null>(null)
  const [platform, setPlatform] = useState<"ios" | "android" | "web">("web")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    detectPlatform()
  }, [])

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileDevice =
      window.innerWidth < 768 || /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)

    setIsMobile(isMobileDevice)

    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios")
    } else if (/android/.test(userAgent)) {
      setPlatform("android")
    } else {
      setPlatform("web")
    }
  }

  // 文件导入功能
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      console.log(`开始处理Apple Fitness文件: ${file.name}`)

      const text = await file.text()
      let data

      if (file.name.endsWith(".json")) {
        data = JSON.parse(text)
      } else if (file.name.endsWith(".xml")) {
        data = parseAppleFitnessXML(text)
      } else if (file.name.endsWith(".gpx")) {
        data = parseGPXFile(text)
      } else {
        throw new Error("不支持的文件格式。请使用 .json、.xml 或 .gpx 格式。")
      }

      const workouts = extractAppleFitnessWorkouts(data)

      if (workouts.length === 0) {
        throw new Error("未找到Apple Fitness跑步数据。请确保文件包含跑步锻炼记录。")
      }

      console.log(`准备导入 ${workouts.length} 条Apple Fitness记录`)
      onDataImported(workouts)
      setFitnessData(data.workouts || [])

      // 显示成功消息
      alert(`成功导入 ${workouts.length} 条跑步记录！`)
    } catch (err) {
      console.error("Apple Fitness文件导入错误:", err)
      setError(err instanceof Error ? err.message : "文件导入失败")
    } finally {
      setIsLoading(false)
    }
  }

  // 解析Apple Fitness XML文件
  const parseAppleFitnessXML = (xmlText: string) => {
    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(xmlText, "text/xml")

      // 检查解析错误
      const parseError = xmlDoc.querySelector("parsererror")
      if (parseError) {
        throw new Error("XML文件格式错误")
      }

      const workouts: any[] = []
      const workoutElements = xmlDoc.getElementsByTagName("Workout")

      console.log(`找到 ${workoutElements.length} 个锻炼记录`)

      for (let i = 0; i < workoutElements.length; i++) {
        const workout = workoutElements[i]
        const workoutType = workout.getAttribute("workoutActivityType")

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

          if (startDate && endDate) {
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
      }

      console.log(`解析到 ${workouts.length} 条跑步记录`)
      return { workouts }
    } catch (error) {
      console.error("XML解析错误:", error)
      throw new Error("XML文件解析失败，请确保文件格式正确")
    }
  }

  // 解析GPX文件
  const parseGPXFile = (gpxText: string) => {
    try {
      const parser = new DOMParser()
      const gpxDoc = parser.parseFromString(gpxText, "text/xml")

      const tracks = gpxDoc.getElementsByTagName("trk")
      const workouts: any[] = []

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i]
        const trackPoints = track.getElementsByTagName("trkpt")

        if (trackPoints.length === 0) continue

        const points: any[] = []
        let totalDistance = 0
        let startTime: Date | null = null
        let endTime: Date | null = null

        for (let j = 0; j < trackPoints.length; j++) {
          const point = trackPoints[j]
          const lat = Number.parseFloat(point.getAttribute("lat") || "0")
          const lon = Number.parseFloat(point.getAttribute("lon") || "0")
          const timeElement = point.getElementsByTagName("time")[0]
          const time = timeElement ? new Date(timeElement.textContent || "") : new Date()

          if (!startTime) startTime = time
          endTime = time

          points.push({ lat, lon, time })

          // 计算距离
          if (j > 0) {
            const prevPoint = points[j - 1]
            const distance = calculateDistance(prevPoint.lat, prevPoint.lon, lat, lon)
            totalDistance += distance
          }
        }

        if (startTime && endTime) {
          const duration = (endTime.getTime() - startTime.getTime()) / 1000

          workouts.push({
            startDate: startTime.toISOString(),
            endDate: endTime.toISOString(),
            duration,
            totalDistance,
            workoutType: "HKWorkoutActivityTypeRunning",
            route: points,
          })
        }
      }

      return { workouts }
    } catch (error) {
      console.error("GPX解析错误:", error)
      throw new Error("GPX文件解析失败")
    }
  }

  // 计算两点间距离（米）
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // 地球半径（米）
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // 提取Apple Fitness锻炼数据
  const extractAppleFitnessWorkouts = (data: any) => {
    const workouts = data.workouts || []

    return workouts
      .map((workout: any) => {
        // 确保日期是Date对象
        const startDate = workout.startDate instanceof Date ? workout.startDate : new Date(workout.startDate)
        const endDate = workout.endDate instanceof Date ? workout.endDate : new Date(workout.endDate)

        // 验证日期有效性
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn("无效的日期数据:", workout.startDate, workout.endDate)
          return null
        }

        let duration = workout.duration
        if (!duration) {
          duration = (endDate.getTime() - startDate.getTime()) / (1000 * 60)
        } else {
          duration = duration / 60 // 转换为分钟
        }
        duration = Math.round(Math.max(duration, 1)) // 确保至少1分钟

        let distance = workout.totalDistance
        if (distance && distance > 0) {
          distance = distance / 1000 // 转换为公里
        } else {
          distance = 5 // 默认5公里
        }

        return {
          date: startDate,
          distance: Number.parseFloat(distance.toFixed(1)),
          duration,
          pace: distance > 0 ? Number.parseFloat((duration / distance).toFixed(1)) : 6,
          location: workout.route ? "GPS路线记录" : "Apple Fitness导入",
          notes: `Apple Fitness导入${workout.totalEnergyBurned ? ` • ${Math.round(workout.totalEnergyBurned)}卡路里` : ""}`,
          images: [],
        }
      })
      .filter(Boolean) // 过滤掉null值
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Apple Fitness 集成
        </CardTitle>
        <CardDescription>
          {isMobile ? "在移动端导入Apple Fitness数据" : "自动导入Apple Fitness和Apple Watch的跑步数据"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 平台检测 */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Smartphone className="h-4 w-4" />
          <span className="text-sm">
            当前平台: <Badge variant="outline">{platform.toUpperCase()}</Badge>
            {isMobile && (
              <Badge variant="outline" className="ml-2">
                移动端
              </Badge>
            )}
          </span>
        </div>

        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* 移动端说明 */}
        {isMobile && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>在移动端，请使用文件导入功能。直接连接功能需要在原生应用中使用。</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">文件导入</TabsTrigger>
            <TabsTrigger value="guide">使用指南</TabsTrigger>
          </TabsList>

          {/* 文件导入 */}
          <TabsContent value="file" className="space-y-4">
            <div className="space-y-3">
              <input
                type="file"
                accept=".xml,.json,.gpx"
                onChange={handleFileImport}
                className="hidden"
                id="fitness-file-input"
                disabled={isLoading}
              />
              <label htmlFor="fitness-file-input">
                <Button variant="outline" className="w-full cursor-pointer" asChild disabled={isLoading}>
                  <span>
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        处理中...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        选择 Apple Health 导出文件
                      </>
                    )}
                  </span>
                </Button>
              </label>
              <p className="text-xs text-gray-500">支持 .xml (Health导出)、.json 和 .gpx 格式</p>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">支持的文件格式：</h5>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>
                  <strong>XML文件</strong> - 从iPhone健康应用导出的完整数据
                </li>
                <li>
                  <strong>GPX文件</strong> - 从Apple Watch或其他GPS设备导出的路线文件
                </li>
                <li>
                  <strong>JSON文件</strong> - 自定义格式的锻炼数据
                </li>
              </ul>
            </div>
          </TabsContent>

          {/* 使用指南 */}
          <TabsContent value="guide" className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-800 mb-2">如何导出 Apple Health 数据：</h5>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>打开 iPhone 上的"健康"应用</li>
                <li>点击右上角的个人资料图片</li>
                <li>选择"导出所有健康数据"</li>
                <li>等待导出完成（可能需要几分钟）</li>
                <li>通过AirDrop、邮件或云存储分享到设备</li>
                <li>解压下载的zip文件，找到"export.xml"</li>
                <li>在此处上传 export.xml 文件</li>
              </ol>
            </div>

            <div className="p-3 bg-yellow-50 rounded-lg">
              <h5 className="font-medium text-yellow-800 mb-2">注意事项：</h5>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li>确保上传的是解压后的 export.xml 文件</li>
                <li>文件通常比较大（几MB到几十MB）</li>
                <li>如果显示"导入0条记录"，请确保健康应用中有跑步数据</li>
                <li>支持的锻炼类型：跑步、步行、户外跑步、跑步机跑步</li>
              </ul>
            </div>

            {isMobile && (
              <div className="p-3 bg-purple-50 rounded-lg">
                <h5 className="font-medium text-purple-800 mb-2">移动端特别说明：</h5>
                <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                  <li>直接连接Apple Health需要原生应用环境</li>
                  <li>在网页版中，请使用文件导入功能</li>
                  <li>可以通过Safari浏览器访问并导入文件</li>
                  <li>建议使用云存储（iCloud、Google Drive等）传输文件</li>
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* 数据预览 */}
        {fitnessData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">导入的数据预览</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fitnessData.slice(0, 5).map((workout, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {workout.totalDistance ? (workout.totalDistance / 1000).toFixed(1) : "N/A"} km
                      </p>
                      {workout.averageHeartRate && (
                        <Badge variant="outline" className="text-xs">
                          <Heart className="h-3 w-3 mr-1" />
                          {Math.round(workout.averageHeartRate)} bpm
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3" />
                        {Math.round(workout.duration / 60)} 分钟
                      </span>
                      <span>
                        {workout.startDate instanceof Date
                          ? workout.startDate.toLocaleDateString()
                          : new Date(workout.startDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {workout.totalEnergyBurned && (
                      <p className="text-sm text-gray-600">{Math.round(workout.totalEnergyBurned)} 卡路里</p>
                    )}
                  </div>
                </div>
              ))}
              {fitnessData.length > 5 && (
                <p className="text-sm text-gray-500 text-center">还有 {fitnessData.length - 5} 条记录...</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
