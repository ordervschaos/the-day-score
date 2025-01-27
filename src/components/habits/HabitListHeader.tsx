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
      onClick={onClick}
      className="flex items-center gap-2"
    >
      {icon}
      {isMobile ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span>{label}</span>
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
    <div className="flex gap-2 mb-4">
      <CreateHabitDialog 
        isOpen={isNewHabitOpen}
        onOpenChange={setIsNewHabitOpen}
      />
      <CreateFolderDialog
        isOpen={isNewFolderOpen}
        onOpenChange={setIsNewFolderOpen}
      />
      
      <ActionButton
        onClick={() => onReorderModeChange(!isReorderMode)}
        icon={<GripHorizontal className="h-4 w-4" />}
        label={isReorderMode ? "Done Reordering" : "Reorder"}
      />
      
      <ActionButton
        onClick={() => setIsNewHabitOpen(true)}
        icon={<Plus className="h-4 w-4" />}
        label="New Habit"
      />
      
      <ActionButton
        onClick={() => setIsNewFolderOpen(true)}
        icon={<FolderPlus className="h-4 w-4" />}
        label="New Folder"
      />

      <div className="flex-1" />
      <div className="flex items-center border rounded-md">
        <Toggle
          pressed={viewMode === 'list'}
          onPressedChange={() => onViewModeChange('list')}
          className="rounded-none rounded-l-md"
          aria-label="List view"
        >
          <LayoutList className="h-4 w-4" />
        </Toggle>
        <Toggle
          pressed={viewMode === 'card'}
          onPressedChange={() => onViewModeChange('card')}
          className="rounded-none rounded-r-md"
          aria-label="Card view"
        >
          <LayoutGrid className="h-4 w-4" />
        </Toggle>
      </div>
    </div>
  )
}