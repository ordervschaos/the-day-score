
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react"
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
  // Generate a subtle background color based on group id
  const getBgColor = () => {
    if (!id) return ""; // Default for ungrouped
    
    const colors = [
      "bg-purple-50/30 dark:bg-purple-950/20",
      "bg-blue-50/30 dark:bg-blue-950/20",
      "bg-green-50/30 dark:bg-green-950/20",
      "bg-amber-50/30 dark:bg-amber-950/20",
      "bg-rose-50/30 dark:bg-rose-950/20",
      "bg-indigo-50/30 dark:bg-indigo-950/20"
    ];
    
    return colors[id % colors.length];
  };

  return (
    <Card className={`${getBgColor()} hover:shadow-sm transition-all duration-200`}>
      <CardHeader className="py-1 px-2 md:py-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-5 w-5 hover:bg-accent hover:text-primary transition-colors"
            onClick={onToggle}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </Button>
          <CardTitle className="text-sm font-medium ml-1 flex items-center">
            {title}
            {habits.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      {!isCollapsed && (
        <CardContent className="pt-0 px-1 md:px-2 pb-2">
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
                {habits.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                    <Sparkles className="h-4 w-4 mb-2 text-muted-foreground/70" />
                    <p>No habits in this group yet</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </CardContent>
      )}
    </Card>
  )
}
