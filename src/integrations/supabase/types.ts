export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      experience_logs: {
        Row: {
          created_at: string
          date: string | null
          experience_id: number | null
          id: number
          notes: string | null
          owner_id: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          experience_id?: number | null
          id?: number
          notes?: string | null
          owner_id?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string
          date?: string | null
          experience_id?: number | null
          id?: number
          notes?: string | null
          owner_id?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_logs_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_archived: boolean | null
          name: string | null
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_archived?: boolean | null
          name?: string | null
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_archived?: boolean | null
          name?: string | null
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      habit_groups: {
        Row: {
          created_at: string | null
          id: number
          is_collapsed: boolean | null
          position: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_collapsed?: boolean | null
          position?: number | null
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_collapsed?: boolean | null
          position?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          count: number
          created_at: string | null
          date: string | null
          details: Json | null
          habit_id: number | null
          id: string
          name: string
          owner_id: string | null
          points: number
          status: string | null
          temp_habit_id: number | null
          time: string | null
          updated_at: string | null
        }
        Insert: {
          count?: number
          created_at?: string | null
          date?: string | null
          details?: Json | null
          habit_id?: number | null
          id?: string
          name: string
          owner_id?: string | null
          points: number
          status?: string | null
          temp_habit_id?: number | null
          time?: string | null
          updated_at?: string | null
        }
        Update: {
          count?: number
          created_at?: string | null
          date?: string | null
          details?: Json | null
          habit_id?: number | null
          id?: string
          name?: string
          owner_id?: string | null
          points?: number
          status?: string | null
          temp_habit_id?: number | null
          time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          aging_settings: Json | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          group_id: number | null
          id: number
          is_archived: boolean | null
          multiple_per_day: boolean | null
          name: string
          notebooks: number[] | null
          owner_id: string
          planned_times: Json | null
          points: number
          position: number | null
          tags: string[] | null
          temp_id: number | null
          updated_at: string | null
        }
        Insert: {
          aging_settings?: Json | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          group_id?: number | null
          id?: never
          is_archived?: boolean | null
          multiple_per_day?: boolean | null
          name: string
          notebooks?: number[] | null
          owner_id?: string
          planned_times?: Json | null
          points: number
          position?: number | null
          tags?: string[] | null
          temp_id?: number | null
          updated_at?: string | null
        }
        Update: {
          aging_settings?: Json | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          group_id?: number | null
          id?: never
          is_archived?: boolean | null
          multiple_per_day?: boolean | null
          name?: string
          notebooks?: number[] | null
          owner_id?: string
          planned_times?: Json | null
          points?: number
          position?: number | null
          tags?: string[] | null
          temp_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "habit_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      journal: {
        Row: {
          content: string | null
          date: string
          id: number
          user_id: string
        }
        Insert: {
          content?: string | null
          date: string
          id?: number
          user_id?: string
        }
        Update: {
          content?: string | null
          date?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      notebooks: {
        Row: {
          habit_id: number | null
          id: number
          name: string
          user_id: string
        }
        Insert: {
          habit_id?: number | null
          id?: number
          name: string
          user_id?: string
        }
        Update: {
          habit_id?: number | null
          id?: number
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notebooks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string
          id: number
          notebook_id: number | null
          user_id: string
        }
        Insert: {
          content: string
          id?: number
          notebook_id?: number | null
          user_id?: string
        }
        Update: {
          content?: string
          id?: number
          notebook_id?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data: {
        Row: {
          created_at: string | null
          default_notebook: number | null
          email: string | null
          onboarding_data: Json | null
          one_time_events: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string | null
          default_notebook?: number | null
          email?: string | null
          onboarding_data?: Json | null
          one_time_events?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Update: {
          created_at?: string | null
          default_notebook?: number | null
          email?: string | null
          onboarding_data?: Json | null
          one_time_events?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_habit_points_daily: {
        Args: {
          p_owner_id: string
          p_start_date: string
          p_end_date: string
          p_habit_id?: number
        }
        Returns: {
          date: string
          points: number
        }[]
      }
      get_habit_points_monthly: {
        Args: {
          p_owner_id: string
          p_start_date: string
          p_end_date: string
          p_habit_id?: number
        }
        Returns: {
          month_start: string
          points: number
        }[]
      }
      get_habit_points_weekly: {
        Args: {
          p_owner_id: string
          p_start_date: string
          p_end_date: string
          p_habit_id?: number
        }
        Returns: {
          week_start: string
          points: number
        }[]
      }
      update_notebook_name: {
        Args: {
          notebook_id: number
          new_name: string
        }
        Returns: undefined
      }
    }
    Enums: {
      habit_list_item_type: "group" | "habit"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
