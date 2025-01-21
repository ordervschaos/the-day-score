import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { supabase } from "@/integrations/supabase/client"

interface HabitItemProps {
  id: number
  title: string
  points: number
  status?: string
  streak?: number
  onToggle?: () => void
  index: number
}

const HabitItem = ({ id, title, points, status, streak, onToggle, index }: HabitItemProps) => {
  return (
    <div className="flex items-center space-x-4 py-2">
      <div className="flex items-center space-x-2 flex-1">
        <Checkbox onCheckedChange={onToggle} />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {status && (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        )}
        {streak && (
          <Badge variant="secondary" className="text-xs">
            🔥 {streak}
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {points}
        </Badge>
      </div>
    </div>
  )
}

export const HabitList = () => {
  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      console.log('Starting habits fetch...')
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*')
          .eq('is_archived', false)
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Supabase error fetching habits:', error)
          throw error
        }
        
        console.log('Successfully fetched habits:', data)
        return data
      } catch (err) {
        console.error('Error in queryFn:', err)
        throw err
      }
    }
  })

  if (isLoading) {
    return <div>Loading habits...</div>
  }

  if (error) {
    console.error('React Query error:', error)
    return <div>Error loading habits: {error.message}</div>
  }

  return (
    <Card className="bg-background border-none shadow-none">
      <CardContent>
        <div className="space-y-1">
          {habits?.map((habit, index) => (
            <HabitItem 
              key={habit.id}
              id={habit.id}
              title={habit.name}
              points={habit.points}
              index={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}