import { type NextRequest, NextResponse } from "next/server"
import { query, getCurrentUserId } from "@/lib/db"
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

    const activities = await query(
      `SELECT * FROM activities 
       WHERE user_id = ? 
       ORDER BY date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    )

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

    await query(
      `INSERT INTO activities (id, user_id, date, distance, duration, pace, location, notes, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [activityId, userId, body.date, body.distance, body.duration, body.pace, 
       body.location || "", body.notes || "", JSON.stringify(body.images || [])]
    )

    // 获取刚创建的活动
    const activities = await query(
      "SELECT * FROM activities WHERE id = ?",
      [activityId]
    )

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

// 更新目标进度的辅助函数
async function updateGoalProgress(userId: string, activity: CreateActivityRequest) {
  try {
    // 获取所有活跃的目标
    const activeGoals = await query(
      "SELECT * FROM goals WHERE user_id = ? AND status = 'active'",
      [userId]
    )

    const goalsArray = Array.isArray(activeGoals) ? activeGoals : [activeGoals]

    for (const goal of goalsArray) {
      if (!goal) continue
      
      let newCurrentValue = goal.current_value

      switch (goal.type) {
        case "distance":
          newCurrentValue += activity.distance
          break
        case "time":
          newCurrentValue += activity.duration
          break
        case "frequency":
          newCurrentValue += 1
          break
      }

      const newStatus = newCurrentValue >= goal.target ? "completed" : "active"

      await query(
        "UPDATE goals SET current_value = ?, status = ? WHERE id = ?",
        [newCurrentValue, newStatus, goal.id]
      )
    }
  } catch (error) {
    console.error("Error updating goal progress:", error)
  }
}
