import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useState } from "react"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import { useToast } from "@/hooks/use-toast"
import { useLogHabit, useUnlogHabit, useUpdatePosition } from "@/hooks/habits/useHabitMutations"
import { HabitItem } from "./habits/HabitItem"
import { Group } from "./habits/Group"
import { CreateHabitDialog } from "./habits/CreateHabitDialog"
import { CreateFolderDialog } from "./habits/CreateFolderDialog"

export const HabitList = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({})
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)

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
        .order('position', { ascending: true })
      
      if (error) throw error
      console.log('Successfully fetched habits:', data)
      return data
    }
  })

  const updatePositionMutation = useUpdatePosition()
  const logHabitMutation = useLogHabit()
  const unlogHabitMutation = useUnlogHabit()

  const handleDragEnd = async (result: any) => {
    console.log('Drag end result:', result)
    if (!result.destination || !habits || !groups) return

    const { draggableId, source, destination } = result

    // Early return if dropped in the same spot
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return
    }

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
      const sourceHabits = habits.filter((h: any) => h.group_id === sourceGroupId)
        .sort((a: any, b: any) => a.position - b.position)

      // Get all habits in the destination group
      const destinationHabits = sourceGroupId === destinationGroupId
        ? sourceHabits
        : habits.filter((h: any) => h.group_id === destinationGroupId)
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
      // Revert the optimistic update
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    }
  }

  const toggleGroup = (groupId: number) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  if (isLoadingGroups || isLoadingHabits) {
    return <div>Loading habits...</div>
  }

  // Get ungrouped habits and sort them by position
  const ungroupedHabits = habits
    ?.filter(habit => habit.group_id === null)
    .sort((a, b) => a.position - b.position) || []

  return (
    <Card className="bg-background border-none shadow-none">
      <CardContent>
        <div className="flex gap-2 mb-4">
          <CreateHabitDialog 
            isOpen={isNewHabitOpen}
            onOpenChange={setIsNewHabitOpen}
          />
          <CreateFolderDialog
            isOpen={isNewFolderOpen}
            onOpenChange={setIsNewFolderOpen}
          />
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="space-y-1">
            {/* Ungrouped habits section */}
            <Group
              id={-1}
              title="Ungrouped"
              isCollapsed={collapsedGroups[-1]}
              onToggleCollapse={() => toggleGroup(-1)}
            >
              {!collapsedGroups[-1] && (
                <Droppable droppableId="ungrouped" type="habit">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {ungroupedHabits.map((habit, index) => (
                        <Draggable
                          key={habit.id}
                          draggableId={`habit-${habit.id}`}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <HabitItem
                                id={habit.id}
                                title={habit.name}
                                points={habit.points}
                                logCount={habit.habit_logs?.filter((log: any) => 
                                  log.date === today && log.status === 'completed'
                                ).length || 0}
                                onLog={() => logHabitMutation.mutate(habit)}
                                onUnlog={() => unlogHabitMutation.mutate(habit)}
                                index={index}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </Group>

            {/* Regular groups */}
            {groups?.map((group) => {
              // Get habits for this group and sort them by position
              const groupHabits = habits
                ?.filter(habit => habit.group_id === group.id)
                .sort((a, b) => a.position - b.position) || []

              return (
                <div key={group.id}>
                  <Group
                    id={group.id}
                    title={group.title}
                    isCollapsed={collapsedGroups[group.id]}
                    onToggleCollapse={() => toggleGroup(group.id)}
                  >
                    {!collapsedGroups[group.id] && (
                      <Droppable droppableId={`group-${group.id}`} type="habit">
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                          >
                            {groupHabits.map((habit, index) => (
                              <Draggable
                                key={habit.id}
                                draggableId={`habit-${habit.id}`}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                  >
                                    <HabitItem
                                      id={habit.id}
                                      title={habit.name}
                                      points={habit.points}
                                      logCount={habit.habit_logs?.filter((log: any) => 
                                        log.date === today && log.status === 'completed'
                                      ).length || 0}
                                      onLog={() => logHabitMutation.mutate(habit)}
                                      onUnlog={() => unlogHabitMutation.mutate(habit)}
                                      index={index}
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    )}
                  </Group>
                </div>
              )
            })}
          </div>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}