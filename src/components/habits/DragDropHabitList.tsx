import { DragDropContext, Droppable } from "react-beautiful-dnd"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { GroupList } from "./GroupList"

interface DragDropHabitListProps {
  groups: any[]
  habits: any[]
  collapsedGroups: Record<number, boolean>
  isReorderMode: boolean
  viewMode: 'card' | 'list'
  onToggleGroup: (groupId: number) => void
  onLog: (habit: any) => void
  onUnlog: (habit: any) => void
  selectedDate: string
}

export const DragDropHabitList = ({
  groups,
  habits,
  collapsedGroups,
  isReorderMode,
  viewMode,
  onToggleGroup,
  onLog,
  onUnlog,
  selectedDate
}: DragDropHabitListProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

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
      queryClient.setQueryData(['habits', selectedDate], optimisticHabits)

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
      queryClient.invalidateQueries({ queryKey: ['habits', selectedDate] })
    }
  }

  return (
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
              onToggleGroup={onToggleGroup}
              isReorderMode={isReorderMode}
              viewMode={viewMode}
              onLog={onLog}
              onUnlog={onUnlog}
              selectedDate={selectedDate}
            />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}