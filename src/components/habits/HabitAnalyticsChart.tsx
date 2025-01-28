import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subMonths, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { AnalyticsChart } from "../analytics/AnalyticsChart"

interface HabitAnalyticsChartProps {
  habitId: number
}

export const HabitAnalyticsChart = ({ habitId }: HabitAnalyticsChartProps) => {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily")
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })

  const { data: analyticsData } = useQuery({
    queryKey: ['habit-analytics', habitId, timeframe, dateRange],
    queryFn: async () => {
      if (!dateRange.from || !dateRange.to) return []

      const startDate = format(dateRange.from, 'yyyy-MM-dd')
      const endDate = format(dateRange.to, 'yyyy-MM-dd')

      const { data, error } = await supabase
        .rpc(`get_habit_points_${timeframe}`, {
          p_owner_id: (await supabase.auth.getUser()).data.user?.id,
          p_start_date: startDate,
          p_end_date: endDate,
          p_habit_id: habitId
        })

      if (error) throw error

      // Generate all dates in the range based on timeframe
      let allDates: { date: string; points: number }[] = []
      
      if (timeframe === "daily") {
        const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to })
        allDates = days.map(day => ({
          date: format(day, 'yyyy-MM-dd'),
          points: 0
        }))
      } else if (timeframe === "weekly") {
        const weeks = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to })
        allDates = weeks.map(week => ({
          date: format(startOfWeek(week), 'yyyy-MM-dd'),
          points: 0
        }))
      } else {
        const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
        allDates = months.map(month => ({
          date: format(startOfMonth(month), 'yyyy-MM-dd'),
          points: 0
        }))
      }

      // Merge the database data with the generated dates
      const mergedData = allDates.map(date => {
        const dbEntry = data.find(d => {
          if (timeframe === "daily") {
            return d.date === date.date
          } else if (timeframe === "weekly") {
            return d.week_start === date.date
          } else {
            return d.month_start === date.date
          }
        })
        return {
          date: date.date,
          points: dbEntry ? Number(dbEntry.points) : 0
        }
      })

      return mergedData
    }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                  const twelveMonthsAgo = subMonths(new Date(), 12)
                  const twelveMonthsFromNow = subMonths(new Date(), -12)
                  return date < twelveMonthsAgo || date > twelveMonthsFromNow
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        <AnalyticsChart 
          data={analyticsData || []} 
          timeframe={timeframe}
        />
      </CardContent>
    </Card>
  )
}