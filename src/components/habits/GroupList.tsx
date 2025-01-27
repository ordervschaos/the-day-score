import { Group } from "./Group"
import { Draggable, Droppable } from "react-beautiful-dnd"
import { HabitGrid } from "./HabitGrid"
import { HabitListView } from "./HabitListView"

interface GroupListProps {
  groups: any[]
  habits: any[]
  collapsedGroups: Record<number, boolean>
  onToggleGroup: (groupId: number) => void
  isReorderMode: boolean
  viewMode: 'card' | 'list'
  onLog: (habit: any) => void
  onUnlog: (habit: any) => void
}

export const GroupList = ({
  groups,
  habits,
  collapsedGroups,
  onToggleGroup,
  isReorderMode,
  viewMode,
  onLog,
  onUnlog
}: GroupListProps) => {
  // Get ungrouped habits and sort them by position
  const ungroupedHabits = habits
    ?.filter(habit => habit.group_id === null)
    .sort((a, b) => a.position - b.position) || []

  return (
    <div className="space-y-1">
      {/* Ungrouped habits section */}
      <Group
        id={-1}
        title="Ungrouped"
        isCollapsed={collapsedGroups[-1]}
        onToggleCollapse={() => onToggleGroup(-1)}
        showDragHandle={isReorderMode}
      >
        {!collapsedGroups[-1] && (
          <Droppable droppableId="ungrouped" type="habit">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {viewMode === 'card' ? (
                  <HabitGrid
                    habits={ungroupedHabits}
                    isReorderMode={isReorderMode}
                    onLog={onLog}
                    onUnlog={onUnlog}
                  />
                ) : (
                  <HabitListView
                    habits={ungroupedHabits}
                    isReorderMode={isReorderMode}
                    onLog={onLog}
                    onUnlog={onUnlog}
                  />
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}
      </Group>

      {/* Regular groups */}
      {groups?.map((group, groupIndex) => {
        // Get habits for this group and sort them by position
        const groupHabits = habits
          ?.filter(habit => habit.group_id === group.id)
          .sort((a, b) => a.position - b.position) || []

        return (
          <Draggable
            key={group.id}
            draggableId={`group-${group.id}`}
            index={groupIndex}
            isDragDisabled={!isReorderMode}
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.draggableProps}
              >
                <Group
                  id={group.id}
                  title={group.title}
                  isCollapsed={collapsedGroups[group.id]}
                  onToggleCollapse={() => onToggleGroup(group.id)}
                  dragHandleProps={isReorderMode ? provided.dragHandleProps : undefined}
                  showDragHandle={isReorderMode}
                >
                  {!collapsedGroups[group.id] && (
                    <Droppable droppableId={`group-${group.id}`} type="habit">
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          {viewMode === 'card' ? (
                            <HabitGrid
                              habits={groupHabits}
                              isReorderMode={isReorderMode}
                              onLog={onLog}
                              onUnlog={onUnlog}
                            />
                          ) : (
                            <HabitListView
                              habits={groupHabits}
                              isReorderMode={isReorderMode}
                              onLog={onLog}
                              onUnlog={onUnlog}
                            />
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}
                </Group>
              </div>
            )}
          </Draggable>
        )
      })}
    </div>
  )
}