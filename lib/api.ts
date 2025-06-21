import type {
  Goal,
  Activity,
  CreateGoalRequest,
  CreateActivityRequest,
  UpdateGoalRequest,
  UpdateActivityRequest,
} from "./types"

const API_BASE = "/api"

// 错误处理辅助函数
async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}

// 目标相关API
export const goalsApi = {
  // 获取所有目标
  async getAll(): Promise<Goal[]> {
    const response = await fetch(`${API_BASE}/goals`)
    const data = await handleResponse(response)
    return data.goals
  },

  // 获取单个目标
  async getById(id: string): Promise<Goal> {
    const response = await fetch(`${API_BASE}/goals/${id}`)
    const data = await handleResponse(response)
    return data.goal
  },

  // 创建目标
  async create(goal: CreateGoalRequest): Promise<Goal> {
    const response = await fetch(`${API_BASE}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goal),
    })
    const data = await handleResponse(response)
    return data.goal
  },

  // 更新目标
  async update(id: string, goal: UpdateGoalRequest): Promise<Goal> {
    const response = await fetch(`${API_BASE}/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goal),
    })
    const data = await handleResponse(response)
    return data.goal
  },

  // 删除目标
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/goals/${id}`, {
      method: "DELETE",
    })
    await handleResponse(response)
  },
}

// 活动相关API
export const activitiesApi = {
  // 获取所有活动
  async getAll(limit = 50, offset = 0): Promise<Activity[]> {
    const response = await fetch(`${API_BASE}/activities?limit=${limit}&offset=${offset}`)
    const data = await handleResponse(response)
    return data.activities
  },

  // 获取单个活动
  async getById(id: string): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities/${id}`)
    const data = await handleResponse(response)
    return data.activity
  },

  // 创建活动
  async create(activity: CreateActivityRequest): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    })
    const data = await handleResponse(response)
    return data.activity
  },

  // 更新活动
  async update(id: string, activity: UpdateActivityRequest): Promise<Activity> {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    })
    const data = await handleResponse(response)
    return data.activity
  },

  // 删除活动
  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/activities/${id}`, {
      method: "DELETE",
    })
    await handleResponse(response)
  },
}

// 统计数据API
export const statsApi = {
  async get() {
    const response = await fetch(`${API_BASE}/stats`)
    return handleResponse(response)
  },
}
