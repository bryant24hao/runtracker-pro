import { type NextRequest, NextResponse } from "next/server"
import { paramQuery, getCurrentUserId } from "@/lib/db"
import type { UpdateActivityRequest } from "@/lib/types"

// 解析活动数据的辅助函数
function parseActivityData(activity: any) {
  if (!activity) return activity
  
  return {
    ...activity,
    images: typeof activity.images === 'string' ? JSON.parse(activity.images || '[]') : (activity.images || [])
  }
}

// 获取单个活动
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId()
    const { id: activityId } = await params

    const activities = await paramQuery`SELECT * FROM activities WHERE id = ${activityId} AND user_id = ${userId}`

    const activity = Array.isArray(activities) ? activities[0] : activities

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    const parsedActivity = parseActivityData(activity)

    return NextResponse.json({ activity: parsedActivity })
  } catch (error) {
    console.error("Error fetching activity:", error)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}

// 更新活动
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId()
    const { id: activityId } = await params
    const body: UpdateActivityRequest = await request.json()

    // 获取原始活动数据
    const originalActivities = await paramQuery`SELECT * FROM activities WHERE id = ${activityId} AND user_id = ${userId}`

    const originalActivity = Array.isArray(originalActivities) ? originalActivities[0] : originalActivities

    if (!originalActivity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    // 创建更新的数据对象，保留现有值
    const updateData = {
      date: body.date !== undefined ? body.date : originalActivity.date,
      distance: body.distance !== undefined ? body.distance : originalActivity.distance,
      duration: body.duration !== undefined ? body.duration : originalActivity.duration,
      pace: body.pace !== undefined ? body.pace : originalActivity.pace,
      location: body.location !== undefined ? body.location : originalActivity.location,
      notes: body.notes !== undefined ? body.notes : originalActivity.notes,
      images: body.images !== undefined ? JSON.stringify(body.images) : originalActivity.images
    }

    // 检查是否有实际更新
    const hasChanges = Object.keys(body).some(key => {
      const typedKey = key as keyof UpdateActivityRequest
      if (typedKey === 'images') {
        return body[typedKey] !== undefined && JSON.stringify(body[typedKey]) !== originalActivity.images
      }
      return body[typedKey] !== undefined && body[typedKey] !== originalActivity[key]
    })

    if (!hasChanges) {
      const parsedActivity = parseActivityData(originalActivity)
      return NextResponse.json({ activity: parsedActivity })
    }

    // 执行更新
    await paramQuery`
      UPDATE activities SET 
        date = ${updateData.date},
        distance = ${updateData.distance},
        duration = ${updateData.duration},
        pace = ${updateData.pace},
        location = ${updateData.location},
        notes = ${updateData.notes},
        images = ${updateData.images},
        updated_at = NOW()
      WHERE id = ${activityId} AND user_id = ${userId}
    `

    // 获取更新后的活动
    const updatedActivities = await paramQuery`SELECT * FROM activities WHERE id = ${activityId} AND user_id = ${userId}`

    const activity = Array.isArray(updatedActivities) ? updatedActivities[0] : updatedActivities
    const parsedActivity = parseActivityData(activity)

    // 重新计算目标进度
    await recalculateGoalProgress(userId)

    return NextResponse.json({ activity: parsedActivity })
  } catch (error) {
    console.error("Error updating activity:", error)
    return NextResponse.json({ error: "Failed to update activity" }, { status: 500 })
  }
}

// 删除活动
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId()
    const { id: activityId } = await params

    // 先检查活动是否存在
    const activities = await paramQuery`SELECT * FROM activities WHERE id = ${activityId} AND user_id = ${userId}`

    const activity = Array.isArray(activities) ? activities[0] : activities

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    // 删除活动
    await paramQuery`DELETE FROM activities WHERE id = ${activityId} AND user_id = ${userId}`

    // 重新计算目标进度
    await recalculateGoalProgress(userId)

    return NextResponse.json({ message: "Activity deleted successfully" })
  } catch (error) {
    console.error("Error deleting activity:", error)
    return NextResponse.json({ error: "Failed to delete activity" }, { status: 500 })
  }
}

// 重新计算目标进度的辅助函数
async function recalculateGoalProgress(userId: string) {
  try {
    // 获取所有活跃的目标
    const goalsResult = await paramQuery`SELECT * FROM goals WHERE user_id = ${userId} AND status = 'active'`
    const goals = Array.isArray(goalsResult) ? goalsResult : [goalsResult].filter(Boolean)

    for (const goal of goals) {
      if (!goal) continue
      
      console.log(`🔄 Recalculating progress for goal: "${goal.title}"`)

      // 获取目标日期范围内的所有活动
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

      console.log(`📊 Goal "${goal.title}": ${newCurrentValue}/${goal.target} ${goal.unit} (${newStatus})`)

      await paramQuery`UPDATE goals SET current_value = ${newCurrentValue}, status = ${newStatus} WHERE id = ${goal.id}`
    }
  } catch (error) {
    console.error("Error recalculating goal progress:", error)
  }
}
