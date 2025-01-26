import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { FolderPlus } from "lucide-react"
import { useForm } from "react-hook-form"
import { useCreateFolder } from "@/hooks/habits/useHabitMutations"

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

  const createFolderMutation = useCreateFolder()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
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
              <Button type="submit">Create Folder</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}