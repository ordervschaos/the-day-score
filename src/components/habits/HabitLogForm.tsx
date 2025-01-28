import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { HabitCard } from "./HabitCard"
import { useState } from "react"
import { useLogHabit, useUnlogHabit } from "@/hooks/habits/useHabitMutations"

interface HabitLogFormProps {
  habit: {
    id: number
    name: string
    points: number
    cover_image?: string | null
    multiple_per_day?: boolean
    habit_logs?: any[]
  }
}

export const HabitLogForm = ({ habit }: HabitLogFormProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  // Use the same date formatting as the index page
  const formattedDate = selectedDate.toISOString().split('T')[0]
  
  const logHabitMutation = useLogHabit()
  const unlogHabitMutation = useUnlogHabit()

  console.log('Selected date:', selectedDate)
  console.log('Formatted date:', formattedDate)
  console.log('Current habit logs:', habit.habit_logs)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Habit</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border"
        />
        
        <div className="pt-4">
          <HabitCard
            id={habit.id}
            title={habit.name}
            points={habit.points}
            logCount={habit.habit_logs?.filter((log: any) => 
              log.date === formattedDate && log.status === 'completed'
            ).length || 0}
            coverImage={habit.cover_image}
            isMultiplePerDay={habit.multiple_per_day}
            onLog={() => logHabitMutation.mutate({ 
              ...habit, 
              date: formattedDate,
              habit_logs: habit.habit_logs?.filter((log: any) => 
                log.date === formattedDate && log.status === 'completed'
              )
            })}
            onUnlog={() => unlogHabitMutation.mutate({ 
              ...habit, 
              date: formattedDate,
              habit_logs: habit.habit_logs?.filter((log: any) => 
                log.date === formattedDate && log.status === 'completed'
              )
            })}
          />
        </div>
      </CardContent>
    </Card>
  )
}