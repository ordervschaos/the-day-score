import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

export const useCreateHabit = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: { name: string, points: number }) => {
      // First create the habit
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .insert([{
          name: values.name,
          points: values.points
        }])
        .select()
        .single()

      if (habitError) throw habitError

      // Then create the list item
      const { data: listItems } = await supabase
        .from('habit_list_items')
        .select('*')

      const { data: listItem, error: listItemError } = await supabase
        .from('habit_list_items')
        .insert([{
          type: 'habit',
          habit_id: habit.id,
          position: listItems ? listItems.length : 0
        }])
        .select()
        .single()

      if (listItemError) throw listItemError

      return { habit, listItem }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
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
      // First create the group
      const { data: group, error: groupError } = await supabase
        .from('habit_groups')
        .insert([{
          title: values.title
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // Then create the list item
      const { data: listItems } = await supabase
        .from('habit_list_items')
        .select('*')

      const { data: listItem, error: listItemError } = await supabase
        .from('habit_list_items')
        .insert([{
          type: 'group',
          group_id: group.id,
          position: listItems ? listItems.length : 0
        }])
        .select()
        .single()

      if (listItemError) throw listItemError

      return { group, listItem }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
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
      queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
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
      queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
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
    mutationFn: async ({ id, position }: { id: number, position: number }) => {
      const { error } = await supabase
        .from('habit_list_items')
        .update({ position })
        .eq('id', id)

      if (error) throw error
    }
  })
}