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
      
      if (!dateRange.from || !dateRange.to) {
        console.log('Date range is incomplete')
        return []
      }

      const startDate = dateRange.from.toISOString().split('T')[0]
      const endDate = dateRange.to.toISOString().split('T')[0]
      const habitId = selectedHabit !== "all" ? parseInt(selectedHabit) : null

      let functionName: 'get_habit_points_daily' | 'get_habit_points_weekly' | 'get_habit_points_monthly'
      switch (timeframe) {
        case 'daily':
          functionName = 'get_habit_points_daily'
          break
        case 'weekly':
          functionName = 'get_habit_points_weekly'
          break
        case 'monthly':
          functionName = 'get_habit_points_monthly'
          break
        default:
          functionName = 'get_habit_points_daily'
      }

      const { data, error } = await supabase
        .rpc(functionName, {
          p_owner_id: (await supabase.auth.getUser()).data.user?.id,
          p_start_date: startDate,
          p_end_date: endDate,
          p_habit_id: habitId
        })

      if (error) {
        console.error('Error fetching analytics data:', error)
        throw error
      }

      if (!data) {
        console.log('No data returned from analytics query')
        return []
      }

      console.log('Analytics data fetched:', data)

      // Transform the data to match the expected format
      return data.map((item: any) => ({
        date: timeframe === 'daily' ? item.date :
              timeframe === 'weekly' ? item.week_start :
              item.month_start,
        points: Number(item.points)
      }))
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
        data={habitLogs || []}
        timeframe={timeframe}
      />
    </div>
  )
}

export default Analytics