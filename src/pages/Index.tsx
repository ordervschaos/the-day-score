import { DayScore } from "@/components/DayScore"
import { HabitList } from "@/components/HabitList"
import { JournalEntry } from "@/components/JournalEntry"
import { UserMenu } from "@/components/UserMenu"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"

const Index = () => {
  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  const { data: journals } = useQuery({
    queryKey: ['journals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal')
        .select('*')
        .order('date', { ascending: false })
        .limit(5)
      
      if (error) throw error
      return data
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <UserMenu />
        </div>
      </header>
      <main className="container mx-auto py-6 space-y-6 max-w-3xl">
        <DayScore />
        <JournalEntry />
        <HabitList />
      </main>
    </div>
  )
}

export default Index