import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Minus, Plus, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"

interface HabitCardProps {
  id: number
  title: string
  points: number
  status?: string
  streak?: number
  logCount: number
  coverImage?: string | null
  isMultiplePerDay?: boolean
  onLog: () => void
  onUnlog?: () => void
}

export const HabitCard = ({ 
  id,
  title, 
  points, 
  status, 
  streak, 
  logCount, 
  coverImage,
  isMultiplePerDay = false,
  onLog, 
  onUnlog
}: HabitCardProps) => {
  const navigate = useNavigate()
  const isCompleted = logCount > 0
  
  const renderActionButton = () => {
    if (isMultiplePerDay) {
      return (
        <div className="flex items-center gap-1">
          {logCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUnlog?.();
              }}
              className={cn(
                "h-6 w-6 sm:h-7 sm:w-7 p-0 text-white hover:bg-white/20",
                isCompleted && "hover:bg-green-500/20"
              )}
            >
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onLog();
            }}
            className={cn(
              "h-6 w-6 sm:h-7 sm:w-7 p-0 text-white hover:bg-white/20",
              isCompleted && "hover:bg-green-500/20"
            )}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      )
    }

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          logCount > 0 ? onUnlog?.() : onLog();
        }}
        className={cn(
          "h-6 w-6 sm:h-7 sm:w-7 p-0 text-white hover:bg-white/20",
          isCompleted && "hover:bg-green-500/20"
        )}
      >
        {logCount > 0 ? (
          <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
        ) : (
          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
        )}
      </Button>
    )
  }
  
  return (
    <Card 
      className={cn(
        "overflow-hidden h-[200px] sm:h-[280px] relative group transition-all duration-300 cursor-pointer",
        isCompleted && "ring-2 ring-green-500/50"
      )}
      onClick={() => navigate(`/habits/${id}`)}
    >
      <div 
        className={cn(
          "absolute inset-0",
          coverImage ? 'bg-cover bg-center' : 'bg-accent flex items-center justify-center',
          isCompleted && "after:absolute after:inset-0 after:bg-green-500/40 after:backdrop-blur-[1px]"
        )}
        style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
      >
        {!coverImage && (
          <span className="text-lg sm:text-2xl font-display text-accent-foreground">{title}</span>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      {isCompleted && (
        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg animate-scale-in">
          <Check className="h-4 w-4" />
        </div>
      )}
      <CardContent className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
        {coverImage && (
          <h3 className={cn(
            "text-sm sm:text-base font-medium mb-1 sm:mb-2",
            isCompleted && "text-green-100"
          )}>{title}</h3>
        )}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {status && (
            <Badge variant="secondary" className={cn(
              "text-xs bg-white/20 hover:bg-white/30 text-white",
              isCompleted && "bg-green-500/30 hover:bg-green-500/40"
            )}>
              {status}
            </Badge>
          )}
          {streak && (
            <Badge variant="secondary" className={cn(
              "text-xs bg-white/20 hover:bg-white/30 text-white",
              isCompleted && "bg-green-500/30 hover:bg-green-500/40"
            )}>
              🔥 {streak}
            </Badge>
          )}
          {logCount > 0 && (
            <Badge variant="secondary" className={cn(
              "text-xs bg-white/20 hover:bg-white/30 text-white font-medium",
              isCompleted && "bg-green-500/30 hover:bg-green-500/40"
            )}>
              {logCount}x
            </Badge>
          )}
          <Badge variant="outline" className={cn(
            "text-xs border-white/20 text-white",
            isCompleted && "border-green-300/30 text-green-100"
          )}>
            {points}
          </Badge>
          <div className="flex-1" />
          {renderActionButton()}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/habits/${id}`);
            }}
            className={cn(
              "h-6 w-6 sm:h-7 sm:w-7 p-0 text-white hover:bg-white/20",
              isCompleted && "hover:bg-green-500/20"
            )}
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}