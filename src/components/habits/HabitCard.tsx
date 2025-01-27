import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Minus, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface HabitCardProps {
  id: number
  title: string
  points: number
  status?: string
  streak?: number
  logCount: number
  coverImage?: string | null
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
  onLog, 
  onUnlog
}: HabitCardProps) => {
  const navigate = useNavigate()
  
  return (
    <Card className="overflow-hidden h-[200px] sm:h-[280px] relative">
      <div 
        className={`absolute inset-0 ${coverImage ? 'bg-cover bg-center' : 'bg-accent flex items-center justify-center'}`}
        style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
      >
        {!coverImage && (
          <span className="text-lg sm:text-2xl font-display text-accent-foreground">{title}</span>
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      <CardContent className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 text-white">
        {coverImage && <h3 className="text-sm sm:text-base font-medium mb-1 sm:mb-2">{title}</h3>}
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {status && (
            <Badge variant="secondary" className="text-xs bg-white/20 hover:bg-white/30">
              {status}
            </Badge>
          )}
          {streak && (
            <Badge variant="secondary" className="text-xs bg-white/20 hover:bg-white/30">
              🔥 {streak}
            </Badge>
          )}
          {logCount > 0 && (
            <Badge variant="secondary" className="text-xs bg-white/20 hover:bg-white/30">
              {logCount}x
            </Badge>
          )}
          <Badge variant="outline" className="text-xs border-white/20 text-white">
            {points}
          </Badge>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={logCount > 0 ? onUnlog : onLog}
            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-white hover:bg-white/20"
          >
            {logCount > 0 ? (
              <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/habits/${id}`)}
            className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-white hover:bg-white/20"
          >
            <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}