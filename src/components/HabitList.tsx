import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Check, ChevronDown, ChevronRight, Minus, Plus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"

interface HabitItemProps {
  id: number
  title: string
  points: number
  status?: string
  streak?: number
  logCount: number
  onLog: () => void
  onUnlog?: () => void
  index: number
}

interface GroupProps {
  id: number
  title: string
  isCollapsed: boolean
  onToggleCollapse: () => void
  children: React.ReactNode
}

const Group = ({ id, title, isCollapsed, onToggleCollapse, children }: GroupProps) => {
  return (
    <div className="space-y-1">
      <button 
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 p-2 hover:bg-accent/50 rounded-lg transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        <span className="font-medium">{title}</span>
      </button>
      {!isCollapsed && (
        <div className="pl-6">
          {children}
        </div>
      )}
    </div>
  )
}

const HabitItem = ({ id, title, points, status, streak, logCount, onLog, onUnlog, index }: HabitItemProps) => {
  return (
    <div className="flex items-center space-x-4 py-2 px-2 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="flex items-center space-x-2 flex-1">
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-2">
        {status && (
          <Badge variant="secondary" className="text-xs">
            {status}
          </Badge>
        )}
        {streak && (
          <Badge variant="secondary" className="text-xs">
            🔥 {streak}
          </Badge>
        )}
        {logCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {logCount}x
          </Badge>
        )}
        <Badge variant="outline" className="text-xs">
          {points}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={logCount > 0 ? onUnlog : onLog}
          className="h-7 w-7 p-0"
        >
          {logCount > 0 ? (
            <Minus className="h-4 w-4" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}

export const HabitList = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const today = new Date().toISOString().split('T')[0]
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({})

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

  const updatePositionMutation = useMutation({
    mutationFn: async ({ id, position }: { id: number, position: number }) => {
      const { error } = await supabase
        .from('habit_list_items')
        .update({ position })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
    }
  })

  const logHabitMutation = useMutation({
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

  const unlogHabitMutation = useMutation({
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

  const handleDragEnd = (result: any) => {
    if (!result.destination || !listItems) return

    const items = Array.from(listItems)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update positions
    items.forEach((item, index) => {
      updatePositionMutation.mutate({ id: item.id, position: index })
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
                                  onLog={() => handleLogHabit(habitItem.habits)}
                                  onUnlog={() => handleUnlogHabit(habitItem.habits)}
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
                            onLog={() => handleLogHabit(item.habits)}
                            onUnlog={() => handleUnlogHabit(item.habits)}
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