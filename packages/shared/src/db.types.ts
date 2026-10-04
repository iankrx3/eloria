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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      consents: {
        Row: {
          created_at: string
          granted: boolean
          granted_at: string
          id: string
          kind: string
          user_id: string
          version: string
        }
        Insert: {
          created_at?: string
          granted: boolean
          granted_at?: string
          id?: string
          kind: string
          user_id: string
          version: string
        }
        Update: {
          created_at?: string
          granted?: boolean
          granted_at?: string
          id?: string
          kind?: string
          user_id?: string
          version?: string
        }
        Relationships: []
      }
      desires: {
        Row: {
          achieved_at: string | null
          category: string
          created_at: string
          id: string
          status: string
          text: string
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          category?: string
          created_at?: string
          id?: string
          status?: string
          text: string
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          category?: string
          created_at?: string
          id?: string
          status?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          est_cost_usd: number | null
          finished_at: string | null
          id: string
          image_count: number | null
          input_tokens: number | null
          kind: string
          model: string | null
          output_tokens: number | null
          provider: string | null
          started_at: string | null
          status: string
          step: string
          story_id: string | null
          tts_chars: number | null
          user_id: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          est_cost_usd?: number | null
          finished_at?: string | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          kind: string
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          started_at?: string | null
          status?: string
          step: string
          story_id?: string | null
          tts_chars?: number | null
          user_id?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          est_cost_usd?: number | null
          finished_at?: string | null
          id?: string
          image_count?: number | null
          input_tokens?: number | null
          kind?: string
          model?: string | null
          output_tokens?: number | null
          provider?: string | null
          started_at?: string | null
          status?: string
          step?: string
          story_id?: string | null
          tts_chars?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      library_items: {
        Row: {
          category: string
          created_at: string
          id: string
          is_free: boolean
          seed_key: string
          sort: number
          story_id: string
          theme: string
          tone: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_free?: boolean
          seed_key: string
          sort?: number
          story_id: string
          theme: string
          tone: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_free?: boolean
          seed_key?: string
          sort?: number
          story_id?: string
          theme?: string
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_items_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: true
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          created_at: string
          id: string
          name: string
          pronunciation: string | null
          relation: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pronunciation?: string | null
          relation: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pronunciation?: string | null
          relation?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dislikes: string[]
          display_name: string | null
          id: string
          last_active_at: string
          likes: string[]
          listen_time: string | null
          name_pronunciation: string | null
          notify_at: string | null
          onboarding_completed_at: string | null
          preferred_soundscape_id: string | null
          preferred_voice_id: string | null
          relationship_status: string | null
          timezone: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dislikes?: string[]
          display_name?: string | null
          id: string
          last_active_at?: string
          likes?: string[]
          listen_time?: string | null
          name_pronunciation?: string | null
          notify_at?: string | null
          onboarding_completed_at?: string | null
          preferred_soundscape_id?: string | null
          preferred_voice_id?: string | null
          relationship_status?: string | null
          timezone?: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dislikes?: string[]
          display_name?: string | null
          id?: string
          last_active_at?: string
          likes?: string[]
          listen_time?: string | null
          name_pronunciation?: string | null
          notify_at?: string | null
          onboarding_completed_at?: string | null
          preferred_soundscape_id?: string | null
          preferred_voice_id?: string | null
          relationship_status?: string | null
          timezone?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_soundscape_id_fkey"
            columns: ["preferred_soundscape_id"]
            isOneToOne: false
            referencedRelation: "soundscapes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_preferred_voice_id_fkey"
            columns: ["preferred_voice_id"]
            isOneToOne: false
            referencedRelation: "voices"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answer: Json
          created_at: string
          id: string
          question_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: string
          question_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: string
          question_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      soundscapes: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          key: string
          loop_duration_sec: number | null
          storage_path: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          key: string
          loop_duration_sec?: number | null
          storage_path: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          key?: string
          loop_duration_sec?: number | null
          storage_path?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          created_at: string
          desire_id: string | null
          error_code: string | null
          id: string
          kind: string
          parent_story_id: string | null
          prompt_version: string | null
          revision_request: string | null
          scene_plan: Json | null
          script: string | null
          script_chars: number | null
          status: string
          title: string | null
          updated_at: string
          user_id: string | null
          version: number
          voice_id: string | null
        }
        Insert: {
          created_at?: string
          desire_id?: string | null
          error_code?: string | null
          id?: string
          kind: string
          parent_story_id?: string | null
          prompt_version?: string | null
          revision_request?: string | null
          scene_plan?: Json | null
          script?: string | null
          script_chars?: number | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
          voice_id?: string | null
        }
        Update: {
          created_at?: string
          desire_id?: string | null
          error_code?: string | null
          id?: string
          kind?: string
          parent_story_id?: string | null
          prompt_version?: string | null
          revision_request?: string | null
          scene_plan?: Json | null
          script?: string | null
          script_chars?: number | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
          version?: number
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_desire_id_fkey"
            columns: ["desire_id"]
            isOneToOne: false
            referencedRelation: "desires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_parent_story_id_fkey"
            columns: ["parent_story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_voice_id_fkey"
            columns: ["voice_id"]
            isOneToOne: false
            referencedRelation: "voices"
            referencedColumns: ["id"]
          },
        ]
      }
      story_assets: {
        Row: {
          bytes: number | null
          content_hash: string | null
          created_at: string
          duration_sec: number | null
          id: string
          mime: string
          model: string | null
          provider: string | null
          storage_path: string
          story_id: string
          type: string
        }
        Insert: {
          bytes?: number | null
          content_hash?: string | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          mime: string
          model?: string | null
          provider?: string | null
          storage_path: string
          story_id: string
          type: string
        }
        Update: {
          bytes?: number | null
          content_hash?: string | null
          created_at?: string
          duration_sec?: number | null
          id?: string
          mime?: string
          model?: string | null
          provider?: string | null
          storage_path?: string
          story_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_assets_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      voices: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          key: string
          language: string
          model: string
          owner_user_id: string | null
          preview_path: string | null
          provider_voice_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          key: string
          language?: string
          model: string
          owner_user_id?: string | null
          preview_path?: string | null
          provider_voice_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          key?: string
          language?: string
          model?: string
          owner_user_id?: string | null
          preview_path?: string | null
          provider_voice_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      generation_quota: {
        Row: {
          daily_used: number | null
          month: string | null
          revisions_used: number | null
          stories_used: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
