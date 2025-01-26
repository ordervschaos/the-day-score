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

  const { data: listItems, isLoading, error } = useQuery({
    queryKey: ['habit-list-items'],
    queryFn: async () => {
      console.log('Fetching habit list items...')
      try {
        const { data: items, error: itemsError } = await supabase
          .from('habit_list_items')
          .select(`
            id,
            position,
            type,
            habit_id,
            group_id,
            is_collapsed,
            habits (
              id,
              name,
              points,
              habit_logs (
                id,
                date,
                status
              )
            ),
            habit_groups (
              id,
              title
            )
          `)
          .order('position', { ascending: true })
        
        if (itemsError) throw itemsError
        
        console.log('Successfully fetched list items:', items)
        return items
      } catch (err) {
        console.error('Error in queryFn:', err)
        throw err
      }
    }
  })

  const updatePositionMutation = useUpdatePosition()
  const logHabitMutation = useLogHabit()
  const unlogHabitMutation = useUnlogHabit()

  const handleDragEnd = (result: any) => {
    if (!result.destination || !listItems) return

    const items = Array.from(listItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Optimistically update the cache
    queryClient.setQueryData(['habit-list-items'], items)

    // Update positions in the background
    items.forEach((item, index) => {
      updatePositionMutation.mutate({ 
        id: item.id, 
        position: index 
      }, {
        onError: () => {
          // Revert the cache on error
          queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
          toast({
            title: "Error",
            description: "Failed to update positions. Please try again.",
            variant: "destructive"
          })
        }
      })
    })
  }

  const toggleGroup = (groupId: number) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  if (isLoading) {
    return <div>Loading habits...</div>
  }

  if (error) {
    console.error('React Query error:', error)
    return <div>Error loading habits: {error.message}</div>
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
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="habits">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-1"
              >
                {listItems?.map((item: any, index: number) => (
                  <Draggable 
                    key={item.id} 
                    draggableId={item.id.toString()} 
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {item.type === 'group' && item.habit_groups ? (
                          <Group
                            id={item.habit_groups.id}
                            title={item.habit_groups.title}
                            isCollapsed={collapsedGroups[item.habit_groups.id]}
                            onToggleCollapse={() => toggleGroup(item.habit_groups.id)}
                          >
                            {listItems
                              .filter((habitItem: any) => 
                                habitItem.type === 'habit' && 
                                habitItem.group_id === item.habit_groups.id
                              )
                              .map((habitItem: any) => (
                                <HabitItem
                                  key={habitItem.habits.id}
                                  id={habitItem.habits.id}
                                  title={habitItem.habits.name}
                                  points={habitItem.habits.points}
                                  logCount={habitItem.habits.habit_logs?.filter((log: any) => 
                                    log.date === today && log.status === 'completed'
                                  ).length || 0}
                                  onLog={() => logHabitMutation.mutate(habitItem.habits)}
                                  onUnlog={() => unlogHabitMutation.mutate(habitItem.habits)}
                                  index={index}
                                />
                              ))}
                          </Group>
                        ) : item.type === 'habit' && item.habits ? (
                          <HabitItem
                            id={item.habits.id}
                            title={item.habits.name}
                            points={item.habits.points}
                            logCount={item.habits.habit_logs?.filter((log: any) => 
                              log.date === today && log.status === 'completed'
                            ).length || 0}
                            onLog={() => logHabitMutation.mutate(item.habits)}
                            onUnlog={() => unlogHabitMutation.mutate(item.habits)}
                            index={index}
                          />
                        ) : null}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  )
}