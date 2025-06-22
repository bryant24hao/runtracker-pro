import { NextResponse } from "next/server"
import { paramQuery, getCurrentUserId } from "@/lib/db"

// 重新计算所有目标的进度（基于日期范围）
export async function POST() {
  console.log("🔄 开始重新计算所有目标进度...")
  
  try {
    const userId = getCurrentUserId()

    // 获取所有活跃目标
    const goals = await paramQuery`SELECT * FROM goals WHERE user_id = ${userId} AND status = 'active'`
    
    console.log(`📊 找到 ${Array.isArray(goals) ? goals.length : 0} 个活跃目标`)

    // 获取所有活动
    const activities = await paramQuery`SELECT * FROM activities WHERE user_id = ${userId}`
    
    console.log(`🏃 找到 ${Array.isArray(activities) ? activities.length : 0} 个跑步活动`)

    // 为每个目标重新计算进度
    for (const goal of Array.isArray(goals) ? goals : [goals].filter(Boolean)) {
      // 筛选在目标日期范围内的活动
      const relevantActivities = (Array.isArray(activities) ? activities : [activities].filter(Boolean))
        .filter(activity => {
          const activityDate = new Date(activity.date)
          const startDate = new Date(goal.start_date)
          const endDate = new Date(goal.deadline)
          
          return activityDate >= startDate && activityDate <= endDate
        })

      console.log(`📅 目标"${goal.title}"在日期范围内找到 ${relevantActivities.length} 个相关活动`)

      // 根据目标类型计算当前值
      let currentValue = 0

      switch (goal.type) {
        case 'distance':
          currentValue = relevantActivities.reduce((sum, activity) => sum + (activity.distance || 0), 0)
          break
        case 'time':
          currentValue = relevantActivities.reduce((sum, activity) => sum + (activity.duration || 0), 0)
          break
        case 'frequency':
          currentValue = relevantActivities.length
          break
        default:
          currentValue = 0
      }

      console.log(`📈 目标"${goal.title}"的进度：${currentValue}/${goal.target} ${goal.unit}`)

      // 检查目标是否已完成
      const newStatus = currentValue >= goal.target ? 'completed' : 'active'

      // 更新目标进度
      await paramQuery`
        UPDATE goals 
        SET current_value = ${currentValue}, status = ${newStatus}, updated_at = NOW()
        WHERE id = ${goal.id} AND user_id = ${userId}
      `

      if (newStatus === 'completed' && goal.status !== 'completed') {
        console.log(`🎉 目标"${goal.title}"已完成！`)
      }
    }

    console.log("✅ 目标进度重新计算完成")
    
    return NextResponse.json({ 
      message: "目标进度重新计算完成",
      processed: Array.isArray(goals) ? goals.length : (goals ? 1 : 0)
    })
    
  } catch (error) {
    console.error("❌ 重新计算目标进度时出错:", error)
    return NextResponse.json({ 
      error: "重新计算目标进度失败",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 