
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { addHabit, createHabitGroup } from "@/lib/api"

export const useLogHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habit: any) => {
      // Check if there's already a log for this habit on this day
      const { data: existingLog, error: fetchError } = await supabase
        .from('habit_logs')
        .select('id, count')
        .eq('habit_id', habit.id)
        .eq('date', habit.date)
        .eq('status', 'completed')
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is the error code for "no rows returned" which is expected
        // For any other error, throw it
        throw fetchError
      }

      if (existingLog) {
        // If a log exists, increment the count
        const { data, error } = await supabase
          .from('habit_logs')
          .update({ count: existingLog.count + 1 })
          .eq('id', existingLog.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // If no log exists, create a new one with count 1
        const { data, error } = await supabase
          .from('habit_logs')
          .insert([{
            habit_id: habit.id,
            name: habit.name,
            points: habit.points,
            date: habit.date,
            status: 'completed',
            count: 1
          }])
          .select()
          .single()

        if (error) throw error
        return data
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate both the habits list and the specific habit queries
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['habits', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['habit-logs', variables.date] })
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
}

export const useUnlogHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habit: any) => {
      if (!habit.habit_logs?.[0]?.id) throw new Error('No log found to decrease')
      
      const logId = habit.habit_logs[0].id
      const currentCount = habit.habit_logs[0].count || 1
      
      if (currentCount <= 1) {
        // If count is 1 or less, delete the log entry
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('id', logId)

        if (error) throw error
      } else {
        // If count is greater than 1, decrement it
        const { error } = await supabase
          .from('habit_logs')
          .update({ count: currentCount - 1 })
          .eq('id', logId)

        if (error) throw error
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate both the habits list and the specific habit queries
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['habits', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['habit-logs', variables.date] })
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
}

export const useUpdatePosition = () => {
  return useMutation({
    mutationFn: async ({ type, id, position }: { type: 'habit' | 'group', id: number, position: number }) => {
      const table = type === 'habit' ? 'habits' : 'habit_groups'
      const { error } = await supabase
        .from(table)
        .update({ position })
        .eq('id', id)

      if (error) throw error
    }
  })
}

export const useCreateHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast({
        title: "Success!",
        description: "Habit created successfully.",
      })
    },
    onError: (error) => {
      console.error('Error creating habit:', error)
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive"
      })
    }
  })
}

export const useCreateFolder = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: { title: string }) => {
      const result = await createHabitGroup(values.title)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-groups'] })
      toast({
        title: "Success!",
        description: "Folder created successfully.",
      })
    },
    onError: (error) => {
      console.error('Error creating folder:', error)
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      })
    }
  })
}
