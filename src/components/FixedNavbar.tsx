
import { format, addDays, subDays } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"
import { Calendar } from "./ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface FixedNavbarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const FixedNavbar = ({ selectedDate, onDateChange }: FixedNavbarProps) => {
  const formattedDate = selectedDate.toLocaleDateString('en-CA')
  const isToday = formattedDate === new Date().toLocaleDateString('en-CA')

  const { data: habitLogs } = useQuery({
    queryKey: ['habit-logs', formattedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('points')
        .eq('date', formattedDate)
        .eq('status', 'completed')

      if (error) {
        console.error('Error fetching habit logs:', error)
        throw error
      }
      
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

  return (
    <div className="fixed top-0 left-0 right-0 bg-background z-10 border-b shadow-sm">
      <div className="container mx-auto py-2 flex justify-between items-center max-w-3xl px-2">
        <div className="flex items-center gap-1">
          <div className="font-bold text-xl">{totalPoints}</div>
          <div className="text-xs text-muted-foreground">karma</div>
        </div>

        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handlePreviousDay} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" className="h-8 px-2">
                {isToday ? "Today" : format(selectedDate, "EEE, MMM d")}
                <CalendarIcon className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(newDate) => newDate && onDateChange(newDate)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
