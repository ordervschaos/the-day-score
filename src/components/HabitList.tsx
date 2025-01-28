import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useState } from "react"
import { DragDropContext, Droppable } from "react-beautiful-dnd"
import { useToast } from "@/hooks/use-toast"
import { useLogHabit, useUnlogHabit, useUpdatePosition } from "@/hooks/habits/useHabitMutations"
import { HabitListHeader } from "./habits/HabitListHeader"
import { GroupList } from "./habits/GroupList"

interface HabitListProps {
  selectedDate: Date;
}

export const HabitList = ({ selectedDate }: HabitListProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({})
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const formattedDate = selectedDate.toISOString().split('T')[0]

  const { data: groups, isLoading: isLoadingGroups } = useQuery({
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

  const { data: habits, isLoading: isLoadingHabits } = useQuery({
    queryKey: ['habits', formattedDate],
    queryFn: async () => {
      console.log('Fetching habits...')
      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_logs (
            id,
            date,
            status
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

  const handleDragEnd = async (result: any) => {
    if (!isReorderMode) return
    console.log('Drag end result:', result)
    if (!result.destination || !habits || !groups) return

    const { draggableId, source, destination, type } = result

    // Early return if dropped in the same spot
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

    // Handle group reordering
    if (type === 'group') {
      const groupId = parseInt(draggableId.replace('group-', ''))
      const updates = []
      const reorderedGroups = Array.from(groups)
      const [removed] = reorderedGroups.splice(source.index, 1)
      reorderedGroups.splice(destination.index, 0, removed)

      // Update positions for all affected groups
      reorderedGroups.forEach((group, index) => {
        if (group.position !== index) {
          updates.push({
            id: group.id,
            position: index
          })
        }
      })

      try {
        // Optimistically update the cache
        queryClient.setQueryData(['habit-groups'], reorderedGroups)

        // Update the database
        const promises = updates.map(update => 
          supabase
            .from('habit_groups')
            .update({ position: update.position })
            .eq('id', update.id)
        )

        await Promise.all(promises)
        toast({
          title: "Success",
          description: "Group order updated successfully.",
        })
      } catch (error) {
        console.error('Error updating group positions:', error)
        toast({
          title: "Error",
          description: "Failed to update group positions. Please try again.",
          variant: "destructive"
        })
        // Revert optimistic update on error
        queryClient.invalidateQueries({ queryKey: ['habit-groups'] })
      }
      return
    }

    // Handle habit reordering
    const habitId = parseInt(draggableId.replace('habit-', ''))
    const sourceGroupId = source.droppableId === 'ungrouped' 
      ? null 
      : parseInt(source.droppableId.replace('group-', ''))
    
    const destinationGroupId = destination.droppableId === 'ungrouped'
      ? null
      : parseInt(destination.droppableId.replace('group-', ''))

    console.log('Moving habit:', {
      habitId,
      sourceGroupId,
      destinationGroupId,
      sourceIndex: source.index,
      destinationIndex: destination.index
    })

    try {
      // Create a copy of all habits
      const optimisticHabits = [...habits]

      // Find the moved habit
      const movedHabitIndex = optimisticHabits.findIndex(h => h.id === habitId)
      const movedHabit = optimisticHabits[movedHabitIndex]

      // Remove the habit from its current position
      optimisticHabits.splice(movedHabitIndex, 1)

      // Find where to insert the habit in the destination group
      const destinationGroupHabits = optimisticHabits.filter(h => h.group_id === destinationGroupId)
      const insertIndex = optimisticHabits.findIndex(h => h.group_id === destinationGroupId) + destination.index

      // Insert the habit at the new position
      optimisticHabits.splice(insertIndex, 0, {
        ...movedHabit,
        group_id: destinationGroupId,
        position: destination.index
      })

      // Update positions for all affected habits
      const updates = optimisticHabits
        .filter(h => h.group_id === sourceGroupId || h.group_id === destinationGroupId)
        .map((habit, index) => ({
          id: habit.id,
          group_id: habit.group_id,
          position: index
        }))

      console.log('Position updates:', updates)

      // Apply optimistic update
      queryClient.setQueryData(['habits', formattedDate], optimisticHabits)

      // Update the database
      const promises = updates.map(update => 
        supabase
          .from('habits')
          .update({
            group_id: update.group_id,
            position: update.position
          })
          .eq('id', update.id)
      )

      await Promise.all(promises)
      
      toast({
        title: "Success",
        description: "Habit moved successfully.",
      })
    } catch (error) {
      console.error('Error updating positions:', error)
      toast({
        title: "Error",
        description: "Failed to update positions. Please try again.",
        variant: "destructive"
      })
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['habits', formattedDate] })
    }
  }

  const logHabitMutation = useLogHabit()
  const unlogHabitMutation = useUnlogHabit()

  const toggleGroup = (groupId: number) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  if (isLoadingGroups || isLoadingHabits) {
    return <div>Loading habits...</div>
  }

  return (
    <Card className="bg-background border-none shadow-none">
      <CardContent className="p-0">
        <HabitListHeader
          isReorderMode={isReorderMode}
          onReorderModeChange={setIsReorderMode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="groups" type="group">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <GroupList
                  groups={groups}
                  habits={habits}
                  collapsedGroups={collapsedGroups}
                  onToggleGroup={toggleGroup}
                  isReorderMode={isReorderMode}
                  viewMode={viewMode}
                  onLog={(habit) => logHabitMutation.mutate({ ...habit, date: formattedDate })}
                  onUnlog={(habit) => unlogHabitMutation.mutate({ ...habit, date: formattedDate })}
                  selectedDate={formattedDate}
                />
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}