import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Check, ChevronDown, ChevronRight, Minus, Plus, FolderPlus } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import { Form, FormField, FormItem, FormLabel, FormControl } from "./ui/form"
import { useForm } from "react-hook-form"

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
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)

  const habitForm = useForm({
    defaultValues: {
      name: "",
      points: 1
    }
  })

  const folderForm = useForm({
    defaultValues: {
      title: ""
    }
  })

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
    }
  })

  const createHabitMutation = useMutation({
    mutationFn: async (values: { name: string, points: number }) => {
      // First create the habit
      const { data: habit, error: habitError } = await supabase
        .from('habits')
        .insert([{
          name: values.name,
          points: values.points
        }])
        .select()
        .single()

      if (habitError) throw habitError

      // Then create the list item
      const { data: listItem, error: listItemError } = await supabase
        .from('habit_list_items')
        .insert([{
          type: 'habit',
          habit_id: habit.id,
          position: listItems ? listItems.length : 0
        }])
        .select()
        .single()

      if (listItemError) throw listItemError

      return { habit, listItem }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
      setIsNewHabitOpen(false)
      habitForm.reset()
      toast({
        title: "Success!",
        description: "Habit created successfully.",
      })
    },
    onError: (error) => {
      console.error('Error creating habit:', error)
      toast({
        title: "Error",
        description: "Failed to create habit. Please try again.",
        variant: "destructive"
      })
    }
  })

  const createFolderMutation = useMutation({
    mutationFn: async (values: { title: string }) => {
      // First create the group
      const { data: group, error: groupError } = await supabase
        .from('habit_groups')
        .insert([{
          title: values.title
        }])
        .select()
        .single()

      if (groupError) throw groupError

      // Then create the list item
      const { data: listItem, error: listItemError } = await supabase
        .from('habit_list_items')
        .insert([{
          type: 'group',
          group_id: group.id,
          position: listItems ? listItems.length : 0
        }])
        .select()
        .single()

      if (listItemError) throw listItemError

      return { group, listItem }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-list-items'] })
      setIsNewFolderOpen(false)
      folderForm.reset()
      toast({
        title: "Success!",
        description: "Folder created successfully.",
      })
    },
    onError: (error) => {
      console.error('Error creating folder:', error)
      toast({
        title: "Error",
        description: "Failed to create folder. Please try again.",
        variant: "destructive"
      })
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
          <Dialog open={isNewHabitOpen} onOpenChange={setIsNewHabitOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Habit</DialogTitle>
              </DialogHeader>
              <Form {...habitForm}>
                <form onSubmit={habitForm.handleSubmit((values) => createHabitMutation.mutate(values))}>
                  <div className="space-y-4">
                    <FormField
                      control={habitForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter habit name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={habitForm.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Create Habit</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <Form {...folderForm}>
                <form onSubmit={folderForm.handleSubmit((values) => createFolderMutation.mutate(values))}>
                  <div className="space-y-4">
                    <FormField
                      control={folderForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter folder name" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit">Create Folder</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
