import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Droppable } from "react-beautiful-dnd"
import { HabitGrid } from "./HabitGrid"
import { HabitListView } from "./HabitListView"

interface GroupProps {
  id?: number
  title: string
  habits: any[]
  isCollapsed: boolean
  onToggle: () => void
  isReorderMode: boolean
  viewMode: 'card' | 'list'
  onLog: (habit: any) => void
  onUnlog: (habit: any) => void
  selectedDate: string
}

export const Group = ({ 
  id, 
  title, 
  habits, 
  isCollapsed, 
  onToggle,
  isReorderMode,
  viewMode,
  onLog,
  onUnlog,
  selectedDate
}: GroupProps) => {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6 hover:bg-accent"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <CardTitle className="text-base font-medium ml-2">{title}</CardTitle>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="pt-0">
          <Droppable droppableId={id ? `group-${id}` : 'ungrouped'} type="habit">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {viewMode === 'card' ? (
                  <HabitGrid
                    habits={habits}
                    isReorderMode={isReorderMode}
                    onLog={onLog}
                    onUnlog={onUnlog}
                    selectedDate={selectedDate}
                  />
                ) : (
                  <HabitListView
                    habits={habits}
                    isReorderMode={isReorderMode}
                    onLog={onLog}
                    onUnlog={onUnlog}
                    selectedDate={selectedDate}
                  />
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </CardContent>
      )}
    </Card>
  )
}