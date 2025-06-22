import { neon } from "@neondatabase/serverless"

// 声明全局类型
declare global {
  var mockData: {
    goals: any[]
    activities: any[]
    users: any[]
  } | undefined
  var globalDbInstance: any
}

// 全局模拟数据存储（放在全局作用域，确保数据持久性）
const globalMockData = {
  goals: [] as any[],
  activities: [] as any[],
  users: [
    {
      id: "550e8400-e29b-41d4-a716-446655440000",
      email: "demo@example.com",
      name: "Demo User",
      created_at: new Date(),
      updated_at: new Date()
    }
  ]
}

// 确保数据存储在全局作用域（只初始化一次）
if (typeof global !== 'undefined') {
  if (!global.mockData) {
    global.mockData = globalMockData
    console.log("🌍 Initialized global mock data storage")
  }
}

// 获取全局数据存储
function getMockData() {
  if (typeof global !== 'undefined' && global.mockData) {
    return global.mockData
  }
  return globalMockData
}

// 创建模拟数据库函数
function createMockDatabase() {
  console.log("🔧 Creating mock database instance")

  // 返回兼容 neon 的函数
  return function(sql: TemplateStringsArray, ...params: any[]) {
    const mockData = getMockData()
    const query = sql.join('?').toLowerCase()
    console.log(`🔍 Mock DB Query: ${query}`, params.slice(0, 3))
    console.log(`📊 Current data: ${mockData.goals.length} goals, ${mockData.activities.length} activities`)
    
    // SELECT 查询
    if (query.includes('select') && query.includes('goals')) {
      console.log(`📊 Goals query executed. Available goals:`, mockData.goals.map((g: any) => g.title))
      console.log(`🔍 Raw query: "${query}"`)
      console.log(`🔍 Raw params:`, params)
      
      if (query.includes('where')) {
        console.log(`📋 Processing WHERE conditions for goals`)
        console.log(`🔍 Query contains "id =": ${query.includes('id =')}`)
        console.log(`🔍 Query contains "user_id =": ${query.includes('user_id =')}`)
        
        if (query.includes('id =') && query.includes('user_id =')) {
          // 同时包含 id 和 user_id 的查询（如目标删除前的验证）
          const goalId = params[0] // 第一个参数是goal ID
          const userId = params[1] // 第二个参数是user ID
          console.log(`🔍 Looking for goal ID: "${goalId}" for user: "${userId}"`)
          console.log(`📋 Available goal data:`, mockData.goals.map((g: any) => ({
            id: g.id,
            user_id: g.user_id,
            title: g.title,
            idMatch: g.id === goalId,
            userMatch: g.user_id === userId,
            bothMatch: g.id === goalId && g.user_id === userId
          })))
          const result = mockData.goals.filter((g: any) => g.id === goalId && g.user_id === userId)
          console.log(`📊 Found ${result.length} goals matching criteria`)
          return Promise.resolve(result)
        }
        if (query.includes('user_id =')) {
          const userId = params.find(p => typeof p === 'string' && !p.match(/^\d{4}-\d{2}-\d{2}$/))
          console.log(`🔍 Filtering by user_id: ${userId}`)
          const result = mockData.goals.filter((g: any) => g.user_id === userId)
          console.log(`📊 Found ${result.length} goals for user`)
          return Promise.resolve(result)
        }
        if (query.includes('id =')) {
          const goalId = params.find(p => typeof p === 'string' && p.includes('-'))
          const result = mockData.goals.filter((g: any) => g.id === goalId)
          return Promise.resolve(result)
        }
        if (query.includes('status') && query.includes('active')) {
          const result = mockData.goals.filter((g: any) => g.status === 'active')
          return Promise.resolve(result)
        }
      }
      console.log(`📊 Returning all ${mockData.goals.length} goals`)
      return Promise.resolve(mockData.goals)
    }
    
    if (query.includes('select') && query.includes('activities')) {
      console.log(`🏃 Activities query executed. Available activities:`, mockData.activities.map((a: any) => `${a.date}-${a.distance}km`))
      console.log(`🔍 Raw query: "${query}"`)
      console.log(`🔍 Raw params:`, params)
      
      let result = mockData.activities
      
      // 处理WHERE条件
      if (query.includes('where')) {
        console.log(`📋 Processing WHERE conditions`)
        
        if (query.includes('date >=') && query.includes('date <=')) {
          const startDate = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/))
          const endDate = params.find((p, i) => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/) && i > params.indexOf(startDate))
          if (startDate && endDate) {
            result = result.filter((a: any) => a.date >= startDate && a.date <= endDate)
            console.log(`📅 Found ${result.length} activities between ${startDate} and ${endDate}`)
          }
        } else if (query.includes('user_id =') && query.includes('id =')) {
          // 同时有 id 和 user_id 的查询（通常是删除或更新前的验证）
          const activityId = params.find(p => typeof p === 'string' && p.includes('-'))
          const userId = params.find(p => typeof p === 'string' && !p.match(/^\d{4}-\d{2}-\d{2}$/) && p !== activityId)
          console.log(`🔍 Looking for activity ID: ${activityId} for user: ${userId}`)
          result = result.filter((a: any) => a.id === activityId && a.user_id === userId)
          console.log(`🏃 Found ${result.length} activities matching criteria`)
        } else if (query.includes('user_id =')) {
          // 对于复杂查询，user_id应该是第一个字符串参数
          console.log(`🔍 All params:`, params)
          console.log(`🔍 Param types:`, params.map(p => typeof p))
          console.log(`🔍 Param values:`, params.map(p => `"${p}"`))
          
          const userId = params[0] // 直接取第一个参数，因为SQL中第一个?就是user_id
          console.log(`🔍 Selected userId (params[0]): "${userId}" (type: ${typeof userId})`)
          console.log(`🔍 Filtering by user_id. Looking for: "${userId}"`)
          console.log(`📋 Available user_ids:`, mockData.activities.map((a: any) => `"${a.user_id}"`))
          console.log(`🔍 Exact match test:`, mockData.activities.map((a: any) => ({
            stored: `"${a.user_id}"`,
            query: `"${userId}"`,
            equal: a.user_id === userId,
            strictEqual: a.user_id === userId
          })))
          
          result = result.filter((a: any) => a.user_id === userId)
          console.log(`🏃 Found ${result.length} activities for user: ${userId}`)
        } else if (query.includes('id =')) {
          const activityId = params.find(p => typeof p === 'string' && p.includes('-'))
          console.log(`🔍 Looking for activity ID: ${activityId}`)
          result = result.filter((a: any) => a.id === activityId)
          console.log(`🏃 Found ${result.length} activities with ID: ${activityId}`)
        }
      } else {
        console.log(`📋 No WHERE clause, returning all activities`)
      }
      
      // 处理ORDER BY
      if (query.includes('order by date desc')) {
        result = result.sort((a: any, b: any) => {
          const dateCompare = b.date.localeCompare(a.date)
          if (dateCompare !== 0) return dateCompare
          // 如果日期相同，再按created_at排序
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
        console.log(`📋 Activities sorted by date DESC`)
      }
      
      // 处理LIMIT和OFFSET
      if (query.includes('limit')) {
        const limitParam = params.find(p => typeof p === 'number' && p > 0)
        const offsetParam = params.find(p => typeof p === 'number' && p >= 0 && p !== limitParam)
        
        if (limitParam !== undefined) {
          const limit = limitParam
          const offset = offsetParam || 0
          result = result.slice(offset, offset + limit)
          console.log(`📋 Applied pagination: offset=${offset}, limit=${limit}, returned=${result.length}`)
        }
      }
      
      console.log(`🏃 Final result: Returning ${result.length} activities`)
      return Promise.resolve(result)
    }
    
    // INSERT 查询
    if (query.includes('insert') && query.includes('goals')) {
      const newGoal = {
        id: params[0] || Date.now().toString(),
        user_id: params[1] || "550e8400-e29b-41d4-a716-446655440000",
        title: params[2] || "Sample Goal",
        type: params[3] || "distance",
        target: params[4] || 10,
        current_value: 0,
        unit: params[5] || "km",
        start_date: params[6] || new Date().toISOString().split('T')[0],
        deadline: params[7] || new Date().toISOString().split('T')[0],
        description: params[8] || "",
        status: "active",
        created_at: new Date(),
        updated_at: new Date()
      }
      mockData.goals.push(newGoal)
      console.log(`✅ Goal created: "${newGoal.title}" (Total: ${mockData.goals.length})`)
      return Promise.resolve([newGoal])
    }
    
    if (query.includes('insert') && query.includes('activities')) {
      const newActivity = {
        id: params[0] || Date.now().toString(),
        user_id: params[1] || "550e8400-e29b-41d4-a716-446655440000",
        date: params[2] || new Date().toISOString().split('T')[0],
        distance: params[3] || 5,
        duration: params[4] || 30,
        pace: params[5] || 6,
        location: params[6] || "",
        notes: params[7] || "",
        images: JSON.parse(params[8] || '[]'),
        created_at: new Date(),
        updated_at: new Date()
      }
      mockData.activities.push(newActivity)
      console.log(`✅ Activity created: ${newActivity.date} - ${newActivity.distance}km (Total: ${mockData.activities.length})`)
      return Promise.resolve([newActivity])
    }
    
    // UPDATE 查询
    if (query.includes('update') && query.includes('goals')) {
      const goalId = params.find(p => typeof p === 'string' && p.includes('-'))
      const goalIndex = mockData.goals.findIndex((g: any) => g.id === goalId)
      
      if (goalIndex !== -1) {
        if (query.includes('current_value')) {
          const currentValue = params.find(p => typeof p === 'number' && p >= 0)
          const status = params.find(p => typeof p === 'string' && ['active', 'completed', 'paused'].includes(p))
          
          if (currentValue !== undefined) {
            mockData.goals[goalIndex].current_value = currentValue
          }
          if (status) {
            mockData.goals[goalIndex].status = status
          }
          mockData.goals[goalIndex].updated_at = new Date()
          
          console.log(`📈 Goal updated: "${mockData.goals[goalIndex].title}" - ${mockData.goals[goalIndex].current_value}/${mockData.goals[goalIndex].target}`)
        }
      }
      return Promise.resolve([])
    }
    
    // DELETE 查询
    if (query.includes('delete') && query.includes('goals')) {
      if (query.includes('id =') && query.includes('user_id =')) {
        // 同时包含 id 和 user_id 的删除查询
        const goalId = params[0] // 第一个参数是goal ID
        const userId = params[1] // 第二个参数是user ID
        console.log(`🗑️ Attempting to delete goal ID: ${goalId} for user: ${userId}`)
        
        const goalIndex = mockData.goals.findIndex((g: any) => g.id === goalId && g.user_id === userId)
        
        if (goalIndex !== -1) {
          const deletedGoal = mockData.goals.splice(goalIndex, 1)[0]
          console.log(`✅ Goal deleted: "${deletedGoal.title}" (Remaining: ${mockData.goals.length})`)
        } else {
          console.log(`⚠️ Goal not found for deletion: ID=${goalId}, User=${userId}`)
        }
      } else {
        // 简单的按ID删除
        const goalId = params.find(p => typeof p === 'string' && p.includes('-'))
        const goalIndex = mockData.goals.findIndex((g: any) => g.id === goalId)
        
        if (goalIndex !== -1) {
          const deletedGoal = mockData.goals.splice(goalIndex, 1)[0]
          console.log(`✅ Goal deleted: "${deletedGoal.title}" (Remaining: ${mockData.goals.length})`)
        } else {
          console.log(`⚠️ Goal not found for deletion: ${goalId}`)
        }
      }
      return Promise.resolve([])
    }
    
    if (query.includes('delete') && query.includes('activities')) {
      const activityId = params.find(p => typeof p === 'string' && p.includes('-'))
      console.log(`🗑️ Attempting to delete activity: ${activityId}`)
      console.log(`📋 Available activities:`, mockData.activities.map((a: any) => a.id))
      
      const activityIndex = mockData.activities.findIndex((a: any) => a.id === activityId)
      
      if (activityIndex !== -1) {
        const deletedActivity = mockData.activities.splice(activityIndex, 1)[0]
        console.log(`✅ Activity deleted: ${deletedActivity.date} - ${deletedActivity.distance}km (Remaining: ${mockData.activities.length})`)
      } else {
        console.log(`⚠️ Activity not found for deletion: ${activityId}`)
      }
      return Promise.resolve([])
    }
    
    console.log(`❓ Unhandled query: ${query}`)
    return Promise.resolve([])
  }
}

