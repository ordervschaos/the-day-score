import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Check, Minus, Plus, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface HabitItemProps {
  id: number
  title: string
  points: number
  status?: string
  streak?: number
  logCount: number
  isMultiplePerDay?: boolean
  onLog: () => void
  onUnlog?: () => void
  index: number
}

export const HabitItem = ({ 
  id,
  title, 
  points, 
  status, 
  streak, 
  logCount,
  isMultiplePerDay = false,
  onLog, 
  onUnlog
}: HabitItemProps) => {
  const navigate = useNavigate()
  
  const renderActionButton = () => {
    if (isMultiplePerDay) {
      return (
        <div className="flex items-center gap-1">
          {logCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onUnlog}
              className="h-7 w-7 p-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLog}
            className="h-7 w-7 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      )
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={logCount > 0 ? onUnlog : onLog}
        className="h-7 w-7 p-0"
      >
        {logCount > 0 ? (
          <Minus className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </Button>
    )
  }
  
  return (
    <div className="flex items-center space-x-4 py-2 px-2 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-center space-x-2 flex-1">
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {status && (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        )}
        {streak && (
          <Badge variant="secondary" className="text-xs">
            🔥 {streak}
          </Badge>
        )}
        {logCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {logCount}x
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {points}
        </Badge>
        {renderActionButton()}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/habits/${id}`)}
          className="h-7 w-7 p-0"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}