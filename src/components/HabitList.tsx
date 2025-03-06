
import { Card, CardContent } from "./ui/card"
import { useState } from "react"
import { useLogHabit, useUnlogHabit } from "@/hooks/habits/useHabitMutations"
import { HabitListHeader } from "./habits/HabitListHeader"
import { DragDropHabitList } from "./habits/DragDropHabitList"
import { useHabitGroups, useHabits } from "@/hooks/habits/useHabitQueries"

interface HabitListProps {
  selectedDate: Date;
}

export const HabitList = ({ selectedDate }: HabitListProps) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<number, boolean>>({})
  const [isReorderMode, setIsReorderMode] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  
  // Format date in local timezone
  const formattedDate = selectedDate.toLocaleDateString('en-CA') // This formats as YYYY-MM-DD in local timezone

  console.log('Selected date:', selectedDate)
  console.log('Formatted date for DB:', formattedDate)

  const { data: groups, isLoading: isLoadingGroups } = useHabitGroups()
  const { data: habits, isLoading: isLoadingHabits } = useHabits(formattedDate)

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

  return (
    <Card className="bg-background border-none shadow-none">
      <CardContent className="p-0">
        <HabitListHeader
          isReorderMode={isReorderMode}
          onReorderModeChange={setIsReorderMode}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <DragDropHabitList
          groups={groups}
          habits={habits}
          collapsedGroups={collapsedGroups}
          isReorderMode={isReorderMode}
          viewMode={viewMode}
          onToggleGroup={toggleGroup}
          onLog={(habit) => logHabitMutation.mutate({ ...habit, date: formattedDate })}
          onUnlog={(habit) => unlogHabitMutation.mutate({ ...habit, date: formattedDate })}
          selectedDate={formattedDate}
        />
      </CardContent>
    </Card>
  )
}
