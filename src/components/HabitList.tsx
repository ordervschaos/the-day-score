import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useState } from "react"
import { DragDropContext } from "react-beautiful-dnd"
import { useToast } from "@/hooks/use-toast"
import { useLogHabit, useUnlogHabit, useUpdatePosition } from "@/hooks/habits/useHabitMutations"
import { HabitListHeader } from "./habits/HabitListHeader"
import { GroupList } from "./habits/GroupList"

export const HabitList = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({})
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

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
    queryKey: ['habits'],
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
      console.log('Successfully fetched habits:', data)
      return data
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
        for (const update of updates) {
          await supabase
            .from('habit_groups')
            .update({ position: update.position })
            .eq('id', update.id)
        }

        // Invalidate and refetch to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['habit-groups'] })
      } catch (error) {
        console.error('Error updating group positions:', error)
        toast({
          title: "Error",
          description: "Failed to update group positions. Please try again.",
          variant: "destructive"
        })
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
      // Get all habits in the source group
      const sourceHabits = habits
        .filter((h: any) => h.group_id === sourceGroupId)
        .sort((a: any, b: any) => a.position - b.position)

      // Get all habits in the destination group
      const destinationHabits = sourceGroupId === destinationGroupId
        ? sourceHabits
        : habits
          .filter((h: any) => h.group_id === destinationGroupId)
          .sort((a: any, b: any) => a.position - b.position)

      // Prepare updates array
      const updates = []

      // Update the moved habit
      updates.push({
        id: habitId,
        group_id: destinationGroupId,
        position: destination.index
      })

      // Update positions in source group
      if (sourceGroupId !== destinationGroupId) {
        sourceHabits.forEach((habit: any, index: number) => {
          if (habit.id !== habitId && habit.position !== index) {
            updates.push({
              id: habit.id,
              group_id: sourceGroupId,
              position: index
            })
          }
        })
      }

      // Update positions in destination group
      destinationHabits.forEach((habit: any, index: number) => {
        const newPosition = index >= destination.index ? index + 1 : index
        if (habit.id !== habitId && habit.position !== newPosition) {
          updates.push({
            id: habit.id,
            group_id: destinationGroupId,
            position: newPosition
          })
        }
      })

      console.log('Position updates:', updates)

      // Optimistically update the cache
      const optimisticHabits = habits.map(habit => {
        const update = updates.find(u => u.id === habit.id)
        if (update) {
          return { ...habit, ...update }
        }
        return habit
      })

      queryClient.setQueryData(['habits'], optimisticHabits)

      // Update the database
      for (const update of updates) {
        await supabase
          .from('habits')
          .update({
            group_id: update.group_id,
            position: update.position
          })
          .eq('id', update.id)
      }

    } catch (error) {
      console.error('Error updating positions:', error)
      toast({
        title: "Error",
        description: "Failed to update positions. Please try again.",
        variant: "destructive"
      })
      queryClient.invalidateQueries({ queryKey: ['habits'] })
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
      <CardContent>
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
                  onLog={(habit) => logHabitMutation.mutate(habit)}
                  onUnlog={(habit) => unlogHabitMutation.mutate(habit)}
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