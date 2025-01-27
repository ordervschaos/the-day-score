import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { subMonths } from "date-fns"
import { AnalyticsFilters } from "@/components/analytics/AnalyticsFilters"
import { AnalyticsChart } from "@/components/analytics/AnalyticsChart"
import { TopNav } from "@/components/TopNav"
import { supabase } from "@/integrations/supabase/client"

const Analytics = () => {
  const [selectedHabit, setSelectedHabit] = useState<string>("all")
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly")
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 1),
    end: new Date(),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', selectedHabit, timeframe, dateRange],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('habit_id', selectedHabit === "all" ? null : selectedHabit)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: true })

      if (error) throw error
      return data
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
          onHabitChange={setSelectedHabit}
          timeframe={timeframe}
          onTimeframeChange={setTimeframe}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <AnalyticsChart data={data || []} timeframe={timeframe} />
      </main>
    </div>
  )
}

export default Analytics
