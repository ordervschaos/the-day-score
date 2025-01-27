import { ChevronDown, ChevronRight, GripVertical, Trash } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useQueryClient } from "@tanstack/react-query"

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
  id,
  title, 
  isCollapsed, 
  onToggleCollapse, 
  children,
  dragHandleProps,
  showDragHandle
}: GroupProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    try {
      console.log('Deleting group:', id)
      
      // First update all habits in this group to have no group
      const { error: updateError } = await supabase
        .from('habits')
        .update({ group_id: null })
        .eq('group_id', id)

      if (updateError) throw updateError

      // Then delete the group
      const { error: deleteError } = await supabase
        .from('habit_groups')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      queryClient.invalidateQueries({ queryKey: ['habit-groups'] })

      toast({
        title: "Success",
        description: "Group deleted successfully",
      })
    } catch (error) {
      console.error('Error deleting group:', error)
      toast({
        title: "Error",
        description: "Failed to delete group. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Don't show delete button for the "Ungrouped" section
  const showDeleteButton = id !== -1

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
        {showDeleteButton && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete group?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the group "{title}". The habits in this group will be moved to "Ungrouped".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {!isCollapsed && (
        <div className="pl-2 md:pl-6">
          {children}
        </div>
      )}
    </div>
  )
}