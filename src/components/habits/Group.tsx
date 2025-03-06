
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
      <CardHeader className="py-1 px-2 md:py-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-5 w-5 hover:bg-accent"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <CardTitle className="text-sm font-medium ml-1">{title}</CardTitle>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="pt-0 px-1 md:px-2">
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
