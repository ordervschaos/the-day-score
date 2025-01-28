import { supabase } from "@/integrations/supabase/client"
import { Database } from "@/integrations/supabase/types"

type Habit = Database["public"]["Tables"]["habits"]["Row"]
type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"]
type HabitGroup = Database["public"]["Tables"]["habit_groups"]["Row"]
type Journal = Database["public"]["Tables"]["journal"]["Row"]
type Notebook = Database["public"]["Tables"]["notebooks"]["Row"]
type Page = Database["public"]["Tables"]["pages"]["Row"]

// Habit Management
export const fetchHabits = async () => {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("position", { ascending: true })
  
  if (error) throw error
  return data
}

export const addHabit = async (habit: Pick<Habit, "name" | "points">) => {
  // Get the current max position
  const { data: habits } = await supabase
    .from("habits")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)

  const nextPosition = habits && habits.length > 0 ? (habits[0].position || 0) + 1 : 0

  const { data, error } = await supabase
    .from("habits")
    .insert([{ ...habit, position: nextPosition }])
    .select()
    .single()

  if (error) throw error
  return data
}

export const editHabit = async (habit: Partial<Habit> & { id: number }) => {
  const { id, ...updates } = habit
  const { data, error } = await supabase
    .from("habits")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteHabit = async (id: number) => {
  const { error } = await supabase
    .from("habits")
    .update({ is_archived: true })
    .eq("id", id)

  if (error) throw error
  return id
}

// Habit Logs
export const fetchHabitLogs = async () => {
  const { data, error } = await supabase
    .from("habit_logs")
    .select("*")
    .order("date", { ascending: false })

  if (error) throw error
  return data
}

export const addHabitLog = async (log: Omit<HabitLog, "id" | "created_at" | "updated_at" | "owner_id">) => {
  const { data, error } = await supabase
    .from("habit_logs")
    .insert([log])
    .select()
    .single()

  if (error) throw error
  return data
}

export const toggleHabitLogStatus = async (id: string) => {
  const { data: current } = await supabase
    .from("habit_logs")
    .select("status")
    .eq("id", id)
    .single()

  if (!current) throw new Error("Habit log not found")

  const newStatus = current.status === "todo" ? "completed" : "todo"
  
  const { data, error } = await supabase
    .from("habit_logs")
    .update({ status: newStatus })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Journal Entries
export const fetchJournalEntries = async (limit?: number) => {
  let query = supabase
    .from("journal")
    .select("*")
    .order("date", { ascending: false })

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const addJournalEntry = async (entry: Pick<Journal, "content" | "date">) => {
  // First try to get existing entry
  const { data: existingEntry } = await supabase
    .from("journal")
    .select()
    .eq("date", entry.date)
    .eq("user_id", (await supabase.auth.getUser()).data.user?.id)
    .single()

  if (existingEntry) {
    // Update existing entry
    const { data, error } = await supabase
      .from("journal")
      .update({ content: entry.content })
      .eq("id", existingEntry.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Insert new entry
    const { data, error } = await supabase
      .from("journal")
      .insert([entry])
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// Habit Groups
export const createHabitGroup = async (title: string) => {
  // Get the current max position
  const { data: groups } = await supabase
    .from("habit_groups")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)

  const nextPosition = groups && groups.length > 0 ? (groups[0].position || 0) + 1 : 0

  const { data: group, error } = await supabase
    .from("habit_groups")
    .insert([{ 
      title,
      position: nextPosition
    }])
    .select()
    .single()

  if (error) throw error
  return group
}

export const deleteHabitGroup = async (groupId: number) => {
  // First update all habits in this group to have no group
  const { error: updateError } = await supabase
    .from("habits")
    .update({ group_id: null })
    .eq("group_id", groupId)

  if (updateError) throw updateError

  // Then delete the group
  const { error: deleteError } = await supabase
    .from("habit_groups")
    .delete()
    .eq("id", groupId)

  if (deleteError) throw deleteError

  return groupId
}

// Notebooks and Pages
export const fetchNotebooks = async () => {
  const { data, error } = await supabase
    .from("notebooks")
    .select("*, pages(*)")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export const addNotebook = async (notebook: Pick<Notebook, "name" | "habit_id">) => {
  const { data, error } = await supabase
    .from("notebooks")
    .insert([notebook])
    .select()
    .single()

  if (error) throw error
  return data
}

export const addPage = async (page: Pick<Page, "content" | "notebook_id">) => {
  const { data, error } = await supabase
    .from("pages")
    .insert([page])
    .select()
    .single()

  if (error) throw error
  return data
}
