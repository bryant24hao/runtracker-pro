import { neon } from "@neondatabase/serverless"

// 数据库实例
let dbInstance: any = null

// 初始化 PostgreSQL 表结构
async function initPostgreTables(db: any) {
  try {
    // 创建用户表
    await db(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 创建跑步目标表
    await db(`
      CREATE TABLE IF NOT EXISTS goals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('distance', 'time', 'frequency')),
        target DECIMAL NOT NULL,
        current_value DECIMAL DEFAULT 0,
        unit TEXT NOT NULL,
        deadline DATE NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 创建跑步活动表
    await db(`
      CREATE TABLE IF NOT EXISTS activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        distance DECIMAL NOT NULL,
        duration INTEGER NOT NULL,
        pace DECIMAL NOT NULL,
        location TEXT,
        notes TEXT,
        images JSONB DEFAULT '[]',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 创建索引
    await db(`CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`)
    await db(`CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`)
    await db(`CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)`)
    await db(`CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date)`)

    // 创建默认用户
    const existingUser = await db(`SELECT id FROM users WHERE email = $1`, ['demo@example.com'])
    if (!existingUser.length) {
      await db(`
        INSERT INTO users (id, email, name) 
        VALUES ($1, $2, $3)
      `, ["550e8400-e29b-41d4-a716-446655440000", "demo@example.com", "Demo User"])
    }
    
    console.log("PostgreSQL tables initialized successfully")
  } catch (error) {
    console.log("PostgreSQL tables initialization completed or already exist:", error instanceof Error ? error.message : String(error))
  }
}

// 初始化数据库
async function initDatabase() {
  if (dbInstance) return dbInstance

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required")
  }

  if (!process.env.DATABASE_URL.startsWith("postgresql") && !process.env.DATABASE_URL.startsWith("postgres")) {
    throw new Error("Only PostgreSQL databases are supported")
  }

  // 使用 Neon PostgreSQL
  console.log("Using Neon PostgreSQL database")
  dbInstance = neon(process.env.DATABASE_URL)
  
  // 初始化 PostgreSQL 表结构
  await initPostgreTables(dbInstance)
  
  return dbInstance
}

// 获取数据库实例
export const getDB = async () => await initDatabase()

// 统一的查询接口
export async function query(text: string, params?: any[]) {
  try {
    const db = await getDB()
    const result = await db(text, params)
    return result
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}

// 获取当前用户ID（简化版本，实际应用中应该从认证系统获取）
export function getCurrentUserId(): string {
  // 在实际应用中，这里应该从JWT token或session中获取用户ID
  // 现在使用固定的demo用户ID
  return "550e8400-e29b-41d4-a716-446655440000"
}
