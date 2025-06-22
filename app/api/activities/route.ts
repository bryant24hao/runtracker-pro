import { type NextRequest, NextResponse } from "next/server"
import { paramQuery, getCurrentUserId } from "@/lib/db"
import type { CreateActivityRequest } from "@/lib/types"
import { randomUUID } from "crypto"

// 解析活动数据的辅助函数
function parseActivityData(activity: any) {
  if (!activity) return activity
  
  return {
    ...activity,
    images: typeof activity.images === 'string' ? JSON.parse(activity.images || '[]') : (activity.images || [])
  }
}

// 获取所有活动
export async function GET(request: NextRequest) {
  try {
    const userId = getCurrentUserId()
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    // 暂时去掉WHERE条件，因为我们是单用户系统
    const activities = await paramQuery`
      SELECT * FROM activities 
      ORDER BY date DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    const activitiesArray = Array.isArray(activities) ? activities : [activities]
    const parsedActivities = activitiesArray.filter(activity => activity).map(parseActivityData)

    return NextResponse.json({ activities: parsedActivities })
  } catch (error) {
    console.error("Error fetching activities:", error)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

// 创建新活动
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId()
    const body: CreateActivityRequest = await request.json()

    // 验证必填字段
    if (!body.date || !body.distance || !body.duration || !body.pace) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const activityId = randomUUID()

    await paramQuery`
      INSERT INTO activities (id, user_id, date, distance, duration, pace, location, notes, images)
      VALUES (${activityId}, ${userId}, ${body.date}, ${body.distance}, ${body.duration}, ${body.pace}, 
              ${body.location || ""}, ${body.notes || ""}, ${JSON.stringify(body.images || [])})
    `

    // 获取刚创建的活动
    const activities = await paramQuery`SELECT * FROM activities WHERE id = ${activityId}`

    const activity = Array.isArray(activities) ? activities[0] : activities
    const parsedActivity = parseActivityData(activity)

    // 更新相关目标的进度
    await updateGoalProgress(userId, body)

    return NextResponse.json({ activity: parsedActivity }, { status: 201 })
  } catch (error) {
    console.error("Error creating activity:", error)
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
  }
}

// 更新目标进度的辅助函数（基于日期范围）
async function updateGoalProgress(userId: string, activity: CreateActivityRequest) {
  try {
    // 获取所有活跃的目标
    const activeGoals = await paramQuery`SELECT * FROM goals WHERE user_id = ${userId} AND status = 'active'`

    const goalsArray = Array.isArray(activeGoals) ? activeGoals : [activeGoals]
    const activityDate = new Date(activity.date)

    for (const goal of goalsArray) {
      if (!goal) continue
      
      // 检查活动是否在目标的日期范围内
      const startDate = new Date(goal.start_date)
      const endDate = new Date(goal.deadline)
      
      if (activityDate < startDate || activityDate > endDate) {
        console.log(`📅 活动日期 ${activity.date} 不在目标"${goal.title}"的范围内 (${goal.start_date} - ${goal.deadline})`)
        continue
      }

      console.log(`✅ 活动日期 ${activity.date} 在目标"${goal.title}"的范围内，更新进度`)

      // 重新计算整个目标的进度（基于日期范围内的所有活动）
      const relevantActivities = await paramQuery`
        SELECT * FROM activities 
        WHERE user_id = ${userId} 
        AND date >= ${goal.start_date} 
        AND date <= ${goal.deadline}
      `

      const activitiesArray = Array.isArray(relevantActivities) ? relevantActivities : [relevantActivities].filter(Boolean)
      let newCurrentValue = 0

      switch (goal.type) {
        case "distance":
          newCurrentValue = activitiesArray.reduce((sum, act) => sum + (act?.distance || 0), 0)
          break
        case "time":
          newCurrentValue = activitiesArray.reduce((sum, act) => sum + (act?.duration || 0), 0)
          break
        case "frequency":
          newCurrentValue = activitiesArray.length
          break
      }

      const newStatus = newCurrentValue >= goal.target ? "completed" : "active"

      console.log(`📈 目标"${goal.title}"进度更新：${newCurrentValue}/${goal.target} ${goal.unit}`)

      await paramQuery`UPDATE goals SET current_value = ${newCurrentValue}, status = ${newStatus} WHERE id = ${goal.id}`

      if (newStatus === "completed" && goal.status !== "completed") {
        console.log(`🎉 目标"${goal.title}"已完成！`)
      }
    }
  } catch (error) {
    console.error("Error updating goal progress:", error)
  }
}
