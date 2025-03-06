
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

  return (
    <Card className="bg-background border-none shadow-none">
      <CardContent className="p-6 space-y-4">
        <div className="text-center space-y-2">
          <div className="text-6xl font-bold">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">karma earned</div>
        </div>
      </CardContent>
    </Card>
  )
}
