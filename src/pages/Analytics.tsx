import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, addDays } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const Analytics = () => {
  const [selectedHabit, setSelectedHabit] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to?: Date
  }>({
    from: startOfWeek(new Date()),
    to: endOfWeek(new Date())
  })

  const { data: habits } = useQuery({
    queryKey: ['habits-for-analytics'],
    queryFn: async () => {
      console.log('Fetching habits for analytics')
      const { data, error } = await supabase
        .from('habits')
        .select('id, name')
        .eq('is_archived', false)

      if (error) throw error
      return data
    }
  })

  const { data: habitLogs } = useQuery({
    queryKey: ['habit-logs-analytics', timeframe, selectedHabit, dateRange],
    queryFn: async () => {
      console.log('Fetching habit logs for analytics:', { timeframe, selectedHabit, dateRange })
      
      let query = supabase
        .from('habit_logs')
        .select('points, date, habit_id')
        .eq('status', 'completed')

      if (dateRange.from) {
        query = query.gte('date', dateRange.from.toISOString().split('T')[0])
      }
      if (dateRange.to) {
        query = query.lte('date', dateRange.to.toISOString().split('T')[0])
      }

      if (selectedHabit !== "all") {
        query = query.eq('habit_id', parseInt(selectedHabit))
      }

      const { data, error } = await query
      if (error) throw error

      // Group data by date
      const dateGroups = eachDayOfInterval({ 
        start: dateRange.from, 
        end: dateRange.to || addDays(dateRange.from, 6)
      }).map(date => {
        const dateStr = date.toISOString().split('T')[0]
        const dayLogs = data.filter(log => log.date === dateStr)
        return {
          date: dateStr,
          points: dayLogs.reduce((sum, log) => sum + (log.points || 0), 0)
        }
      })

      return dateGroups
    }
  })

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      
      <div className="flex flex-wrap gap-4">
        <Select value={timeframe} onValueChange={(value: "daily" | "weekly" | "monthly") => setTimeframe(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedHabit} onValueChange={setSelectedHabit}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select habit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Habits</SelectItem>
            {habits?.map(habit => (
              <SelectItem key={habit.id} value={String(habit.id)}>
                {habit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={(range) => setDateRange(range || { from: new Date() })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitLogs}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => format(parseISO(label), 'MMM d, yyyy')}
                  formatter={(value) => [`${value} points`, 'Points']}
                />
                <Bar dataKey="points" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics