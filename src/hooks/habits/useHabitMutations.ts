import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { addHabit, createHabitGroup } from "@/lib/api"

export const useLogHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habit: any) => {
      const { data, error } = await supabase
        .from('habit_logs')
        .insert([{
          habit_id: habit.id,
          name: habit.name,
          points: habit.points,
          date: habit.date,
          status: 'completed'
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onMutate: async (newHabit) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['habits'] })
      await queryClient.cancelQueries({ queryKey: ['habits', newHabit.id] })
      await queryClient.cancelQueries({ queryKey: ['habits', newHabit.date] })
      await queryClient.cancelQueries({ queryKey: ['habit-logs', newHabit.date] })
      
      // Snapshot the previous habit data for rollback
      const previousHabitsData = queryClient.getQueryData(['habits', newHabit.date])
      
      // Optimistically update the habit in cache
      if (previousHabitsData) {
        queryClient.setQueryData(['habits', newHabit.date], (oldData: any[]) => {
          return oldData.map(habit => {
            if (habit.id === newHabit.id) {
              // Create a new log entry for the optimistic update
              const newLog = {
                id: `temp-${Date.now()}`, // Temporary ID
                habit_id: newHabit.id,
                date: newHabit.date,
                status: 'completed'
              }
              
              // Clone the habit and add the new log
              return {
                ...habit,
                habit_logs: [...habit.habit_logs, newLog]
              }
            }
            return habit
          })
        })
      }
      
      // Return context with previous data for potential rollback
      return { previousHabitsData, newHabit }
    },
    onSuccess: (data, variables) => {
      // We don't need to invalidate queries since we're managing the cache directly
      // The optimistic update already updated the UI, and we'll merge the actual server response
      // into our cache to ensure data consistency
      
      // Update the cache with the real response data
      queryClient.setQueryData(['habits', variables.date], (oldData: any[]) => {
        if (!oldData) return oldData;
        
        return oldData.map(habit => {
          if (habit.id === variables.id) {
            // Filter out any temporary logs
            const filteredLogs = habit.habit_logs.filter((log: any) => 
              !log.id.toString().startsWith('temp-')
            );
            
            // Add the new log with the real ID from the server
            return {
              ...habit,
              habit_logs: [...filteredLogs, data]
            };
          }
          return habit;
        });
      });
      
      toast({
        title: "Success!",
        description: "Habit logged successfully.",
      })
    },
    onError: (error, variables, context) => {
      console.error('Error logging habit:', error)
      
      // Roll back to the previous state if we have context
      if (context?.previousHabitsData) {
        queryClient.setQueryData(['habits', variables.date], context.previousHabitsData)
      } else {
        // Fallback to invalidating queries if we don't have context
        queryClient.invalidateQueries({ queryKey: ['habits'] })
        queryClient.invalidateQueries({ queryKey: ['habits', variables.id] })
        queryClient.invalidateQueries({ queryKey: ['habit-logs', variables.date] })
      }
      
      toast({
        title: "Error",
        description: "Failed to log habit. Please try again.",
        variant: "destructive"
      })
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is consistent
      // This is delayed to ensure our UI updates first and then syncs with the server
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['habits'] })
      }, 300)
    }
  })
}

export const useUnlogHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (habit: any) => {
      if (!habit.habit_logs?.[0]?.id) throw new Error('No log found to delete')
      
      // Don't try to delete temporary IDs from the server
      if (habit.habit_logs[0].id.toString().startsWith('temp-')) {
        // Just simulate success for temporary IDs
        return { success: true }
      }
      
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', habit.habit_logs[0].id)

      if (error) throw error
      return { success: true }
    },
    onMutate: async (oldHabit) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ['habits'] })
      await queryClient.cancelQueries({ queryKey: ['habits', oldHabit.id] })
      await queryClient.cancelQueries({ queryKey: ['habits', oldHabit.date] })
      await queryClient.cancelQueries({ queryKey: ['habit-logs', oldHabit.date] })
      
      // Snapshot the previous habit data for rollback
      const previousHabitsData = queryClient.getQueryData(['habits', oldHabit.date])
      
      // Optimistically update the habit in cache
      if (previousHabitsData) {
        queryClient.setQueryData(['habits', oldHabit.date], (oldData: any[]) => {
          return oldData.map(habit => {
            if (habit.id === oldHabit.id) {
              // Remove the last log entry
              const newHabitLogs = [...habit.habit_logs]
              if (newHabitLogs.length > 0) {
                newHabitLogs.pop()
              }
              
              // Clone the habit and update logs
              return {
                ...habit,
                habit_logs: newHabitLogs
              }
            }
            return habit
          })
        })
      }
      
      // Return context with previous data for potential rollback
      return { previousHabitsData, oldHabit }
    },
    onSuccess: (_, variables) => {
      // We don't need to invalidate immediately since we're managing the cache directly
      toast({
        title: "Success!",
        description: "Habit unlogged successfully.",
      })
    },
    onError: (error, variables, context) => {
      console.error('Error unlogging habit:', error)
      
      // Roll back to the previous state if we have context
      if (context?.previousHabitsData) {
        queryClient.setQueryData(['habits', variables.date], context.previousHabitsData)
      } else {
        // Fallback to invalidating queries if we don't have context
        queryClient.invalidateQueries({ queryKey: ['habits'] })
        queryClient.invalidateQueries({ queryKey: ['habits', variables.id] })
        queryClient.invalidateQueries({ queryKey: ['habit-logs', variables.date] })
      }
      
      toast({
        title: "Error",
        description: "Failed to unlog habit. Please try again.",
        variant: "destructive"
      })
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data is consistent
      // This is delayed to ensure our UI updates first and then syncs with the server
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['habits'] })
      }, 300)
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
