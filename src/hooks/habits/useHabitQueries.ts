
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

export const useHabitGroups = () => {
  return useQuery({
    queryKey: ['habit-groups'],
    queryFn: async () => {
      console.log('Fetching habit groups...')
      const { data, error } = await supabase
        .from('habit_groups')
        .select('*')
        .order('position', { ascending: true })
      
      if (error) throw error
      console.log('Successfully fetched groups:', data)
      return data
    }
  })
}

export const useHabits = (formattedDate: string) => {
  return useQuery({
    queryKey: ['habits', formattedDate],
    queryFn: async () => {
      console.log('Fetching habits for date:', formattedDate)
      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_logs (
            id,
            date,
            status,
            count
          )
        `)
        .eq('is_archived', false)
        .order('position', { ascending: true })
      
      if (error) throw error

      const habitsWithFilteredLogs = data.map(habit => ({
        ...habit,
        habit_logs: habit.habit_logs.filter((log: any) => log.date === formattedDate)
      }))

      console.log('Successfully fetched habits:', habitsWithFilteredLogs)
      return habitsWithFilteredLogs
    }
  })
}
