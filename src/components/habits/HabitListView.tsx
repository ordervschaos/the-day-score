import { HabitItem } from "./HabitItem"
import { GripVertical } from "lucide-react"
import { Draggable } from "react-beautiful-dnd"

interface HabitListViewProps {
  habits: any[]
  isReorderMode: boolean
  onLog: (habit: any) => void
  onUnlog: (habit: any) => void
  selectedDate: string
}

export const HabitListView = ({ habits, isReorderMode, onLog, onUnlog, selectedDate }: HabitListViewProps) => {
  return (
    <div className="space-y-1">
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
              <div className={isReorderMode ? "flex items-center gap-2" : ""}>
                {isReorderMode && (
                  <div {...provided.dragHandleProps}>
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <HabitItem
                    id={habit.id}
                    title={habit.name}
                    points={habit.points}
                    logCount={habit.habit_logs?.filter((log: any) => 
                      log.date === selectedDate && log.status === 'completed'
                    ).length || 0}
                    isMultiplePerDay={habit.multiple_per_day}
                    onLog={() => onLog(habit)}
                    onUnlog={() => onUnlog(habit)}
                    index={index}
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