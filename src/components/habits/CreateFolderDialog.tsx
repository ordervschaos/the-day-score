
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FolderPlus, Sparkles } from "lucide-react"
import { useForm } from "react-hook-form"
import { useCreateFolder } from "@/hooks/habits/useHabitMutations"
import { useIsMobile } from "@/hooks/use-mobile"

interface CreateFolderDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateFolderDialog = ({ isOpen, onOpenChange }: CreateFolderDialogProps) => {
  const form = useForm({
    defaultValues: {
      title: ""
    }
  })
  const isMobile = useIsMobile()
  const createFolderMutation = useCreateFolder()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button 
          variant="outline"
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-500/10 hover:border-amber-500/30 transition-all duration-300"
        >
          <div className="flex items-center gap-1.5">
            <FolderPlus className="h-3.5 w-3.5 text-amber-600" />
            {!isMobile && "New Folder"}
            {isMobile && <span className="sr-only">New Folder</span>}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Create New Folder
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => createFolderMutation.mutate(values))}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter folder name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300"
              >
                Create Folder
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
