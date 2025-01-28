import { useState, useEffect } from "react"
import { Pencil, Check, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addJournalEntry, fetchJournalEntries } from "@/lib/api"
import { format } from "date-fns"
import { useToast } from "./ui/use-toast"

interface JournalEntryProps {
  selectedDate: Date;
}

export const JournalEntry = ({ selectedDate }: JournalEntryProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Format date consistently for API calls
  const formattedDate = format(selectedDate, 'yyyy-MM-dd')

  // Fetch journal entry for selected date
  const { data: entries } = useQuery({
    queryKey: ['journal', formattedDate],
    queryFn: async () => {
      const entries = await fetchJournalEntries(1)
      return entries?.find(entry => entry.date === formattedDate) || null
    }
  })

  const [content, setContent] = useState("")

  // Update content when entries changes
  useEffect(() => {
    if (entries?.content) {
      setContent(entries.content)
    } else {
      setContent("")
    }
  }, [entries?.content])

  // Save journal entry mutation
  const { mutate: saveEntry } = useMutation({
    mutationFn: async () => {
      return await addJournalEntry({
        content: content.trim(),
        date: formattedDate
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] })
      setIsEditing(false)
      toast({
        title: "Journal saved",
        description: "Your journal entry has been saved successfully."
      })
    },
    onError: (error) => {
      console.error('Error saving journal entry:', error)
      toast({
        title: "Error",
        description: "Failed to save your journal entry. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleSave = () => {
    saveEntry()
  }

  const handleClear = () => {
    setContent("")
    saveEntry()
  }

  return (
    <Card className="bg-background border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Day's Journal</CardTitle>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleClear}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleSave}
              >
                <Check className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Textarea 
          placeholder="Write about your day. Write about writing. Write about anything."
          className="min-h-[100px] resize-none"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          readOnly={!isEditing}
        />
      </CardContent>
    </Card>
  )
}