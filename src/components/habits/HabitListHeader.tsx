
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { LayoutGrid, LayoutList, GripHorizontal, Plus, FolderPlus } from "lucide-react"
import { CreateHabitDialog } from "./CreateHabitDialog"
import { CreateFolderDialog } from "./CreateFolderDialog"
import { useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"

interface HabitListHeaderProps {
  isReorderMode: boolean
  onReorderModeChange: (value: boolean) => void
  viewMode: 'card' | 'list'
  onViewModeChange: (mode: 'card' | 'list') => void
}

interface ActionButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
}

const ActionButton = ({ onClick, icon, label }: ActionButtonProps) => {
  const isMobile = useIsMobile()
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 h-7"
    >
      {icon}
      {isMobile ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="text-xs">{label}</span>
      )}
    </Button>
  )
}

export const HabitListHeader = ({
  isReorderMode,
  onReorderModeChange,
  viewMode,
  onViewModeChange
}: HabitListHeaderProps) => {
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)

  return (
    <div className="flex gap-1 mb-2">
      <div className="flex gap-1 flex-1">
        <CreateHabitDialog 
          isOpen={isNewHabitOpen}
          onOpenChange={setIsNewHabitOpen}
        />
        
        <CreateFolderDialog
          isOpen={isNewFolderOpen}
          onOpenChange={setIsNewFolderOpen}
        />
        
        
        
      </div>

      <div className="flex items-center rounded-md">

      <ActionButton
          onClick={() => onReorderModeChange(!isReorderMode)}
          icon={<GripHorizontal className="h-3 w-3" />}
          label={isReorderMode ? "Done" : "Reorder"}
        />
        </div>

      <div className="flex items-center border rounded-md h-7">
      
        <Toggle
          pressed={viewMode === 'list'}
          onPressedChange={() => onViewModeChange('list')}
          className="rounded-none rounded-l-md h-7 w-7 p-0"
          aria-label="List view"
        >
          <LayoutList className="h-3 w-3" />
        </Toggle>
        <Toggle
          pressed={viewMode === 'card'}
          onPressedChange={() => onViewModeChange('card')}
          className="rounded-none rounded-r-md h-7 w-7 p-0"
          aria-label="Card view"
        >
          <LayoutGrid className="h-3 w-3" />
        </Toggle>
      </div>
    </div>
  )
}
