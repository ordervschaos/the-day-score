import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfWeek, startOfMonth } from "date-fns"
import { DateRange } from "react-day-picker"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { useState } from "react"
import { addMonths, subMonths } from "date-fns"

interface HabitAnalyticsChartProps {
  habitId: number
}

export const HabitAnalyticsChart = ({ habitId }: HabitAnalyticsChartProps) => {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('daily')
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value as 'daily' | 'weekly' | 'monthly')
  }

  const { data: chartData, isLoading } = useQuery({
    queryKey: ['habit-analytics', habitId, timeframe, dateRange],
    queryFn: async () => {
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
        const dbEntry = data.find((d: any) => {
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

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <CardTitle>Analytics</CardTitle>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <Select
              value={timeframe}
              onValueChange={handleTimeframeChange}
            >
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="points"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}