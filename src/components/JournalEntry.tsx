import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Textarea } from "./ui/textarea"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { addJournalEntry, fetchJournalEntries } from "@/lib/api"
import { format } from "date-fns"
import { useToast } from "./ui/use-toast"
import { useDebounce } from "@/hooks/use-debounce"

interface JournalEntryProps {
  selectedDate: Date;
}

export const JournalEntry = ({ selectedDate }: JournalEntryProps) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Format date consistently for API calls
  const formattedDate = format(selectedDate, 'yyyy-MM-dd')
  console.log("Formatted date for DB:", formattedDate)

  // Fetch journal entry for selected date
  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal', formattedDate],
    queryFn: async () => {
      const entries = await fetchJournalEntries(formattedDate)
      console.log("Fetched entries for date:", entries)
      return entries?.[0] || null
    },
    staleTime: 0, // Always refetch when date changes
  })

  const [content, setContent] = useState("")
  const debouncedContent = useDebounce(content, 300) // Reduced debounce to 300ms

  // Update content when entries changes or date changes
  useEffect(() => {
    if (entries?.content !== undefined) {
      setContent(entries.content)
    } else {
      setContent("")
    }
  }, [entries?.content, formattedDate])

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

  // Auto-save effect
  useEffect(() => {
    if (debouncedContent !== entries?.content) {
      saveEntry()
    }
  }, [debouncedContent])

  if (isLoading) {
    return (
      <Card className="bg-background border-none shadow-none">
        <CardHeader>
          <CardTitle className="text-xl">Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse bg-muted rounded-md" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-background border-none shadow-none">
      <CardHeader>
        <CardTitle className="text-xl">Journal</CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea 
          placeholder="Write about your day..."
          className="min-h-[200px] resize-none text-base leading-relaxed focus-visible:ring-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </CardContent>
    </Card>
  )
}