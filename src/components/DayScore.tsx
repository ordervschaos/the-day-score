import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const DayScore = () => {
  const today = new Date().toISOString().split('T')[0]

  const { data: habitLogs } = useQuery({
    queryKey: ['habit-logs', today],
    queryFn: async () => {
      console.log('Fetching habit logs for today:', today)
      const { data, error } = await supabase
        .from('habit_logs')
        .select('points')
        .eq('date', today)
        .eq('status', 'completed')

      if (error) {
        console.error('Error fetching habit logs:', error)
        throw error
      }

      console.log('Fetched habit logs:', data)
      return data
    }
  })

  const totalPoints = habitLogs?.reduce((sum, log) => sum + (log.points || 0), 0) || 0

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
          <div className="text-6xl font-bold">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">karma earned</div>
        </div>
      </CardContent>
    </Card>
  )
}