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

export const HabitListHeader = ({
  isReorderMode,
  onReorderModeChange,
  viewMode,
  onViewModeChange
}: HabitListHeaderProps) => {
  const [isNewHabitOpen, setIsNewHabitOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const isMobile = useIsMobile()

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
      <Button
        variant="outline"
        onClick={() => onReorderModeChange(!isReorderMode)}
        className="flex items-center gap-2"
      >
        {isMobile ? (
          <>
            <GripHorizontal className="h-4 w-4" />
            {!isReorderMode && <span className="sr-only">Reorder</span>}
            {isReorderMode && <span className="sr-only">Done</span>}
          </>
        ) : (
          isReorderMode ? "Done Reordering" : "Reorder"
        )}
      </Button>
      <Button
        variant="outline"
        onClick={() => setIsNewHabitOpen(true)}
        className="flex items-center gap-2"
      >
        {isMobile ? (
          <>
            <Plus className="h-4 w-4" />
            <span className="sr-only">New Habit</span>
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            <span>New Habit</span>
          </>
        )}
      </Button>
      <Button
        variant="outline"
        onClick={() => setIsNewFolderOpen(true)}
        className="flex items-center gap-2"
      >
        {isMobile ? (
          <>
            <FolderPlus className="h-4 w-4" />
            <span className="sr-only">New Folder</span>
          </>
        ) : (
          <>
            <FolderPlus className="h-4 w-4" />
            <span>New Folder</span>
          </>
        )}
      </Button>
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