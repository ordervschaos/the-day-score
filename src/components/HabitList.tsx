import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { supabase } from "@/integrations/supabase/client"
import { useState } from "react"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import { useToast } from "@/hooks/use-toast"
import { useLogHabit, useUnlogHabit, useUpdatePosition } from "@/hooks/habits/useHabitMutations"
import { HabitItem } from "./habits/HabitItem"
import { HabitCard } from "./habits/HabitCard"
import { Group } from "./habits/Group"
import { CreateHabitDialog } from "./habits/CreateHabitDialog"
import { CreateFolderDialog } from "./habits/CreateFolderDialog"
import { Button } from "./ui/button"
import { GripVertical, LayoutGrid, LayoutList } from "lucide-react"
import { Toggle } from "./ui/toggle"

export const HabitList = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({})
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
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
        .eq('is_archived', false) // Add this line to filter out archived habits
        .order('position', { ascending: true })
      
      if (error) throw error
      console.log('Successfully fetched habits:', data)
      return data
    }
  })

  const updatePositionMutation = useUpdatePosition()

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

  // Get ungrouped habits and sort them by position
  const ungroupedHabits = habits
    ?.filter(habit => habit.group_id === null)
    .sort((a, b) => a.position - b.position) || []

  const renderHabit = (habit: any, provided?: any) => {
    const commonProps = {
      id: habit.id,
      title: habit.name,
      points: habit.points,
      logCount: habit.habit_logs?.filter((log: any) => 
        log.date === today && log.status === 'completed'
      ).length || 0,
      onLog: () => logHabitMutation.mutate(habit),
      onUnlog: () => unlogHabitMutation.mutate(habit),
    }

    if (viewMode === 'card') {
      return (
        <div className={isReorderMode ? "flex items-center gap-2" : ""}>
          {isReorderMode && provided && (
            <div {...provided.dragHandleProps}>
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1">
            <HabitCard {...commonProps} coverImage={habit.cover_image} />
          </div>
        </div>
      )
    }

    return (
      <div className={isReorderMode ? "flex items-center gap-2" : ""}>
        {isReorderMode && provided && (
          <div {...provided.dragHandleProps}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <HabitItem {...commonProps} index={habit.position} />
        </div>
      </div>
    )
  }

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
          <Button
            variant="outline"
            onClick={() => setIsReorderMode(!isReorderMode)}
          >
            {isReorderMode ? "Done Reordering" : "Reorder"}
          </Button>
          <div className="flex-1" />
          <div className="flex items-center border rounded-md">
            <Toggle
              pressed={viewMode === 'list'}
              onPressedChange={() => setViewMode('list')}
              className="rounded-none rounded-l-md"
              aria-label="List view"
            >
              <LayoutList className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={viewMode === 'card'}
              onPressedChange={() => setViewMode('card')}
              className="rounded-none rounded-r-md"
              aria-label="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Toggle>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="groups" type="group">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-1"
              >
                {/* Ungrouped habits section */}
                <Group
                  id={-1}
                  title="Ungrouped"
                  isCollapsed={collapsedGroups[-1]}
                  onToggleCollapse={() => toggleGroup(-1)}
                  showDragHandle={isReorderMode}
                >
                  {!collapsedGroups[-1] && (
                    <Droppable droppableId="ungrouped" type="habit">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-1'}
                        >
                          {ungroupedHabits.map((habit, index) => (
                            <Draggable
                              key={habit.id}
                              draggableId={`habit-${habit.id}`}
                              index={index}
                              isDragDisabled={!isReorderMode}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                >
                                  {renderHabit(habit, provided)}
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
                {groups?.map((group, groupIndex) => {
                  // Get habits for this group and sort them by position
                  const groupHabits = habits
                    ?.filter(habit => habit.group_id === group.id)
                    .sort((a, b) => a.position - b.position) || []

                  return (
                    <Draggable
                      key={group.id}
                      draggableId={`group-${group.id}`}
                      index={groupIndex}
                      isDragDisabled={!isReorderMode}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                        >
                          <Group
                            id={group.id}
                            title={group.title}
                            isCollapsed={collapsedGroups[group.id]}
                            onToggleCollapse={() => toggleGroup(group.id)}
                            dragHandleProps={isReorderMode ? provided.dragHandleProps : undefined}
                            showDragHandle={isReorderMode}
                          >
                            {!collapsedGroups[group.id] && (
                              <Droppable droppableId={`group-${group.id}`} type="habit">
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-1'}
                                  >
                                    {groupHabits.map((habit, index) => (
                                      <Draggable
                                        key={habit.id}
                                        draggableId={`habit-${habit.id}`}
                                        index={index}
                                        isDragDisabled={!isReorderMode}
                                      >
                                        {(provided) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                          >
                                            {renderHabit(habit, provided)}
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
                      )}
                    </Draggable>
                  )
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}
