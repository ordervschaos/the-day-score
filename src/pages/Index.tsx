import { DayScore } from "@/components/DayScore"
import { HabitList } from "@/components/HabitList"
import { JournalEntry } from "@/components/JournalEntry"

const Index = () => {
  return (
    <div className="container mx-auto py-6 space-y-6 max-w-3xl">
      <DayScore />
      <JournalEntry />
      <HabitList />
    </div>
  )
}

export default Index