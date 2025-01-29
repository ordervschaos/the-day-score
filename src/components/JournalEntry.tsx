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
  const isTyping = useRef(false) // Track if the user is actively typing

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

  // Prevent overwriting input while user is typing
  useEffect(() => {
    if (!isTyping.current && entries?.content !== undefined && entries.content !== content) {
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
          onChange={(e) => {
            isTyping.current = true // Mark as typing
            setContent(e.target.value)
          }}
          onBlur={() => {
            isTyping.current = false // Reset when user stops typing
          }}
        />
      </CardContent>
    </Card>
  )
}
