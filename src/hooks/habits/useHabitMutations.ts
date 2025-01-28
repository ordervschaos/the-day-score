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
      if (!habit.habit_logs?.[0]?.id) throw new Error('No log found to delete')
      
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('id', habit.habit_logs[0].id)

      if (error) throw error
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