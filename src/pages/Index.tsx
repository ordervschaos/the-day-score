import { DayScore } from "@/components/DayScore"
import { HabitList } from "@/components/HabitList"
import { JournalEntry } from "@/components/JournalEntry"
import { TopNav } from "@/components/TopNav"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const Index = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate("/auth")
      } else {
        setUser(session.user)
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth")
      } else {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  const { data: habits } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('is_archived', false)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="container mx-auto py-2 space-y-4 max-w-3xl px-1 sm:px-4 sm:py-6 sm:space-y-6">
        <DayScore />
        <JournalEntry />
        <HabitList />
      </main>
    </div>
  )
}

export default Index