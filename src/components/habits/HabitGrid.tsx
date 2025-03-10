
import { HabitCard } from "./HabitCard"
import { GripVertical } from "lucide-react"
import { Draggable } from "react-beautiful-dnd"

interface HabitGridProps {
  habits: any[]
  isReorderMode: boolean
  onLog: (habit: any) => void
  onUnlog: (habit: any) => void
  selectedDate: string
}

export const HabitGrid = ({ habits, isReorderMode, onLog, onUnlog, selectedDate }: HabitGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
      {habits.map((habit, index) => (
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
              <div className={isReorderMode ? "flex items-center gap-1" : ""}>
                {isReorderMode && (
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <HabitCard
                    id={habit.id}
                    title={habit.name}
                    points={habit.points}
                    logCount={habit.habit_logs?.filter((log: any) => 
                      log.date === selectedDate && log.status === 'completed'
                    ).length || 0}
                    coverImage={habit.cover_image}
                    isMultiplePerDay={habit.multiple_per_day}
                    onLog={() => onLog(habit)}
                    onUnlog={() => onUnlog(habit)}
                  />
                </div>
              </div>
            </div>
          )}
        </Draggable>
      ))}
    </div>
  )
}
