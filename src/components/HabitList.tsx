import { ChevronDown, MoreVertical, Plus } from "lucide-react"
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
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

interface HabitItemProps {
  title: string
  points: number
  status?: string
  streak?: number
  onToggle?: () => void
}

const HabitItem = ({ title, points, status, streak, onToggle }: HabitItemProps) => {
  return (
    <div className="flex items-center space-x-4 py-2">
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
  )
}

interface HabitGroupProps {
  title: string
  habits: HabitItemProps[]
  onAddHabit?: () => void
  onEditGroup?: () => void
}

const HabitGroup = ({ title, habits, onAddHabit, onEditGroup }: HabitGroupProps) => {
  return (
    <AccordionItem value={title}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
              e.stopPropagation()
              onAddHabit?.()
            }}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => {
              e.stopPropagation()
              onEditGroup?.()
            }}>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-1">
          {habits.map((habit, index) => (
            <HabitItem key={index} {...habit} />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}

export const HabitList = () => {
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

  const groups = habitGroups?.map(group => ({
    title: group.title,
    habits: group.habit_list_items
      .filter(item => item.type === 'habit' && item.habits)
      .map(item => ({
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
        <Accordion type="multiple" className="space-y-4">
          {groups.map((group) => (
            <HabitGroup 
              key={group.title} 
              {...group} 
              onAddHabit={() => console.log('Add habit to group')}
              onEditGroup={() => console.log('Edit group')}
            />
          ))}
        </Accordion>
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