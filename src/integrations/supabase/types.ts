export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_notes: {
        Row: {
          admin_id: string
          created_at: string | null
          id: string
          note: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          id?: string
          note: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          id?: string
          note?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_band: string | null
          author_name: string | null
          avatar_url: string | null
          created_at: string | null
          display_name: string
          id: string
          last_login: string | null
          suspended_at: string | null
        }
        Insert: {
          age_band?: string | null
          author_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          id: string
          last_login?: string | null
          suspended_at?: string | null
        }
        Update: {
          age_band?: string | null
          author_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          last_login?: string | null
          suspended_at?: string | null
        }
        Relationships: []
      }
      prompt_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          parameters: Json | null
          template_type: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parameters?: Json | null
          template_type: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parameters?: Json | null
          template_type?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          age_band: string | null
          art_style: string
          created_at: string | null
          created_by: string | null
          current_part: number | null
          genre: string
          hero_name: string
          id: string
          is_complete: boolean | null
          title: string
        }
        Insert: {
          age_band?: string | null
          art_style: string
          created_at?: string | null
          created_by?: string | null
          current_part?: number | null
          genre: string
          hero_name: string
          id?: string
          is_complete?: boolean | null
          title: string
        }
        Update: {
          age_band?: string | null
          art_style?: string
          created_at?: string | null
          created_by?: string | null
          current_part?: number | null
          genre?: string
          hero_name?: string
          id?: string
          is_complete?: boolean | null
          title?: string
        }
        Relationships: []
      }
      story_choices: {
        Row: {
          after_part: number
          choice_number: number
          choice_text: string
          created_at: string | null
          id: string
          story_id: string | null
          was_selected: boolean | null
        }
        Insert: {
          after_part: number
          choice_number: number
          choice_text: string
          created_at?: string | null
          id?: string
          story_id?: string | null
          was_selected?: boolean | null
        }
        Update: {
          after_part?: number
          choice_number?: number
          choice_text?: string
          created_at?: string | null
          id?: string
          story_id?: string | null
          was_selected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "story_choices_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_parts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          part_number: number
          story_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          part_number: number
          story_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          part_number?: number
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_parts_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_themes: {
        Row: {
          created_at: string | null
          description: string
          emoji: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description: string
          emoji?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string
          emoji?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      style_presets: {
        Row: {
          created_at: string
          enabled: boolean | null
          example: string | null
          id: string
          name: string
          prompt_template: string
          slug: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean | null
          example?: string | null
          id?: string
          name: string
          prompt_template: string
          slug: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean | null
          example?: string | null
          id?: string
          name?: string
          prompt_template?: string
          slug?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_image_usage: {
        Row: {
          created_at: string | null
          id: string
          images_generated: number | null
          images_limit: number | null
          month_year: string
          updated_at: string | null
          user_id: string
          warned_at: string | null
          warning_threshold: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          images_generated?: number | null
          images_limit?: number | null
          month_year: string
          updated_at?: string | null
          user_id: string
          warned_at?: string | null
          warning_threshold?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          images_generated?: number | null
          images_limit?: number | null
          month_year?: string
          updated_at?: string | null
          user_id?: string
          warned_at?: string | null
          warning_threshold?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_story_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_node_id: string
          id: string
          path_history: Json | null
          story_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_node_id: string
          id?: string
          path_history?: Json | null
          story_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_node_id?: string
          id?: string
          path_history?: Json | null
          story_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_image_usage: {
        Args: { p_user_id: string }
        Returns: {
          images_generated: number
          images_limit: number
          remaining: number
          should_warn: boolean
          warning_threshold: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_image_usage: {
        Args: { p_count?: number; p_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
