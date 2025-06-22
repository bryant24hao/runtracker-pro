import { type NextRequest, NextResponse } from "next/server"
import { paramQuery, getCurrentUserId } from "@/lib/db"
import type { CreateGoalRequest } from "@/lib/types"
import { randomUUID } from "crypto"

// 获取所有目标
export async function GET() {
  try {
    const userId = getCurrentUserId()

    const goals = await paramQuery`SELECT * FROM goals WHERE user_id = ${userId} ORDER BY created_at DESC`

    return NextResponse.json({ goals })
  } catch (error) {
    console.error("Error fetching goals:", error)
    return NextResponse.json({ error: "Failed to fetch goals" }, { status: 500 })
  }
}

// 创建新目标
export async function POST(request: NextRequest) {
  try {
    const userId = getCurrentUserId()
    const body: CreateGoalRequest = await request.json()

    // 验证必填字段
    if (!body.title || !body.type || !body.target || !body.unit || !body.start_date || !body.deadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 验证开始日期不能晚于截止日期
    if (new Date(body.start_date) > new Date(body.deadline)) {
      return NextResponse.json({ error: "Start date cannot be later than deadline" }, { status: 400 })
    }

    const goalId = randomUUID()
    
    await paramQuery`
      INSERT INTO goals (id, user_id, title, type, target, unit, start_date, deadline, description)
      VALUES (${goalId}, ${userId}, ${body.title}, ${body.type}, ${body.target}, ${body.unit}, ${body.start_date}, ${body.deadline}, ${body.description || ""})
    `

    // 获取刚创建的目标
    const goals = await paramQuery`SELECT * FROM goals WHERE id = ${goalId}`

    const goal = Array.isArray(goals) ? goals[0] : goals

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error("Error creating goal:", error)
    return NextResponse.json({ error: "Failed to create goal" }, { status: 500 })
  }
}
