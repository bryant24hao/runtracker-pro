import { neon } from "@neondatabase/serverless"
import Database from "better-sqlite3"
import path from "path"

// 数据库实例
let dbInstance: any = null

// 初始化数据库
function initDatabase() {
  if (dbInstance) return dbInstance

  if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgresql")) {
    // 使用 Neon PostgreSQL
    console.log("Using Neon PostgreSQL database")
    dbInstance = neon(process.env.DATABASE_URL)
  } else {
    // 使用本地 SQLite 作为回退
    console.log("Using local SQLite database")
    const dbPath = path.join(process.cwd(), "local.db")
    dbInstance = new Database(dbPath)
    
    // 初始化 SQLite 表结构
    initSQLiteTables(dbInstance)
  }
  
  return dbInstance
}

// 初始化 SQLite 表结构
function initSQLiteTables(db: Database.Database) {
  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建跑步目标表
  db.exec(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('distance', 'time', 'frequency')),
      target REAL NOT NULL,
      current_value REAL DEFAULT 0,
      unit TEXT NOT NULL,
      deadline DATE NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建跑步活动表
  db.exec(`
    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      distance REAL NOT NULL,
      duration INTEGER NOT NULL,
      pace REAL NOT NULL,
      location TEXT,
      notes TEXT,
      images TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建索引
  db.exec(`CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date)`)

  // 创建默认用户
  const existingUser = db.prepare("SELECT id FROM users WHERE id = ?").get("550e8400-e29b-41d4-a716-446655440000")
  if (!existingUser) {
    db.prepare(`
      INSERT INTO users (id, email, name) 
      VALUES (?, ?, ?)
    `).run("550e8400-e29b-41d4-a716-446655440000", "demo@example.com", "Demo User")
  }
}

// 获取数据库实例
export const getDB = () => initDatabase()

// 统一的查询接口
export async function query(text: string, params?: any[]) {
  try {
    const db = getDB()
    
    if (db.prepare) {
      // SQLite
      if (text.toLowerCase().includes('select')) {
        const stmt = db.prepare(text)
        return params ? stmt.all(...params) : stmt.all()
      } else {
        const stmt = db.prepare(text)
        const result = params ? stmt.run(...params) : stmt.run()
        return { changes: result.changes, lastInsertRowid: result.lastInsertRowid }
      }
    } else {
      // PostgreSQL (Neon)
      const result = await db(text, params)
      return result
    }
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
