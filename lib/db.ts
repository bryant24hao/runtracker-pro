import { neon } from "@neondatabase/serverless"

// 声明全局类型
declare global {
  var mockData: {
    goals: any[]
    activities: any[]
    users: any[]
  } | undefined
  var globalDbInstance: any
  var isDbInitialized: boolean
}

// 全局模拟数据存储
const initMockData = () => {
  if (typeof global !== 'undefined') {
    if (!global.mockData) {
      global.mockData = {
        goals: [] as any[],
        activities: [] as any[],
        users: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            email: "demo@runtracker.app",
            name: "Demo User",
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      }
      console.log("🌍 Initialized global mock data storage")
    }
    return global.mockData
  }
  
  // Fallback for non-global environments
  return {
    goals: [] as any[],
    activities: [] as any[],
    users: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "demo@runtracker.app", 
        name: "Demo User",
        created_at: new Date(),
        updated_at: new Date()
      }
    ]
  }
}

// 创建模拟数据库函数
function createMockDatabase() {
  console.log("🔧 Creating mock database instance")
  const mockData = initMockData()

  return function(sql: TemplateStringsArray, ...params: any[]) {
    const query = sql.join('?').toLowerCase()
    console.log(`🔍 Mock DB Query: ${query}`, params.slice(0, 3))
    console.log(`📊 Current data: ${mockData.goals.length} goals, ${mockData.activities.length} activities`)
    
    // INSERT Goals
    if (query.includes('insert') && query.includes('goals')) {
      const newGoal = {
        id: params[0] || Date.now().toString(),
        user_id: params[1] || "550e8400-e29b-41d4-a716-446655440000",
        title: params[2] || "New Goal",
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
    
    // INSERT Activities
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
    
    // SELECT Goals
    if (query.includes('select') && query.includes('goals')) {
      console.log(`📊 Goals query executed. Available goals:`, mockData.goals.map((g: any) => g.title))
      
      if (query.includes('where') && query.includes('user_id')) {
        const userId = params.find(p => typeof p === 'string' && !p.match(/^\d{4}-\d{2}-\d{2}$/))
        const result = mockData.goals.filter((g: any) => g.user_id === userId)
        console.log(`📊 Found ${result.length} goals for user ${userId}`)
        return Promise.resolve(result)
      }
      
      if (query.includes('where') && query.includes('id =')) {
        const goalId = params.find(p => typeof p === 'string' && p.includes('-'))
        const result = mockData.goals.filter((g: any) => g.id === goalId)
        return Promise.resolve(result)
      }
      
      console.log(`📊 Returning all ${mockData.goals.length} goals`)
      return Promise.resolve(mockData.goals)
    }
    
    // SELECT Activities  
    if (query.includes('select') && query.includes('activities')) {
      console.log(`🏃 Activities query executed. Available activities:`, mockData.activities.map((a: any) => `${a.date}-${a.distance}km`))
      
      let result = mockData.activities
      
      if (query.includes('where')) {
        if (query.includes('date >=') && query.includes('date <=')) {
          const startDate = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/))
          const endDate = params.find((p, i) => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/) && i > params.indexOf(startDate))
          if (startDate && endDate) {
            result = result.filter((a: any) => a.date >= startDate && a.date <= endDate)
            console.log(`📅 Found ${result.length} activities between ${startDate} and ${endDate}`)
          }
        } else if (query.includes('user_id =')) {
          const userId = params[0]
          result = result.filter((a: any) => a.user_id === userId)
          console.log(`🏃 Found ${result.length} activities for user: ${userId}`)
        } else if (query.includes('id =')) {
          const activityId = params.find(p => typeof p === 'string' && p.includes('-'))
          result = result.filter((a: any) => a.id === activityId)
          console.log(`🏃 Found ${result.length} activities with ID: ${activityId}`)
        }
      }
      
      if (query.includes('order by date desc')) {
        result = result.sort((a: any, b: any) => b.date.localeCompare(a.date))
        console.log(`📋 Activities sorted by date DESC`)
      }
      
      if (query.includes('limit')) {
        const limitParam = params.find(p => typeof p === 'number' && p > 0)
        if (limitParam) {
          const offset = params.find(p => typeof p === 'number' && p >= 0 && p !== limitParam) || 0
          result = result.slice(offset, offset + limitParam)
          console.log(`📋 Applied pagination: limit=${limitParam}, returned=${result.length}`)
        }
      }
      
      console.log(`🏃 Final result: Returning ${result.length} activities`)
      return Promise.resolve(result)
    }
    
    // UPDATE Goals
    if (query.includes('update') && query.includes('goals')) {
      const goalId = params.find(p => typeof p === 'string' && p.includes('-'))
      const goalIndex = mockData.goals.findIndex((g: any) => g.id === goalId)
      
      if (goalIndex !== -1) {
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
      return Promise.resolve([])
    }
    
    // DELETE Goals
    if (query.includes('delete') && query.includes('goals')) {
      const goalId = params.find(p => typeof p === 'string' && p.includes('-'))
      const goalIndex = mockData.goals.findIndex((g: any) => g.id === goalId)
      
      if (goalIndex !== -1) {
        const deletedGoal = mockData.goals.splice(goalIndex, 1)[0]
        console.log(`✅ Goal deleted: "${deletedGoal.title}" (Remaining: ${mockData.goals.length})`)
      } else {
        console.log(`⚠️ Goal not found for deletion: ${goalId}`)
      }
      return Promise.resolve([])
    }
    
    // DELETE Activities
    if (query.includes('delete') && query.includes('activities')) {
      const activityId = params.find(p => typeof p === 'string' && p.includes('-'))
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

// 获取数据库实例
export const getDB = async (): Promise<any> => {
  if (typeof global !== 'undefined' && global.globalDbInstance) {
    console.log("♻️ Reusing existing database instance")
    return global.globalDbInstance
  }
  
  // 检查是否有有效的PostgreSQL连接
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl && (databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://'))) {
    try {
      console.log("🐘 Creating PostgreSQL connection")
      const dbInstance = neon(databaseUrl)
      
      if (typeof global !== 'undefined') {
        global.globalDbInstance = dbInstance
      }
      
      return dbInstance
    } catch (error) {
      console.error("❌ PostgreSQL connection failed:", error)
    }
  }
  
  // 使用Mock数据库作为fallback
  console.log("🔧 Using mock database for development")
  const mockDbInstance = createMockDatabase()
  
  if (typeof global !== 'undefined') {
    global.globalDbInstance = mockDbInstance
  }
  
  return mockDbInstance
}

// 安全的参数化查询函数
export async function paramQuery(sql: TemplateStringsArray, ...params: any[]) {
  try {
    const db = await getDB()
    if (typeof db !== 'function') {
      throw new Error(`Database instance is not a function: ${typeof db}`)
    }
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
  const mockData = initMockData()
  mockData.goals = []
  mockData.activities = []
  console.log("🧹 Mock database cleared")
}

// 获取数据库状态（用于调试）
export function getMockDataStatus() {
  const mockData = initMockData()
  return {
    goals: mockData.goals.length,
    activities: mockData.activities.length,
    goalTitles: mockData.goals.map((g: any) => g.title),
    activityDates: mockData.activities.map((a: any) => a.date)
  }
}