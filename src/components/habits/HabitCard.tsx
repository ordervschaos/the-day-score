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
    <Card className="overflow-hidden">
      <div 
        className={`h-32 flex items-center justify-center ${coverImage ? 'bg-cover bg-center' : 'bg-accent'}`}
        style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
      >
        {!coverImage && (
          <span className="text-2xl font-display text-accent-foreground">{title}</span>
        )}
      </div>
      <CardContent className="p-4">
        {coverImage && <h3 className="font-medium mb-2">{title}</h3>}
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
          <div className="flex-1" />
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/habits/${id}`)}
            className="h-7 w-7 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}