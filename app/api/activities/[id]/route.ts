import { type NextRequest, NextResponse } from "next/server"
import { query, getCurrentUserId } from "@/lib/db"
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

    const activities = await query(
      "SELECT * FROM activities WHERE id = ? AND user_id = ?",
      [activityId, userId]
    )

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

    // 获取原始活动数据（用于回滚目标进度）
    const originalActivities = await query(
      "SELECT * FROM activities WHERE id = ? AND user_id = ?",
      [activityId, userId]
    )

    const originalActivity = Array.isArray(originalActivities) ? originalActivities[0] : originalActivities

    if (!originalActivity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    // 构建更新字段
    const updateFields = []
    const updateValues = []

    if (body.date !== undefined) {
      updateFields.push("date = ?")
      updateValues.push(body.date)
    }
    if (body.distance !== undefined) {
      updateFields.push("distance = ?")
      updateValues.push(body.distance)
    }
    if (body.duration !== undefined) {
      updateFields.push("duration = ?")
      updateValues.push(body.duration)
    }
    if (body.pace !== undefined) {
      updateFields.push("pace = ?")
      updateValues.push(body.pace)
    }
    if (body.location !== undefined) {
      updateFields.push("location = ?")
      updateValues.push(body.location)
    }
    if (body.notes !== undefined) {
      updateFields.push("notes = ?")
      updateValues.push(body.notes)
    }
    if (body.images !== undefined) {
      updateFields.push("images = ?")
      updateValues.push(JSON.stringify(body.images))
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // 添加WHERE条件的参数
    updateValues.push(activityId, userId)

    await query(
      `UPDATE activities SET ${updateFields.join(", ")} WHERE id = ? AND user_id = ?`,
      updateValues
    )

    // 获取更新后的活动
    const updatedActivities = await query(
      "SELECT * FROM activities WHERE id = ? AND user_id = ?",
      [activityId, userId]
    )

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
    const activities = await query(
      "SELECT * FROM activities WHERE id = ? AND user_id = ?",
      [activityId, userId]
    )

    const activity = Array.isArray(activities) ? activities[0] : activities

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 })
    }

    // 删除活动
    await query(
      "DELETE FROM activities WHERE id = ? AND user_id = ?",
      [activityId, userId]
    )

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
    const goalsResult = await query(
      "SELECT * FROM goals WHERE user_id = ?",
      [userId]
    )

    const goals = Array.isArray(goalsResult) ? goalsResult : [goalsResult]

    const activitiesResult = await query(
      "SELECT * FROM activities WHERE user_id = ?",
      [userId]
    )

    const activities = Array.isArray(activitiesResult) ? activitiesResult : [activitiesResult]

    for (const goal of goals) {
      if (!goal) continue
      
      let currentValue = 0

      for (const activity of activities) {
        if (!activity) continue
        
        switch (goal.type) {
          case "distance":
            currentValue += Number(activity.distance) || 0
            break
          case "time":
            currentValue += Number(activity.duration) || 0
            break
          case "frequency":
            currentValue += 1
            break
        }
      }

      const status = currentValue >= goal.target ? "completed" : "active"

      await query(
        "UPDATE goals SET current_value = ?, status = ? WHERE id = ?",
        [currentValue, status, goal.id]
      )
    }
  } catch (error) {
    console.error("Error recalculating goal progress:", error)
  }
}
