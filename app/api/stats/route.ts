import { NextResponse } from "next/server"
import { paramQuery, getCurrentUserId } from "@/lib/db"

export async function GET() {
  try {
    const userId = getCurrentUserId()

    // 获取总体统计
    const statsResult = await paramQuery`
      SELECT 
        COUNT(*) as total_runs,
        COALESCE(SUM(distance), 0) as total_distance,
        COALESCE(SUM(duration), 0) as total_time,
        COALESCE(AVG(pace), 0) as avg_pace,
        COALESCE(MIN(pace), 0) as best_pace,
        COALESCE(MAX(distance), 0) as longest_run,
        COALESCE(MAX(duration), 0) as longest_duration
      FROM activities 
      WHERE user_id = ${userId}
    `

    const stats = Array.isArray(statsResult) ? statsResult[0] : statsResult

    // 获取目标统计
    const goalStatsResult = await paramQuery`
      SELECT 
        status,
        COUNT(*) as count
      FROM goals 
      WHERE user_id = ${userId}
      GROUP BY status
    `

    const goalStats = Array.isArray(goalStatsResult) ? goalStatsResult : [goalStatsResult]

    // 获取最近7天的活动 (PostgreSQL语法)
    const recentActivitiesResult = await paramQuery`
      SELECT date, COUNT(*) as runs, SUM(distance) as distance
      FROM activities 
      WHERE user_id = ${userId}
        AND date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY date
      ORDER BY date DESC
    `

    const recentActivities = Array.isArray(recentActivitiesResult) ? recentActivitiesResult : [recentActivitiesResult]

    // 获取月度统计 (PostgreSQL语法)
    const monthlyStatsResult = await paramQuery`
      SELECT 
        TO_CHAR(date, 'YYYY-MM') as month,
        COUNT(*) as runs,
        SUM(distance) as distance,
        SUM(duration) as duration
      FROM activities 
      WHERE user_id = ${userId}
        AND date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month DESC
    `

    const monthlyStats = Array.isArray(monthlyStatsResult) ? monthlyStatsResult : [monthlyStatsResult]

    return NextResponse.json({
      overall: {
        totalRuns: Number.parseInt(stats?.total_runs || "0"),
        totalDistance: Number.parseFloat(stats?.total_distance || "0"),
        totalTime: Number.parseInt(stats?.total_time || "0"),
        avgPace: Number.parseFloat(stats?.avg_pace || "0"),
        bestPace: Number.parseFloat(stats?.best_pace || "0"),
        longestRun: Number.parseFloat(stats?.longest_run || "0"),
        longestDuration: Number.parseInt(stats?.longest_duration || "0"),
      },
      goals: goalStats.filter(stat => stat).reduce((acc: any, stat: any) => {
        acc[stat.status] = Number.parseInt(stat.count)
        return acc
      }, {}),
      recent: recentActivities.filter(activity => activity),
      monthly: monthlyStats.filter(stat => stat),
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
