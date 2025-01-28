import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { TopNav } from "@/components/TopNav"
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
import { HabitEditForm } from "@/components/habits/HabitEditForm"
import { HabitLogForm } from "@/components/habits/HabitLogForm"
import { HabitAnalyticsChart } from "@/components/habits/HabitAnalyticsChart"

const HabitDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: habit, isLoading } = useQuery({
    queryKey: ['habits', Number(id)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select(`
          *,
          habit_logs (
            id,
            date,
            status
          )
        `)
        .eq('id', Number(id))
        .single()
      
      if (error) throw error
      return data
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('habits')
        .update({ is_archived: true })
        .eq('id', Number(id))

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast({
        title: "Success",
        description: "Habit archived successfully",
      })
      navigate('/')
    },
    onError: (error) => {
      console.error('Error archiving habit:', error)
      toast({
        title: "Error",
        description: "Failed to archive habit",
        variant: "destructive"
      })
    }
  })

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <HabitEditForm habit={habit} />
            <HabitAnalyticsChart habitId={Number(id)} />
          </div>
          
          <div className="space-y-4">
            <HabitLogForm habit={habit} />
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash className="mr-2 h-4 w-4" />
                  Archive Habit
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will archive the habit. You can restore it later from the archived habits section.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                    Archive
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HabitDetails