import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, addDays, startOfMonth, endOfMonth, getWeek, getYear, startOfDay, subMonths } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const Analytics = () => {
  const [selectedHabit, setSelectedHabit] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to?: Date
  }>({
    from: subMonths(new Date(), 1), // Default to showing last month
    to: new Date()
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

      // Group data based on timeframe
      if (timeframe === "daily") {
        return eachDayOfInterval({ 
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
      } else if (timeframe === "weekly") {
        // Group by week number
        const weeklyData = new Map()
        
        data.forEach(log => {
          const date = parseISO(log.date)
          const weekKey = `${getYear(date)}-W${getWeek(date)}`
          const current = weeklyData.get(weekKey) || { points: 0, startDate: startOfWeek(date) }
          weeklyData.set(weekKey, {
            ...current,
            points: current.points + (log.points || 0)
          })
        })

        return Array.from(weeklyData.entries())
          .map(([weekKey, data]) => ({
            date: data.startDate.toISOString().split('T')[0],
            points: data.points,
            label: weekKey
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      } else {
        // Monthly grouping
        const monthlyData = new Map()
        
        data.forEach(log => {
          const date = parseISO(log.date)
          const monthKey = format(date, 'yyyy-MM')
          const current = monthlyData.get(monthKey) || { points: 0, startDate: startOfMonth(date) }
          monthlyData.set(monthKey, {
            ...current,
            points: current.points + (log.points || 0)
          })
        })

        return Array.from(monthlyData.entries())
          .map(([monthKey, data]) => ({
            date: data.startDate.toISOString().split('T')[0],
            points: data.points,
            label: monthKey
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
      }
    }
  })

  const formatXAxis = (dateStr: string) => {
    const date = parseISO(dateStr)
    switch (timeframe) {
      case "daily":
        return format(date, 'MMM d')
      case "weekly":
        return `Week ${getWeek(date)}`
      case "monthly":
        return format(date, 'MMM yyyy')
      default:
        return dateStr
    }
  }

  const formatTooltipLabel = (dateStr: string) => {
    const date = parseISO(dateStr)
    switch (timeframe) {
      case "daily":
        return format(date, 'MMM d, yyyy')
      case "weekly":
        return `Week of ${format(date, 'MMM d, yyyy')}`
      case "monthly":
        return format(date, 'MMMM yyyy')
      default:
        return dateStr
    }
  }

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
              disabled={(date) => {
                // Disable dates more than 12 months in the past or future
                const twelveMonthsAgo = subMonths(new Date(), 12)
                const twelveMonthsFromNow = addDays(subMonths(new Date(), -12), -1)
                return date < twelveMonthsAgo || date > twelveMonthsFromNow
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="h-[400px] w-full overflow-x-auto">
            <div className="min-w-[800px] h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={habitLogs}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxis}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={formatTooltipLabel}
                    formatter={(value) => [`${value} points`, 'Points']}
                  />
                  <Bar dataKey="points" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Analytics