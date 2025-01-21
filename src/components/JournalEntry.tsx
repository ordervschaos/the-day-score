import { Pencil } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Textarea } from "./ui/textarea"

export const JournalEntry = () => {
  return (
    <Card className="bg-background border-none shadow-none">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">Day's Journal</CardTitle>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <Textarea 
          placeholder="Write about your day. Write about writing. Write about anything."
          className="min-h-[100px] resize-none"
        />
      </CardContent>
    </Card>
  )
}