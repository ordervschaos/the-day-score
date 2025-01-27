import { Group } from "./Group"
import { Draggable, Droppable } from "react-beautiful-dnd"
import { GripVertical } from "lucide-react"

interface GroupListProps {
  groups: any[]
  habits: any[]
  collapsedGroups: Record<number, boolean>
  onToggleGroup: (groupId: number) => void
  isReorderMode: boolean
  viewMode: 'card' | 'list'
  onLog: (habit: any) => void
  onUnlog: (habit: any) => void
  selectedDate: string
}

export const GroupList = ({ 
  groups, 
  habits, 
  collapsedGroups, 
  onToggleGroup,
  isReorderMode,
  viewMode,
  onLog,
  onUnlog,
  selectedDate
}: GroupListProps) => {
  // Get ungrouped habits
  const ungroupedHabits = habits.filter(habit => !habit.group_id)

  return (
    <div className="space-y-4">
      {groups?.map((group, index) => {
        const groupHabits = habits.filter(habit => habit.group_id === group.id)
        
        return (
          <Draggable
            key={`group-${group.id}`}
            draggableId={`group-${group.id}`}
            index={index}
            isDragDisabled={!isReorderMode}
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
              >
                <div className={isReorderMode ? "flex items-start gap-2" : ""}>
                  {isReorderMode && (
                    <div {...provided.dragHandleProps}>
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-2" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Group
                      id={group.id}
                      title={group.title}
                      habits={groupHabits}
                      isCollapsed={collapsedGroups[group.id]}
                      onToggle={() => onToggleGroup(group.id)}
                      isReorderMode={isReorderMode}
                      viewMode={viewMode}
                      onLog={onLog}
                      onUnlog={onUnlog}
                      selectedDate={selectedDate}
                    />
                  </div>
                </div>
              </div>
            )}
          </Draggable>
        )
      })}

      {/* Ungrouped habits */}
      <Droppable droppableId="ungrouped" type="habit">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <Group
              title="Ungrouped"
              habits={ungroupedHabits}
              isCollapsed={collapsedGroups[-1]}
              onToggle={() => onToggleGroup(-1)}
              isReorderMode={isReorderMode}
              viewMode={viewMode}
              onLog={onLog}
              onUnlog={onUnlog}
              selectedDate={selectedDate}
            />
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}