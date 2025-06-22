import { NextRequest, NextResponse } from "next/server"
import { getMockDataStatus, clearMockData, paramQuery, getCurrentUserId } from "@/lib/db"

export async function OPTIONS(request: NextRequest) {
  console.log("🧪 Test OPTIONS method called successfully!")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  
  clearMockData()
  return NextResponse.json({ 
    message: "已清空所有模拟数据",
    timestamp: new Date().toISOString()
  })
}

export async function DELETE(request: NextRequest) {
  console.log("🧪 Test DELETE method called successfully!")
  console.log("Request URL:", request.url)
  console.log("Request method:", request.method)
  
  clearMockData()
  return NextResponse.json({ 
    message: "已清空所有模拟数据",
    timestamp: new Date().toISOString()
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const debug = searchParams.get("debug")
  
  if (debug === "where") {
    // 测试WHERE条件匹配
    const testQuery = "select * from goals where id = ? and user_id = ?"
    return NextResponse.json({
      message: "WHERE条件匹配测试",
      testQuery: testQuery,
      hasWhere: testQuery.includes('where'),
      hasId: testQuery.includes('id ='),
      hasUserId: testQuery.includes('user_id ='),
      hasBoth: testQuery.includes('id =') && testQuery.includes('user_id ='),
      timestamp: new Date().toISOString()
    })
  }
  
  if (debug === "goal") {
    // 调试目标查询和删除
    try {
      const userId = getCurrentUserId()
      const goalId = searchParams.get("goalId")
      
      if (!goalId) {
        return NextResponse.json({
          message: "请提供goalId参数",
          timestamp: new Date().toISOString()
        })
      }
      
      console.log("🔍 Debug: Testing goal query and deletion")
      
      // 测试查询
      const queryResult = await paramQuery`SELECT * FROM goals WHERE id = ${goalId} AND user_id = ${userId}`
      
      return NextResponse.json({
        message: "目标查询和删除调试",
        userId: userId,
        goalId: goalId,
        queryResult: queryResult,
        queryResultArray: Array.isArray(queryResult) ? queryResult : [queryResult],
        found: queryResult && (Array.isArray(queryResult) ? queryResult.length > 0 : true),
        status: getMockDataStatus(),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json({
        message: "目标调试失败",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    }
  }
  
  if (debug === "simple") {
    // 简单查询测试 - 不带WHERE条件
    try {
      const activities = await paramQuery`SELECT * FROM activities ORDER BY date DESC`
      return NextResponse.json({
        message: "简单查询测试",
        activities: activities,
        count: Array.isArray(activities) ? activities.length : (activities ? 1 : 0),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json({
        message: "简单查询失败",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    }
  }
  
  if (debug === "raw") {
    // 查看原始数据
    try {
      const activities = await paramQuery`SELECT * FROM activities`
      return NextResponse.json({
        message: "原始活动数据",
        activities: activities,
        count: Array.isArray(activities) ? activities.length : (activities ? 1 : 0),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json({
        message: "查询失败",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    }
  }
  
  if (debug === "activities") {
    // 调试活动查询
    try {
      const userId = getCurrentUserId()
      console.log("🔍 Debug: Querying activities for user:", userId)
      
      const activities = await paramQuery`
        SELECT * FROM activities 
        WHERE user_id = ${userId}
        ORDER BY date DESC, created_at DESC
        LIMIT ${50} OFFSET ${0}
      `
      
      const activitiesArray = Array.isArray(activities) ? activities : [activities]
      const filteredActivities = activitiesArray.filter(activity => activity)
      
      return NextResponse.json({
        message: "活动查询调试",
        userId: userId,
        rawResult: activities,
        arrayResult: activitiesArray,
        filteredResult: filteredActivities,
        count: filteredActivities.length,
        status: getMockDataStatus(),
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      return NextResponse.json({
        message: "活动查询调试失败",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
    }
  }
  
  const status = getMockDataStatus()
  return NextResponse.json({
    message: "数据库状态",
    status: status,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  console.log("🧪 Test POST method called")
  return NextResponse.json({ 
    message: "POST method also works",
    timestamp: new Date().toISOString()
  })
} 