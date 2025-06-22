"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Eye, Zap, CheckCircle, AlertCircle } from "lucide-react"

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

interface RecognitionResult {
  confidence: number
  field: string
  value: string
  source: string
}

interface SmartDataRecognitionProps {
  images: string[]
  onDataExtracted: (data: {
    distance?: string
    duration?: string
    location?: string
    pace?: string
    date?: Date
  }) => void
}

export function SmartDataRecognition({ images, onDataExtracted }: SmartDataRecognitionProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<RecognitionResult[]>([])
  const [extractedData, setExtractedData] = useState<any>({})

  const processImages = async () => {
    setIsProcessing(true)
    setResults([])

    try {
      // 动态导入 Tesseract.js
      const Tesseract = await import("tesseract.js")

      const allResults: RecognitionResult[] = []
      const combinedData: any = {}

      for (let i = 0; i < images.length; i++) {
        const image = images[i]

        try {
          const {
            data: { text, confidence },
          } = await Tesseract.recognize(image, "eng+chi_sim", {
            logger: (m) => {
              if (m.status === "recognizing text") {
                console.log(`图片 ${i + 1}: ${Math.round(m.progress * 100)}%`)
              }
            },
          })

          // 解析不同类型的跑步应用数据
          const parsedData = parseMultipleAppFormats(text, confidence)

          // 合并数据
          Object.assign(combinedData, parsedData.data)
          allResults.push(...parsedData.results)
        } catch (error) {
          console.error(`处理图片 ${i + 1} 失败:`, error)
        }
      }

      setResults(allResults)
      setExtractedData(combinedData)

      if (Object.keys(combinedData).length > 0) {
        onDataExtracted(combinedData)
      }
    } catch (error) {
      console.error("图片识别失败:", error)
      alert("图片识别失败，请确保图片清晰可读")
    } finally {
      setIsProcessing(false)
    }
  }

  const parseMultipleAppFormats = (text: string, confidence: number) => {
    const results: RecognitionResult[] = []
    const data: any = {}

    // Nike Run Club 格式识别
    const nikePatterns = {
      distance: /(\d+\.?\d*)\s*(?:KM|km)/i,
      time: /(\d{1,2}):(\d{2}):(\d{2})/,
      pace: /(\d{1,2})'(\d{2})"?\s*\/\s*km/i,
    }

    // Strava 格式识别
    const stravaPatterns = {
      distance: /Distance\s*(\d+\.?\d*)\s*km/i,
      time: /Moving Time\s*(\d{1,2}):(\d{2}):(\d{2})/i,
      pace: /Avg Pace\s*(\d{1,2}):(\d{2})\s*\/km/i,
    }

    // Apple Health/Fitness 格式识别
    const applePatterns = {
      distance: /(\d+\.?\d*)\s*公里/,
      time: /(\d{1,2})\s*小时\s*(\d{1,2})\s*分钟|(\d{1,2})\s*分钟\s*(\d{1,2})\s*秒/,
      pace: /配速\s*(\d{1,2})'(\d{2})"/,
    }

    // 小米运动/华为运动健康格式
    const xiaomiPatterns = {
      distance: /距离[：:]\s*(\d+\.?\d*)\s*km/i,
      time: /时长[：:]\s*(\d{1,2}):(\d{2}):(\d{2})/,
      pace: /配速[：:]\s*(\d{1,2})'(\d{2})"/,
    }

    const allPatterns = [
      { name: "Nike Run Club", patterns: nikePatterns },
      { name: "Strava", patterns: stravaPatterns },
      { name: "Apple Health", patterns: applePatterns },
      { name: "小米运动", patterns: xiaomiPatterns },
    ]

    // 尝试匹配各种格式
    for (const { name, patterns } of allPatterns) {
      // 距离识别
      const distanceMatch = text.match(patterns.distance)
      if (distanceMatch && !data.distance) {
        const distance = Number.parseFloat(distanceMatch[1])
        data.distance = safeToFixed(distance, 1)
        results.push({
          confidence: confidence * 0.8,
          field: "distance",
          value: `${safeToFixed(distance, 1)} km`,
          source: name,
        })
      }

      // 时间识别
      const timeMatch = text.match(patterns.time)
      if (timeMatch && !data.duration) {
        let totalMinutes = 0
        if (timeMatch[3]) {
          // HH:MM:SS 格式
          const hours = Number.parseInt(timeMatch[1]) || 0
          const minutes = Number.parseInt(timeMatch[2]) || 0
          const seconds = Number.parseInt(timeMatch[3]) || 0
          totalMinutes = hours * 60 + minutes + Math.round(seconds / 60)
        } else if (timeMatch[2]) {
          // 中文格式
          const hours = Number.parseInt(timeMatch[1]) || 0
          const minutes = Number.parseInt(timeMatch[2]) || 0
          totalMinutes = hours * 60 + minutes
        }

        if (totalMinutes > 0) {
          data.duration = totalMinutes.toString()
          results.push({
            confidence: confidence * 0.9,
            field: "duration",
            value: `${totalMinutes} 分钟`,
            source: name,
          })
        }
      }

      // 配速识别
      const paceMatch = text.match(patterns.pace)
      if (paceMatch && !data.pace) {
        const minutes = Number.parseInt(paceMatch[1])
        const seconds = Number.parseInt(paceMatch[2])
        const pace = minutes + seconds / 60
        data.pace = safeToFixed(pace, 1)
        results.push({
          confidence: confidence * 0.7,
          field: "pace",
          value: `${minutes}'${seconds.toString().padStart(2, "0")}" /km`,
          source: name,
        })
      }
    }

    // 通用地点识别
    const locationPatterns = [
      /地点[：:]\s*([^\n\r，,。.]+)/,
      /Location[：:]\s*([^\n\r，,。.]+)/i,
      /路线[：:]\s*([^\n\r，,。.]+)/,
      /Route[：:]\s*([^\n\r，,。.]+)/i,
    ]

    for (const pattern of locationPatterns) {
      const match = text.match(pattern)
      if (match && !data.location) {
        data.location = match[1].trim()
        results.push({
          confidence: confidence * 0.6,
          field: "location",
          value: match[1].trim(),
          source: "通用识别",
        })
        break
      }
    }

    // 日期识别
    const datePatterns = [
      // 英文日期格式 (MM/DD/YYYY, MM-DD-YYYY, Month DD, YYYY)
      /(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/, // 01/02/2023, 01-02-2023
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})(?:[a-z]*)?(?:,?\s+(\d{4}))?/i, // January 2, 2023

      // 中文日期格式
      /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/, // 2023年1月2日
      /(\d{1,2})\s*月\s*(\d{1,2})\s*日/, // 1月2日

      // 应用特定格式
      /Date:\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/i,
      /日期[：:]\s*(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/,
      /日期[：:]\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/,

      // 今天、昨天格式
      /Today|今天/i,
      /Yesterday|昨天/i,
    ]

    let recognizedDate: Date | undefined

    for (const pattern of datePatterns) {
      const match = text.match(pattern)
      if (match) {
        try {
          // 处理"今天"和"昨天"
          if (pattern.source.includes("Today|今天")) {
            recognizedDate = new Date()
            break
          }

          if (pattern.source.includes("Yesterday|昨天")) {
            recognizedDate = new Date()
            recognizedDate.setDate(recognizedDate.getDate() - 1)
            break
          }

          // 处理英文月份名称格式 (Jan 2, 2023)
          if (pattern.source.includes("Jan|Feb|Mar")) {
            const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
            const month = monthNames.findIndex((m) => match[1].toLowerCase().startsWith(m))
            if (month !== -1) {
              const day = Number.parseInt(match[2])
              // 如果没有年份，默认为当前年份
              const year = match[3] ? Number.parseInt(match[3]) : new Date().getFullYear()
              recognizedDate = new Date(year, month, day)
              break
            }
          }

          // 处理标准数字日期格式
          let year, month, day

          // 中文年月日格式
          if (pattern.source.includes("年")) {
            year = Number.parseInt(match[1])
            month = Number.parseInt(match[2]) - 1 // 月份从0开始
            day = Number.parseInt(match[3])
          }
          // 中文月日格式（无年份）
          else if (pattern.source.includes("月") && !pattern.source.includes("年")) {
            year = new Date().getFullYear() // 默认当前年份
            month = Number.parseInt(match[1]) - 1
            day = Number.parseInt(match[2])
          }
          // MM/DD/YYYY 格式
          else if (pattern.source.includes("(d{1,2})[/-.](d{1,2})[/-.](d{2,4})")) {
            month = Number.parseInt(match[1]) - 1
            day = Number.parseInt(match[2])
            year = Number.parseInt(match[3])
            // 处理两位数年份
            if (year < 100) {
              year += year < 50 ? 2000 : 1900
            }
          }
          // 应用特定格式，根据实际匹配调整
          else {
            // 尝试确定哪个是年、月、日
            const parts = [Number.parseInt(match[1]), Number.parseInt(match[2]), Number.parseInt(match[3])]

            // 如果有一个数大于31，可能是年份
            if (parts[0] > 31) {
              year = parts[0]
              month = parts[1] - 1
              day = parts[2]
            } else if (parts[2] > 31) {
              year = parts[2]
              month = parts[0] - 1
              day = parts[1]
            } else {
              // 默认假设是月/日/年格式
              month = parts[0] - 1
              day = parts[1]
              year = parts[2]
              // 处理两位数年份
              if (year < 100) {
                year += year < 50 ? 2000 : 1900
              }
            }
          }

          // 创建日期对象并验证
          if (year && month >= 0 && month < 12 && day > 0 && day <= 31) {
            const tempDate = new Date(year, month, day)
            // 验证日期是否有效（例如，避免2月30日这样的无效日期）
            if (tempDate.getFullYear() === year && tempDate.getMonth() === month && tempDate.getDate() === day) {
              recognizedDate = tempDate
              break
            }
          }
        } catch (e) {
          console.error("日期解析错误:", e)
        }
      }
    }

    // 如果识别到日期，添加到结果中
    if (recognizedDate) {
      data.date = recognizedDate
      results.push({
        confidence: confidence * 0.75,
        field: "date",
        value: recognizedDate.toLocaleDateString(),
        source: "日期识别",
      })
    }

    return { results, data }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800"
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return <CheckCircle className="h-4 w-4" />
    if (confidence >= 60) return <AlertCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <Card className="w-full max-h-96 overflow-y-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          智能数据识别
        </CardTitle>
        <CardDescription>自动识别跑步应用截图中的数据，支持Nike Run Club、Strava、Apple Health等</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={processImages} disabled={isProcessing || images.length === 0} className="w-full">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              正在分析图片...
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              开始智能识别 ({images.length} 张图片)
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3 max-h-48 overflow-y-auto">
            <Separator />
            <h4 className="font-medium text-sm">识别结果</h4>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getConfidenceIcon(result.confidence)}
                    <span className="font-medium text-sm">{result.field}</span>
                    <span className="text-sm text-gray-600">{result.value}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {result.source}
                    </Badge>
                    <Badge className={`text-xs ${getConfidenceColor(result.confidence)}`}>
                      {Math.round(result.confidence)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(extractedData).length > 0 && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">已自动填充的数据：</p>
                <div className="text-sm text-blue-700 space-y-1">
                  {extractedData.distance && <p>• 距离: {extractedData.distance} km</p>}
                  {extractedData.duration && <p>• 时长: {extractedData.duration} 分钟</p>}
                  {extractedData.pace && <p>• 配速: {extractedData.pace} min/km</p>}
                  {extractedData.location && <p>• 地点: {extractedData.location}</p>}
                  {extractedData.date && <p>• 日期: {extractedData.date.toLocaleDateString()}</p>}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
