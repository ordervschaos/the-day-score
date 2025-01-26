import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from "date-fns"

const Analytics = () => {
  const [selectedHabit, setSelectedHabit] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily")

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
    queryKey: ['habit-logs-analytics', timeframe, selectedHabit],
    queryFn: async () => {
      console.log('Fetching habit logs for analytics:', { timeframe, selectedHabit })
      const now = new Date()
      const startDate = startOfWeek(now)
      const endDate = endOfWeek(now)

      let query = supabase
        .from('habit_logs')
        .select('points, date, habit_id')
        .eq('status', 'completed')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      if (selectedHabit !== "all") {
        query = query.eq('habit_id', selectedHabit)
      }

      const { data, error } = await query
      if (error) throw error

      // Group data by date
      const dateGroups = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
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
      
      <div className="flex gap-4">
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
      </div>

      <Card>
        <CardContent className="pt-6">
          <ChartContainer className="h-[400px]" config={{}}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitLogs}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                />
                <YAxis />
                <ChartTooltip>
                  <ChartTooltipContent />
                </ChartTooltip>
                <Bar dataKey="points" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics