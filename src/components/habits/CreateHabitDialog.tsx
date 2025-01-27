import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { useCreateHabit } from "@/hooks/habits/useHabitMutations"
import { useIsMobile } from "@/hooks/use-mobile"

interface CreateHabitDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateHabitDialog = ({ isOpen, onOpenChange }: CreateHabitDialogProps) => {
  const form = useForm({
    defaultValues: {
      name: "",
      points: 1
    }
  })
  const isMobile = useIsMobile()
  const createHabitMutation = useCreateHabit()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
           New Habit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => createHabitMutation.mutate(values))}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter habit name" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="points"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit">Create Habit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}