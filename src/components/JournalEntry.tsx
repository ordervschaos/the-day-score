import { useState, useEffect } from "react"
import { Pencil, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addJournalEntry, fetchJournalEntries } from "@/lib/api"
import { format } from "date-fns"
import { useToast } from "./ui/use-toast"

export const JournalEntry = () => {
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const today = format(new Date(), "yyyy-MM-dd")

  // Fetch today's journal entry
  const { data: entries } = useQuery({
    queryKey: ['journal', today],
    queryFn: async () => {
      const entries = await fetchJournalEntries(1)
      return entries?.find(entry => entry.date === today) || null
    }
  })

  const [content, setContent] = useState(entries?.content || "")

  // Update content when entries changes
  useEffect(() => {
    if (entries?.content) {
      setContent(entries.content)
    }
  }, [entries?.content])

  // Save journal entry mutation
  const { mutate: saveEntry } = useMutation({
    mutationFn: async () => {
      return await addJournalEntry({
        content,
        date: today
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
      console.error("Error saving journal entry:", error)
      toast({
        title: "Error",
        description: "Failed to save your journal entry. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleSave = () => {
    if (content.trim()) {
      saveEntry()
    }
  }

  return (
    <Card className="bg-background border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Day's Journal</CardTitle>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => {
            if (isEditing) {
              handleSave()
            } else {
              setIsEditing(true)
            }
          }}
        >
          {isEditing ? (
            <Check className="h-4 w-4" />
          ) : (
            <Pencil className="h-4 w-4" />
          )}
        </Button>
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