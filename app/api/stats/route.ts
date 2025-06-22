import { NextResponse } from "next/server"
import { paramQuery, getCurrentUserId } from "@/lib/db"

export async function GET() {
  try {
    const userId = getCurrentUserId()

    // 简化查询：在单用户系统中直接获取所有数据
    const allActivities = await paramQuery`SELECT * FROM activities`
    const activities = Array.isArray(allActivities) ? allActivities : [allActivities].filter(Boolean)

    // 获取所有目标数据
    const allGoals = await paramQuery`SELECT * FROM goals`
    const goals = Array.isArray(allGoals) ? allGoals : [allGoals].filter(Boolean)

    // 计算总体统计
    const totalRuns = activities.length
    const totalDistance = activities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
    const totalTime = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0)
    const avgPace = totalRuns > 0 ? activities.reduce((sum, activity) => sum + (activity.pace || 0), 0) / totalRuns : 0
    const bestPace = totalRuns > 0 ? Math.min(...activities.map(a => a.pace || Infinity)) : 0
    const longestRun = totalRuns > 0 ? Math.max(...activities.map(a => a.distance || 0)) : 0
    const longestDuration = totalRuns > 0 ? Math.max(...activities.map(a => a.duration || 0)) : 0

    // 计算目标统计
    const goalStats = goals.reduce((acc: any, goal) => {
      const status = goal.status || 'active'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // 计算最近7天的活动
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

    const recentActivities = activities
      .filter(activity => activity.date >= sevenDaysAgoStr)
      .reduce((acc: any, activity) => {
        const date = activity.date
        if (!acc[date]) {
          acc[date] = { date, runs: 0, distance: 0 }
        }
        acc[date].runs += 1
        acc[date].distance += activity.distance || 0
        return acc
      }, {})

    const recentActivitiesArray = Object.values(recentActivities)
      .sort((a: any, b: any) => b.date.localeCompare(a.date))

    // 计算月度统计
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0]

    const monthlyStats = activities
      .filter(activity => activity.date >= twelveMonthsAgoStr)
      .reduce((acc: any, activity) => {
        const month = activity.date.substring(0, 7) // YYYY-MM
        if (!acc[month]) {
          acc[month] = { month, runs: 0, distance: 0, duration: 0 }
        }
        acc[month].runs += 1
        acc[month].distance += activity.distance || 0
        acc[month].duration += activity.duration || 0
        return acc
      }, {})

    const monthlyStatsArray = Object.values(monthlyStats)
      .sort((a: any, b: any) => b.month.localeCompare(a.month))

    console.log(`📊 Stats calculated: ${totalRuns} runs, ${totalDistance.toFixed(1)}km total`)

    return NextResponse.json({
      overall: {
        totalRuns,
        totalDistance: Number.parseFloat(totalDistance.toFixed(2)),
        totalTime,
        avgPace: Number.parseFloat(avgPace.toFixed(2)),
        bestPace: bestPace === Infinity ? 0 : Number.parseFloat(bestPace.toFixed(2)),
        longestRun: Number.parseFloat(longestRun.toFixed(2)),
        longestDuration,
      },
      goals: goalStats,
      recent: recentActivitiesArray,
      monthly: monthlyStatsArray,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
