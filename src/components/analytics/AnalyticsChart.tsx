import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import { format, parseISO, getWeek } from "date-fns"

interface AnalyticsChartProps {
  data: any[]
  timeframe: "daily" | "weekly" | "monthly"
}

export const AnalyticsChart = ({ data, timeframe }: AnalyticsChartProps) => {
  const formatXAxis = (dateStr: string) => {
    try {
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
    } catch (e) {
      console.error('Error formatting date:', e, dateStr)
      return dateStr
    }
  }

  const formatTooltipLabel = (dateStr: string) => {
    try {
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
    } catch (e) {
      console.error('Error formatting tooltip date:', e, dateStr)
      return dateStr
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="h-[400px] w-full overflow-x-auto">
          <div className="min-w-[800px] h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={data}
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
  )
}