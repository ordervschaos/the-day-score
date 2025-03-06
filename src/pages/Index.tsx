
import { DayScore } from "@/components/DayScore"
import { HabitList } from "@/components/HabitList"
import { JournalEntry } from "@/components/JournalEntry"
import { TopNav } from "@/components/TopNav"
import { FixedNavbar } from "@/components/FixedNavbar"
import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const Index = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

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
    <div className="min-h-screen bg-background w-screen overflow-x-hidden">
      <TopNav />
      <FixedNavbar selectedDate={selectedDate} onDateChange={setSelectedDate} />
      <main className="w-full mx-auto py-1 space-y-2 px-1 mt-10">
        <HabitList selectedDate={selectedDate} />
      </main>
    </div>
  )
}

export default Index
