"use client"

import { format } from "date-fns"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Award, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GoalCardIOSProps {
  goal: {
    id: string
    title: string
    type: "distance" | "time" | "frequency"
    target: number
    current: number
    unit: string
    deadline: Date
    description?: string
    status: "active" | "completed" | "paused"
  }
  onClick?: () => void
  onEdit?: (goal: any) => void
  onDelete?: (goalId: string) => void
}

export function GoalCardIOS({ goal, onClick, onEdit, onDelete }: GoalCardIOSProps) {
  const getProgressPercentage = () => {
    return Math.min((goal.current / goal.target) * 100, 100)
  }

  const getStatusColor = () => {
    switch (goal.status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "paused":
        return "bg-amber-100 text-amber-800 border-amber-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit?.(goal)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(goal.id)
  }

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden",
        "active:bg-gray-50 transition-colors duration-150",
        "mb-3",
        goal.status === "completed" && "border-green-200 bg-green-50",
      )}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-base">{goal.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor()}>
              {goal.status === "active" ? "进行中" : goal.status === "completed" ? "已完成" : "已暂停"}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {goal.description && <p className="text-sm text-gray-600 mt-1">{goal.description}</p>}

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>进度</span>
            <span>
              {goal.current.toFixed(1)}/{goal.target} {goal.unit}
            </span>
          </div>

          <Progress value={getProgressPercentage()} className="h-2" />

          <div className="flex justify-between text-xs text-gray-500">
            <span>截止日期</span>
            <span>{format(goal.deadline, "yyyy年M月d日")}</span>
          </div>
        </div>

        {goal.status === "completed" && (
          <div className="flex items-center gap-2 mt-3 text-green-600">
            <Award className="h-4 w-4" />
            <span className="text-sm font-medium">目标达成！</span>
          </div>
        )}
      </div>
    </div>
  )
}
