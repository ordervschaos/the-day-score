import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { subMonths } from "date-fns"
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters"
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart"

const Analytics = () => {
  const [selectedHabit, setSelectedHabit] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily")
  const [dateRange, setDateRange] = useState<{
    from: Date
    to?: Date
  }>({
    from: subMonths(new Date(), 1),
    to: new Date()
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
        return data.reduce((acc: any[], log: any) => {
          const existingDay = acc.find(item => item.date === log.date)
          if (existingDay) {
            existingDay.points += (log.points || 0)
          } else {
            acc.push({
              date: log.date,
              points: log.points || 0
            })
          }
          return acc
        }, []).sort((a: any, b: any) => a.date.localeCompare(b.date))
      } else if (timeframe === "weekly") {
        const weeklyData = data.reduce((acc: any, log: any) => {
          const date = new Date(log.date)
          const weekKey = `${date.getFullYear()}-W${getWeek(date)}`
          if (!acc[weekKey]) {
            acc[weekKey] = {
              date: log.date,
              points: 0
            }
          }
          acc[weekKey].points += (log.points || 0)
          return acc
        }, {})
        
        return Object.values(weeklyData).sort((a: any, b: any) => a.date.localeCompare(b.date))
      } else {
        const monthlyData = data.reduce((acc: any, log: any) => {
          const monthKey = log.date.substring(0, 7) // YYYY-MM format
          if (!acc[monthKey]) {
            acc[monthKey] = {
              date: `${monthKey}-01`, // First day of the month
              points: 0
            }
          }
          acc[monthKey].points += (log.points || 0)
          return acc
        }, {})

        return Object.values(monthlyData).sort((a: any, b: any) => a.date.localeCompare(b.date))
      }
    }
  })

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Analytics</h1>
      
      <AnalyticsFilters
        selectedHabit={selectedHabit}
        setSelectedHabit={setSelectedHabit}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      <AnalyticsChart
        data={habitLogs}
        timeframe={timeframe}
      />
    </div>
  )
}

export default Analytics