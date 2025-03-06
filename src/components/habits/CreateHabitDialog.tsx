
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus, Sparkles } from "lucide-react"
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
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:from-blue-500/20 hover:to-purple-500/20 border-primary/10 hover:border-primary/30 transition-all duration-300"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <Plus className="h-3.5 w-3.5 text-primary" />
            {!isMobile && <span>New Habit</span>}
            {isMobile && <span className="sr-only">New Habit</span>}
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Create New Habit
          </DialogTitle>
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
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white transition-all duration-300"
              >
                Create Habit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
