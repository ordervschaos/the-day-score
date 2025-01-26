import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useCreateHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: { name: string, points: number }) => {
      // Get the current max position
      const { data: habits } = await supabase
        .from('habits')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = habits && habits.length > 0 ? (habits[0].position || 0) + 1 : 0

      const { data: habit, error } = await supabase
        .from('habits')
        .insert([{
          name: values.name,
          points: values.points,
          position: nextPosition
        }])
        .select()
        .single()

      if (error) throw error
      return habit
    },
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
      // Get the current max position
      const { data: groups } = await supabase
        .from('habit_groups')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)

      const nextPosition = groups && groups.length > 0 ? (groups[0].position || 0) + 1 : 0

      const { data: group, error } = await supabase
        .from('habit_groups')
        .insert([{
          title: values.title,
          position: nextPosition
        }])
        .select()
        .single()

      if (error) throw error
      return group
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

export const useLogHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]

  return useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['habit-logs', today] })
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
  const today = new Date().toISOString().split('T')[0]

  return useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['habit-logs', today] })
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