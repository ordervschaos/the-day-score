import { ChevronDown, ChevronRight } from "lucide-react"

interface GroupProps {
  id: number
  title: string
  isCollapsed: boolean
  onToggleCollapse: () => void
  children: React.ReactNode
}

export const Group = ({ title, isCollapsed, onToggleCollapse, children }: GroupProps) => {
  return (
    <div className="space-y-1">
      <button 
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 p-2 hover:bg-accent/50 rounded-lg transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        <span className="font-medium">{title}</span>
      </button>
      {!isCollapsed && (
        <div className="pl-6">
          {children}
        </div>
      )}
    </div>
  )
}