import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent } from "./ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, addDays, subDays } from "date-fns"
import { Calendar } from "./ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { useState } from "react"

export const DayScore = () => {
  const [date, setDate] = useState<Date>(new Date())
  const formattedDate = date.toISOString().split('T')[0]

  const { data: habitLogs } = useQuery({
    queryKey: ['habit-logs', formattedDate],
    queryFn: async () => {
      console.log('Fetching habit logs for:', formattedDate)
      const { data, error } = await supabase
        .from('habit_logs')
        .select('points')
        .eq('date', formattedDate)
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

  const handlePreviousDay = () => {
    setDate(prev => subDays(prev, 1))
  }

  const handleNextDay = () => {
    setDate(prev => addDays(prev, 1))
  }

  const isToday = formattedDate === new Date().toISOString().split('T')[0]

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
          <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="min-w-[100px]">
                {isToday ? "Today" : format(date, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(newDate) => newDate && setDate(newDate)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={handleNextDay}>
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