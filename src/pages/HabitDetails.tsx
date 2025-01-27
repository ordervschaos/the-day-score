import { useNavigate, useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { Save, Trash } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const HabitDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const [name, setName] = useState("")
  const [points, setPoints] = useState(0)
  
  const { data: habit, isLoading } = useQuery({
    queryKey: ['habits', Number(id)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', Number(id))
        .single()
      
      if (error) throw error
      return data
    }
  })

  // Update local state when habit data is loaded
  useEffect(() => {
    if (habit) {
      setName(habit.name)
      setPoints(habit.points)
    }
  }, [habit])

  const updateMutation = useMutation({
    mutationFn: async (values: { name: string; points: number }) => {
      const { error } = await supabase
        .from('habits')
        .update(values)
        .eq('id', Number(id))

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
      toast({
        title: "Success",
        description: "Habit updated successfully",
      })
    },
    onError: (error) => {
      console.error('Error updating habit:', error)
      toast({
        title: "Error",
        description: "Failed to update habit",
        variant: "destructive"
      })
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
      <main className="container max-w-2xl py-4">
        <Card>
          <CardHeader>
            <CardTitle>Habit Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="points">Points</Label>
            <Input
              id="points"
              type="number"
              value={points}
              onChange={(e) => setPoints(parseInt(e.target.value))}
            />
          </div>

          <div className="flex justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
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

            <Button
              onClick={() => updateMutation.mutate({ name, points })}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default HabitDetails
