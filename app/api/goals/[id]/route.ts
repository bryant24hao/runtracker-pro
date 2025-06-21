import { type NextRequest, NextResponse } from "next/server"
import { query, getCurrentUserId } from "@/lib/db"
import type { UpdateGoalRequest } from "@/lib/types"

// 获取单个目标
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId()
    const { id: goalId } = await params

    const goals = await query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [goalId, userId]
    )

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

    // 构建更新字段
    const updateFields = []
    const updateValues = []

    if (body.title !== undefined) {
      updateFields.push("title = ?")
      updateValues.push(body.title)
    }
    if (body.type !== undefined) {
      updateFields.push("type = ?")
      updateValues.push(body.type)
    }
    if (body.target !== undefined) {
      updateFields.push("target = ?")
      updateValues.push(body.target)
    }
    if (body.current_value !== undefined) {
      updateFields.push("current_value = ?")
      updateValues.push(body.current_value)
    }
    if (body.unit !== undefined) {
      updateFields.push("unit = ?")
      updateValues.push(body.unit)
    }
    if (body.deadline !== undefined) {
      updateFields.push("deadline = ?")
      updateValues.push(body.deadline)
    }
    if (body.description !== undefined) {
      updateFields.push("description = ?")
      updateValues.push(body.description)
    }
    if (body.status !== undefined) {
      updateFields.push("status = ?")
      updateValues.push(body.status)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // 添加WHERE条件的参数
    updateValues.push(goalId, userId)

    await query(
      `UPDATE goals SET ${updateFields.join(", ")} WHERE id = ? AND user_id = ?`,
      updateValues
    )

    // 获取更新后的目标
    const goals = await query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [goalId, userId]
    )

    const goal = Array.isArray(goals) ? goals[0] : goals

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error("Error updating goal:", error)
    return NextResponse.json({ error: "Failed to update goal" }, { status: 500 })
  }
}

// 删除目标
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getCurrentUserId()
    const { id: goalId } = await params

    // 先检查目标是否存在
    const goals = await query(
      "SELECT * FROM goals WHERE id = ? AND user_id = ?",
      [goalId, userId]
    )

    const goal = Array.isArray(goals) ? goals[0] : goals

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 })
    }

    // 删除目标
    await query(
      "DELETE FROM goals WHERE id = ? AND user_id = ?",
      [goalId, userId]
    )

    return NextResponse.json({ message: "Goal deleted successfully" })
  } catch (error) {
    console.error("Error deleting goal:", error)
    return NextResponse.json({ error: "Failed to delete goal" }, { status: 500 })
  }
}
