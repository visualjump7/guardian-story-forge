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
          author_name: string | null
          avatar_url: string | null
          created_at: string | null
          display_name: string
          id: string
          last_login: string | null
          suspended_at: string | null
        }
        Insert: {
          author_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name: string
          id: string
          last_login?: string | null
          suspended_at?: string | null
        }
        Update: {
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
          age_range: string | null
          art_style: string | null
          audio_url: string | null
          content: string
          content_type: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          excerpt: string | null
          hero_name: string | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          media_url: string | null
          narrative_structure: string | null
          narrative_type: string | null
          secondary_theme_id: string | null
          setting: string | null
          story_length: string | null
          story_type: string | null
          story_universe: string | null
          theme_id: string | null
          title: string
        }
        Insert: {
          age_range?: string | null
          art_style?: string | null
          audio_url?: string | null
          content: string
          content_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          hero_name?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_url?: string | null
          narrative_structure?: string | null
          narrative_type?: string | null
          secondary_theme_id?: string | null
          setting?: string | null
          story_length?: string | null
          story_type?: string | null
          story_universe?: string | null
          theme_id?: string | null
          title: string
        }
        Update: {
          age_range?: string | null
          art_style?: string | null
          audio_url?: string | null
          content?: string
          content_type?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          excerpt?: string | null
          hero_name?: string | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          media_url?: string | null
          narrative_structure?: string | null
          narrative_type?: string | null
          secondary_theme_id?: string | null
          setting?: string | null
          story_length?: string | null
          story_type?: string | null
          story_universe?: string | null
          theme_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_secondary_theme_id_fkey"
            columns: ["secondary_theme_id"]
            isOneToOne: false
            referencedRelation: "story_themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "story_themes"
            referencedColumns: ["id"]
          },
        ]
      }
      story_choices: {
        Row: {
          choice_order: number | null
          choice_text: string
          created_at: string | null
          from_node_id: string
          id: string
          to_node_id: string
        }
        Insert: {
          choice_order?: number | null
          choice_text: string
          created_at?: string | null
          from_node_id: string
          id?: string
          to_node_id: string
        }
        Update: {
          choice_order?: number | null
          choice_text?: string
          created_at?: string | null
          from_node_id?: string
          id?: string
          to_node_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_choices_from_node_id_fkey"
            columns: ["from_node_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_choices_to_node_id_fkey"
            columns: ["to_node_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      story_images: {
        Row: {
          created_at: string | null
          id: string
          image_type: string | null
          image_url: string
          is_selected: boolean | null
          story_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_type?: string | null
          image_url: string
          is_selected?: boolean | null
          story_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_type?: string | null
          image_url?: string
          is_selected?: boolean | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_images_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_nodes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_ending_node: boolean | null
          is_start_node: boolean | null
          node_key: string
          story_id: string
          title: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_ending_node?: boolean | null
          is_start_node?: boolean | null
          node_key: string
          story_id: string
          title?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_ending_node?: boolean | null
          is_start_node?: boolean | null
          node_key?: string
          story_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_nodes_story_id_fkey"
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
      user_libraries: {
        Row: {
          id: string
          saved_at: string | null
          story_id: string
          user_id: string
        }
        Insert: {
          id?: string
          saved_at?: string | null
          story_id: string
          user_id: string
        }
        Update: {
          id?: string
          saved_at?: string | null
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_libraries_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_story_progress_current_node_id_fkey"
            columns: ["current_node_id"]
            isOneToOne: false
            referencedRelation: "story_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_story_progress_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
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
