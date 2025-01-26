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

    const habitId = parseInt(result.draggableId.replace('habit-', ''))
    const sourceGroupId = result.source.droppableId === 'ungrouped' 
      ? null 
      : parseInt(result.source.droppableId.replace('group-', ''))
    
    const destinationGroupId = result.destination.droppableId === 'ungrouped'
      ? null
      : parseInt(result.destination.droppableId.replace('group-', ''))

    console.log('Moving habit:', {
      habitId,
      sourceGroupId,
      destinationGroupId,
      sourceIndex: result.source.index,
      destinationIndex: result.destination.index
    })

    // Get habits in the source group
    const sourceHabits = habits.filter((h: any) => h.group_id === sourceGroupId)
    
    // Get habits in the destination group
    const destinationHabits = sourceGroupId === destinationGroupId
      ? sourceHabits
      : habits.filter((h: any) => h.group_id === destinationGroupId)

    // Handle reordering within the same group
    if (sourceGroupId === destinationGroupId) {
      const reorderedHabits = Array.from(destinationHabits)
      const [movedHabit] = reorderedHabits.splice(result.source.index, 1)
      reorderedHabits.splice(result.destination.index, 0, movedHabit)

      // Update positions for all habits in the group
      const updates = reorderedHabits.map((habit: any, index: number) => ({
        id: habit.id,
        position: index
      }))

      // Optimistically update the cache
      const updatedHabits = habits.map((habit: any) => {
        const update = updates.find((u: any) => u.id === habit.id)
        if (update) {
          return { ...habit, position: update.position }
        }
        return habit
      })
      queryClient.setQueryData(['habits'], updatedHabits)

      // Update positions in the database
      for (const update of updates) {
        updatePositionMutation.mutate({
          type: 'habit',
          id: update.id,
          position: update.position
        })
      }
    } else {
      // Handle moving between groups
      const updatedHabits = habits.map((habit: any) => {
        if (habit.id === habitId) {
          return { ...habit, group_id: destinationGroupId }
        }
        return habit
      })
      queryClient.setQueryData(['habits'], updatedHabits)

      const { error } = await supabase
        .from('habits')
        .update({ group_id: destinationGroupId })
        .eq('id', habitId)

      if (error) {
        console.error('Error moving habit between groups:', error)
        toast({
          title: "Error",
          description: "Failed to move habit. Please try again.",
          variant: "destructive"
        })
        queryClient.invalidateQueries({ queryKey: ['habits'] })
      }
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

  // Get ungrouped habits
  const ungroupedHabits = habits?.filter(habit => habit.group_id === null) || []

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
          <Droppable droppableId="groups" type="group">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1"
              >
                {groups?.map((group, index) => (
                  <Draggable 
                    key={group.id} 
                    draggableId={`group-${group.id}`} 
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Group
                          id={group.id}
                          title={group.title}
                          isCollapsed={collapsedGroups[group.id]}
                          onToggleCollapse={() => toggleGroup(group.id)}
                        >
                          <Droppable droppableId={`group-${group.id}`} type="habit">
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                              >
                                {habits
                                  ?.filter(habit => habit.group_id === group.id)
                                  .map((habit, index) => (
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
                        </Group>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Ungrouped habits section */}
                <Droppable droppableId="ungrouped" type="habit">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {ungroupedHabits.length > 0 && (
                        <Group
                          id={-1}
                          title="Ungrouped"
                          isCollapsed={collapsedGroups[-1]}
                          onToggleCollapse={() => toggleGroup(-1)}
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
                        </Group>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}