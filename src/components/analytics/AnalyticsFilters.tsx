import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format, subMonths } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface AnalyticsFiltersProps {
  selectedHabit: string
  setSelectedHabit: (value: string) => void
  timeframe: "daily" | "weekly" | "monthly"
  setTimeframe: (value: "daily" | "weekly" | "monthly") => void
  dateRange: { from: Date; to?: Date }
  setDateRange: (range: { from: Date; to?: Date } | undefined) => void
}

export const AnalyticsFilters = ({
  selectedHabit,
  setSelectedHabit,
  timeframe,
  setTimeframe,
  dateRange,
  setDateRange,
}: AnalyticsFiltersProps) => {
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

  return (
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
              const twelveMonthsAgo = subMonths(new Date(), 12)
              const twelveMonthsFromNow = subMonths(new Date(), -12)
              return date < twelveMonthsAgo || date > twelveMonthsFromNow
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}