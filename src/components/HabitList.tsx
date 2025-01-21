import { ChevronDown, ChevronRight, MoreVertical, Plus } from "lucide-react"
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader } from "./ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { Badge } from "./ui/badge"
import { Checkbox } from "./ui/checkbox"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

interface HabitItemProps {
  id: number
  title: string
  points: number
  status?: string
  streak?: number
  onToggle?: () => void
  index: number
}

const HabitItem = ({ id, title, points, status, streak, onToggle, index }: HabitItemProps) => {
  return (
    <Draggable draggableId={id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center space-x-4 py-2 ${snapshot.isDragging ? "bg-accent" : ""}`}
        >
          <div className="flex items-center space-x-2 flex-1">
            <Checkbox onCheckedChange={onToggle} />
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
            <Badge variant="outline" className="text-xs">
              {points}
            </Badge>
          </div>
        </div>
      )}
    </Draggable>
  )
}

interface HabitGroupProps {
  id: number
  title: string
  habits: HabitItemProps[]
  onAddHabit?: () => void
  onEditGroup?: () => void
  onDeleteGroup?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

const HabitGroup = ({ 
  id,
  title, 
  habits, 
  onAddHabit, 
  onEditGroup,
  onDeleteGroup,
  isCollapsed,
  onToggleCollapse 
}: HabitGroupProps) => {
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onToggleCollapse}>
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onAddHabit}>
            <Plus className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onEditGroup}>
                Edit Group
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={onDeleteGroup}>
                Delete Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {!isCollapsed && (
        <Droppable droppableId={`group-${id}`}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1">
              {habits.map((habit, index) => (
                <HabitItem key={habit.id} {...habit} index={index} />
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  )
}

export const HabitList = () => {
  const queryClient = useQueryClient()

  const { data: habitGroups } = useQuery({
    queryKey: ['habit-groups'],
    queryFn: async () => {
      const { data: groups, error } = await supabase
        .from('habit_groups')
        .select(`
          id,
          title,
          habit_list_items!inner(
            id,
            position,
            type,
            is_collapsed,
            habits(
              id,
              name,
              points
            )
          )
        `)
        .order('created_at', { ascending: true })

      if (error) throw error
      return groups
    }
  })

  const updateCollapsedMutation = useMutation({
    mutationFn: async ({ groupId, isCollapsed }: { groupId: number, isCollapsed: boolean }) => {
      const { error } = await supabase
        .from('habit_list_items')
        .update({ is_collapsed: isCollapsed })
        .eq('id', groupId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habit-groups'] })
    }
  })

  const onDragEnd = async (result: any) => {
    if (!result.destination) return

    const sourceGroupId = result.source.droppableId.replace('group-', '')
    const destGroupId = result.destination.droppableId.replace('group-', '')
    
    // TODO: Implement drag and drop reordering logic with Supabase
    console.log('Reordering from group', sourceGroupId, 'to group', destGroupId)
  }

  const groups = habitGroups?.map(group => ({
    id: group.id,
    title: group.title,
    isCollapsed: group.habit_list_items.find(item => item.type === 'group')?.is_collapsed || false,
    habits: group.habit_list_items
      .filter(item => item.type === 'habit' && item.habits)
      .map(item => ({
        id: item.id,
        title: item.habits?.name || '',
        points: item.habits?.points || 0,
      }))
  })) || []

  return (
    <Card className="bg-background border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-sm">
            Last 7 Days <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="ghost" className="text-sm">
            View Analytics
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-4">
            {groups.map((group) => (
              <HabitGroup 
                key={group.id}
                {...group}
                onAddHabit={() => console.log('Add habit to group', group.id)}
                onEditGroup={() => console.log('Edit group', group.id)}
                onDeleteGroup={() => console.log('Delete group', group.id)}
                onToggleCollapse={() => {
                  updateCollapsedMutation.mutate({
                    groupId: group.id,
                    isCollapsed: !group.isCollapsed
                  })
                }}
              />
            ))}
          </div>
        </DragDropContext>
        <div className="mt-4 space-y-2">
          <Button variant="outline" className="w-full justify-start">
            Add New Habit
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Add New Group
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}