import { type NextRequest, NextResponse } from "next/server"
import { paramQuery, getCurrentUserId } from "@/lib/db"
import type { UpdateGoalRequest } from "@/lib/types"

// 获取单个目标
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId()
    const { id: goalId } = await params

    const goals = await paramQuery`SELECT * FROM goals WHERE id = ${goalId} AND user_id = ${userId}`

    const goal = Array.isArray(goals) ? goals[0] : goals

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Error fetching goal:", error)
    return NextResponse.json({ error: "Failed to fetch goal" }, { status: 500 })
  }
}

// 更新目标
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId()
    const { id: goalId } = await params
    const body: UpdateGoalRequest = await request.json()

    // 先检查目标是否存在
    const existingGoals = await paramQuery`SELECT * FROM goals WHERE id = ${goalId} AND user_id = ${userId}`
    const existingGoal = Array.isArray(existingGoals) ? existingGoals[0] : existingGoals

    if (!existingGoal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // 创建更新的数据对象，保留现有值
    const updateData = {
      title: body.title !== undefined ? body.title : existingGoal.title,
      type: body.type !== undefined ? body.type : existingGoal.type,
      target: body.target !== undefined ? body.target : existingGoal.target,
      current_value: body.current_value !== undefined ? body.current_value : existingGoal.current_value,
      unit: body.unit !== undefined ? body.unit : existingGoal.unit,
      deadline: body.deadline !== undefined ? body.deadline : existingGoal.deadline,
      description: body.description !== undefined ? body.description : existingGoal.description,
      status: body.status !== undefined ? body.status : existingGoal.status
    }

    // 检查是否有实际更新
    const hasChanges = Object.keys(body).some(key => {
      const typedKey = key as keyof UpdateGoalRequest
      return body[typedKey] !== undefined && body[typedKey] !== existingGoal[key]
    })
    
    if (!hasChanges) {
      return NextResponse.json({ goal: existingGoal })
    }

    // 执行更新
    await paramQuery`
      UPDATE goals SET 
        title = ${updateData.title},
        type = ${updateData.type},
        target = ${updateData.target},
        current_value = ${updateData.current_value},
        unit = ${updateData.unit},
        deadline = ${updateData.deadline},
        description = ${updateData.description},
        status = ${updateData.status},
        updated_at = NOW()
      WHERE id = ${goalId} AND user_id = ${userId}
    `

    // 获取更新后的目标
    const goals = await paramQuery`SELECT * FROM goals WHERE id = ${goalId} AND user_id = ${userId}`

    const goal = Array.isArray(goals) ? goals[0] : goals

    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}

// 删除目标
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  console.log("DELETE method called for goal deletion")
  try {
    const userId = getCurrentUserId()
    const { id: goalId } = await params
    console.log(`Attempting to delete goal ${goalId} for user ${userId}`)

    // 先检查目标是否存在
    const goals = await paramQuery`SELECT * FROM goals WHERE id = ${goalId} AND user_id = ${userId}`

    const goal = Array.isArray(goals) ? goals[0] : goals

    if (!goal) {
      console.log("Goal not found")
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // 删除目标
    await paramQuery`DELETE FROM goals WHERE id = ${goalId} AND user_id = ${userId}`
    console.log("Goal deleted successfully")

    return NextResponse.json({ message: "Goal deleted successfully" })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}