// 获取数据库实例（确保全局单例）
export const getDB = async () => {
  // 使用全局变量确保单例
  if (typeof global !== 'undefined') {
    if (!global.globalDbInstance) {
      console.log("🔧 Creating new global mock database instance")
      global.globalDbInstance = createMockDatabase()
    } else {
      console.log("♻️ Reusing existing global database instance")
    }
    return global.globalDbInstance
  } else {
    // 非服务器环境的fallback
    if (!globalDbInstance) {
      console.log("🔧 Creating new mock database instance (non-global)")
      globalDbInstance = createMockDatabase()
    }
    return globalDbInstance
  }
}

// 安全的参数化查询函数
export async function paramQuery(sql: TemplateStringsArray, ...params: any[]) {
  try {
    const db = await getDB()
    return await db(sql, ...params)
  } catch (error) {
    console.error("🚨 Database query error:", error)
    throw error
  }
}

// 获取当前用户ID
export function getCurrentUserId(): string {
  return "550e8400-e29b-41d4-a716-446655440000"
}

// 清空数据库（仅用于测试）
export function clearMockData() {
  const mockData = getMockData()
  mockData.goals = []
  mockData.activities = []
  console.log("🧹 Mock database cleared")
}

// 获取数据库状态（用于调试）
export function getMockDataStatus() {
  const mockData = getMockData()
  return {
    goals: mockData.goals.length,
    activities: mockData.activities.length,
    goalTitles: mockData.goals.map((g: any) => g.title),
    activityDates: mockData.activities.map((a: any) => a.date)
  }
}

// 声明全局变量（非global环境下的fallback）
let globalDbInstance: any = null