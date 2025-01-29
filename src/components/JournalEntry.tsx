import { useState, useEffect, useRef } from "react"
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
  const firstRender = useRef(true) // Track first render

  // Format date consistently for API calls
  const formattedDate = format(selectedDate, 'yyyy-MM-dd')

  // Fetch journal entry for selected date
  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal', formattedDate],
    queryFn: async () => {
      const fetchedEntries = await fetchJournalEntries(formattedDate)
      return fetchedEntries?.[0] || null
    },
    staleTime: 0,
  })

  const [content, setContent] = useState("")
  const debouncedContent = useDebounce(content, 300)

  // Update content when fetched entries change
  useEffect(() => {
    if (entries?.content !== undefined && entries.content !== content) {
      setContent(entries.content)
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
      queryClient.invalidateQueries({ queryKey: ['journal', formattedDate] }) // Scope invalidation to specific date
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your journal entry. Please try again.",
        variant: "destructive"
      })
    }
  })

  // Auto-save effect
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false // Skip first render
      return
    }
    
    if (debouncedContent.trim() && debouncedContent !== entries?.content) {
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
