import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters"
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart"
import { TopNav } from "@/components/TopNav"
import { supabase } from "@/integrations/supabase/client"

const Analytics = () => {
  const [selectedHabit, setSelectedHabit] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly")
  const [dateRange, setDateRange] = useState<{ from: Date; to?: Date }>({
    from: new Date(),
    to: new Date()
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', selectedHabit, timeframe, dateRange],
    queryFn: async () => {
      console.log('Fetching analytics data:', { selectedHabit, timeframe, dateRange })
      
      const startDate = format(dateRange.from, 'yyyy-MM-dd')
      const endDate = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : startDate
      const habitId = selectedHabit === "all" ? null : parseInt(selectedHabit)

      const functionName = `get_habit_points_${timeframe}` as const

      const { data, error } = await supabase
        .rpc(functionName, {
          p_owner_id: (await supabase.auth.getUser()).data.user?.id,
          p_start_date: startDate,
          p_end_date: endDate,
          p_habit_id: habitId
        })

      if (error) throw error
      return data || []
    }
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading analytics data</div>

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        
        <AnalyticsFilters
          selectedHabit={selectedHabit}
          setSelectedHabit={setSelectedHabit}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          dateRange={dateRange}
          setDateRange={setDateRange}
        />

        <AnalyticsChart data={data || []} timeframe={timeframe} />
      </main>
    </div>
  )
}

export default Analytics