import { supabase } from "@/integrations/supabase/client"
import { Database } from "@/integrations/supabase/types"

type Habit = Database["public"]["Tables"]["habits"]["Row"]
type HabitLog = Database["public"]["Tables"]["habit_logs"]["Row"]
type HabitGroup = Database["public"]["Tables"]["habit_groups"]["Row"]
type HabitListItem = Database["public"]["Tables"]["habit_list_items"]["Row"]
type Journal = Database["public"]["Tables"]["journal"]["Row"]
type Notebook = Database["public"]["Tables"]["notebooks"]["Row"]
type Page = Database["public"]["Tables"]["pages"]["Row"]

// Habit Management
export const fetchHabits = async () => {
  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: false })
  
  if (error) throw error
  return data
}

export const addHabit = async (habit: Pick<Habit, "name" | "points">) => {
  const { data, error } = await supabase
    .from("habits")
    .insert([habit])
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
  const { data, error } = await supabase
    .from("journal")
    .insert([entry])
    .select()
    .single()

  if (error) throw error
  return data
}

// Habit Groups
export const createHabitGroup = async (title: string) => {
  const { data: group, error: groupError } = await supabase
    .from("habit_groups")
    .insert([{ title }])
    .select()
    .single()

  if (groupError) throw groupError

  const { data: listItem, error: listItemError } = await supabase
    .from("habit_list_items")
    .insert([{
      type: "group",
      group_id: group.id,
      position: 999999
    }])
    .select()
    .single()

  if (listItemError) throw listItemError

  return {
    ...listItem,
    title: group.title
  }
}

export const deleteHabitGroup = async (groupId: number, listItemId: number) => {
  const { error: listItemError } = await supabase
    .from("habit_list_items")
    .delete()
    .eq("id", listItemId)

  if (listItemError) throw listItemError

  const { error: groupError } = await supabase
    .from("habit_groups")
    .delete()
    .eq("id", groupId)

  if (groupError) throw groupError

  return { groupId, listItemId }
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