import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Minus, Plus, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { useState } from "react"

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
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  
  const handleButtonClick = (callback: () => void) => {
    if (!isButtonDisabled) {
      setIsButtonDisabled(true)
      callback()
      // Re-enable after a short delay to prevent double-clicks
      setTimeout(() => setIsButtonDisabled(false), 500)
    }
  }
  
  const renderActionButton = () => {
    if (isMultiplePerDay) {
      return (
        <div className="flex items-center gap-1">
          {logCount > 0 && (
            <Button
              variant="ghost"
              size="lg"
              disabled={isButtonDisabled}
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick(onUnlog || (() => {}));
              }}
              className={cn(
                "h-8 w-8 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/20",
                isCompleted && "hover:bg-green-500/20"
              )}
            >
              <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="lg"
            disabled={isButtonDisabled}
            onClick={(e) => {
              e.stopPropagation();
              handleButtonClick(onLog);
            }}
            className={cn(
              "h-8 w-8 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/20",
              isCompleted && "hover:bg-green-500/20"
            )}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      )
    }

    return (
      <Button
        variant="ghost"
        size="lg"
        disabled={isButtonDisabled}
        onClick={(e) => {
          e.stopPropagation();
          handleButtonClick(logCount > 0 ? (onUnlog || (() => {})) : onLog);
        }}
        className={cn(
          "h-8 w-8 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/20 transition-all duration-200",
          isCompleted && "hover:bg-green-500/20",
          "focus:ring-2 focus:ring-white/50"
        )}
      >
        {logCount > 0 ? (
          <Minus className="h-4 w-4 sm:h-5 sm:w-5" />
        ) : (
          <Check className="h-4 w-4 sm:h-5 sm:w-5" />
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
          isCompleted && "after:absolute after:inset-0 after:bg-lime-500/100 after:backdrop-blur-[1px]"
        )}
        style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
      >
        {!coverImage && (
          <span className="text-lg sm:text-2xl font-display text-accent-foreground">{title}</span>
        )}
      </div>
      {!isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      )}
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
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/habits/${id}`);
            }}
            className={cn(
              "h-8 w-8 sm:h-10 sm:w-10 p-0 text-white hover:bg-white/20",
              isCompleted && "hover:bg-green-500/20"
            )}
          >
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}