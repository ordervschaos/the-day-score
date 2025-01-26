import { ChevronDown, ChevronRight, GripVertical } from "lucide-react"

interface GroupProps {
  id: number
  title: string
  isCollapsed: boolean
  onToggleCollapse: () => void
  children: React.ReactNode
  dragHandleProps?: any
  showDragHandle?: boolean
}

export const Group = ({ 
  title, 
  isCollapsed, 
  onToggleCollapse, 
  children,
  dragHandleProps,
  showDragHandle
}: GroupProps) => {
  return (
    <div className="space-y-1">
      <div 
        className="w-full flex items-center gap-2 p-2 hover:bg-accent/50 rounded-lg transition-colors"
      >
        {showDragHandle && (
          <div {...dragHandleProps}>
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <button 
          onClick={onToggleCollapse}
          className="flex items-center gap-2 flex-1"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          <span className="font-medium">{title}</span>
        </button>
      </div>
      {!isCollapsed && (
        <div className="pl-6">
          {children}
        </div>
      )}
    </div>
  )
}