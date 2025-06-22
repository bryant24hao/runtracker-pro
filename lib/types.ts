export interface User {
  id: string
  email: string
  name?: string
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  type: "distance" | "time" | "frequency"
  target: number
  current_value: number
  unit: string
  start_date: string
  deadline: string
  description?: string
  status: "active" | "completed" | "paused"
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  user_id: string
  date: string
  distance: number
  duration: number
  pace: number
  location?: string
  notes?: string
  images: string[]
  created_at: string
  updated_at: string
}

export interface CreateGoalRequest {
  title: string
  type: "distance" | "time" | "frequency"
  target: number
  unit: string
  start_date: string
  deadline: string
  description?: string
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  current_value?: number
  status?: "active" | "completed" | "paused"
}

export interface CreateActivityRequest {
  date: string
  distance: number
  duration: number
  pace: number
  location?: string
  notes?: string
  images?: string[]
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {}
