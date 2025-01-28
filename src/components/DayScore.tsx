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

interface DayScoreProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const DayScore = ({ selectedDate, onDateChange }: DayScoreProps) => {
  const formattedDate = selectedDate.toLocaleDateString('en-CA')

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
    onDateChange(subDays(selectedDate, 1))
  }

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const isToday = formattedDate === new Date().toLocaleDateString('en-CA')

  return (
    <Card className="bg-background border-none shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Button variant="ghost" size="icon" onClick={handlePreviousDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="min-w-[140px]">
                {isToday ? "Today" : format(selectedDate, "EEE, MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(newDate) => newDate && onDateChange(newDate)}
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