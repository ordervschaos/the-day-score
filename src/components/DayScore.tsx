import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"

export const DayScore = () => {
  return (
    <Card className="bg-background border-none shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">The Day Score</h1>
          <Button variant="ghost" size="icon">
            U
          </Button>
        </div>
        
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Today</span>
          <Button variant="ghost" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="text-6xl font-bold">0</div>
          <div className="text-sm text-muted-foreground">karma earned</div>
        </div>
      </CardContent>
    </Card>
  )
}