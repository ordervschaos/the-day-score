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

  const handleDragEnd = (result: any) => {
    if (!result.destination || !habits || !groups) return

    const sourceType = result.source.droppableId === 'groups' ? 'group' : 'habit'
    const destinationType = result.destination.droppableId === 'groups' ? 'group' : 'habit'

    if (sourceType === 'group' && destinationType === 'group') {
      const items = Array.from(groups)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      // Optimistically update the cache
      queryClient.setQueryData(['habit-groups'], items)

      // Update positions in the background
      items.forEach((item, index) => {
        updatePositionMutation.mutate({ 
          type: 'group',
          id: item.id, 
          position: index 
        })
      })
    } else if (sourceType === 'habit' && destinationType === 'habit') {
      const items = Array.from(habits)
      const [reorderedItem] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, reorderedItem)

      // Optimistically update the cache
      queryClient.setQueryData(['habits'], items)

      // Update positions in the background
      items.forEach((item, index) => {
        updatePositionMutation.mutate({ 
          type: 'habit',
          id: item.id, 
          position: index 
        })
      })
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
          <Droppable droppableId="groups">
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
                          {habits
                            ?.filter(habit => habit.group_id === group.id)
                            .map((habit) => (
                              <HabitItem
                                key={habit.id}
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
                            ))}
                        </Group>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}

                {/* Ungrouped habits section */}
                {ungroupedHabits.length > 0 && (
                  <Group
                    id={-1} // Use a special ID for ungrouped section
                    title="Ungrouped"
                    isCollapsed={collapsedGroups[-1]}
                    onToggleCollapse={() => toggleGroup(-1)}
                  >
                    {ungroupedHabits.map((habit) => (
                      <HabitItem
                        key={habit.id}
                        id={habit.id}
                        title={habit.name}
                        points={habit.points}
                        logCount={habit.habit_logs?.filter((log: any) => 
                          log.date === today && log.status === 'completed'
                        ).length || 0}
                        onLog={() => logHabitMutation.mutate(habit)}
                        onUnlog={() => unlogHabitMutation.mutate(habit)}
                        index={-1}
                      />
                    ))}
                  </Group>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}