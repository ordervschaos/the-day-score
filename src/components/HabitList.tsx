import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Check, Minus, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface HabitItemProps {
  id: number
  title: string
  points: number
  status?: string
  streak?: number
  logCount: number
  onLog: () => void
  onUnlog?: () => void
  index: number
}

const HabitItem = ({ id, title, points, status, streak, logCount, onLog, onUnlog, index }: HabitItemProps) => {
  return (
    <div className="flex items-center space-x-4 py-2 px-2 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-center space-x-2 flex-1">
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
        {logCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {logCount}x
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {points}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={logCount > 0 ? onUnlog : onLog}
          className="h-7 w-7 p-0"
        >
          {logCount > 0 ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export const HabitList = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      console.log('Starting habits fetch...')
      try {
        const { data, error } = await supabase
          .from('habits')
          .select('*, habit_logs(*)')
          .eq('is_archived', false)
          .eq('habit_logs.date', today)
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

  const logHabitMutation = useMutation({
    mutationFn: async (habit: any) => {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert([{
          habit_id: habit.id,
          name: habit.name,
          points: habit.points,
          date: today,
          status: 'completed'
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast({
        title: "Success!",
        description: "Habit logged successfully.",
      })
    },
    onError: (error) => {
      console.error('Error logging habit:', error)
      toast({
        title: "Error",
        description: "Failed to log habit. Please try again.",
        variant: "destructive"
      })
    }
  })

  const unlogHabitMutation = useMutation({
    mutationFn: async (habit: any) => {
      if (!habit.habit_logs?.[0]?.id) throw new Error('No log found to delete')
      
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', habit.habit_logs[0].id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast({
        title: "Success!",
        description: "Habit unlogged successfully.",
      })
    },
    onError: (error) => {
      console.error('Error unlogging habit:', error)
      toast({
        title: "Error",
        description: "Failed to unlog habit. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleLogHabit = (habit: any) => {
    logHabitMutation.mutate(habit)
  }

  const handleUnlogHabit = (habit: any) => {
    unlogHabitMutation.mutate(habit)
  }

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
          {habits?.map((habit: any, index: number) => (
            <HabitItem 
              key={habit.id}
              id={habit.id}
              title={habit.name}
              points={habit.points}
              logCount={habit.habit_logs?.length || 0}
              onLog={() => handleLogHabit(habit)}
              onUnlog={() => handleUnlogHabit(habit)}
              index={index}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}