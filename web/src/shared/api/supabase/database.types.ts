export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ministry_days: {
        Row: {
          created_at: string
          day: string
          deleted_at: string | null
          minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          deleted_at?: string | null
          minutes: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          deleted_at?: string | null
          minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ministry_month_closures: {
        Row: {
          closed_at: string
          created_at: string
          deleted_at: string | null
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          closed_at?: string
          created_at?: string
          deleted_at?: string | null
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          closed_at?: string
          created_at?: string
          deleted_at?: string | null
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ministry_status_months: {
        Row: {
          created_at: string
          deleted_at: string | null
          duration: string
          month: string
          monthly_goal_hours: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          duration: string
          month: string
          monthly_goal_hours?: number | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          duration?: string
          month?: string
          monthly_goal_hours?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          time_zone: string
          updated_at: string
          whats_new_seen: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id: string
          time_zone?: string
          updated_at?: string
          whats_new_seen?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          time_zone?: string
          updated_at?: string
          whats_new_seen?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          deleted_at: string | null
          endpoint: string
          id: number
          p256dh: string
          updated_at: string
          user_id: string | null
          waitlist_signup_id: number | null
        }
        Insert: {
          auth: string
          created_at?: string
          deleted_at?: string | null
          endpoint: string
          id?: never
          p256dh: string
          updated_at?: string
          user_id?: string | null
          waitlist_signup_id?: number | null
        }
        Update: {
          auth?: string
          created_at?: string
          deleted_at?: string | null
          endpoint?: string
          id?: never
          p256dh?: string
          updated_at?: string
          user_id?: string | null
          waitlist_signup_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_waitlist_signup_id_fkey"
            columns: ["waitlist_signup_id"]
            isOneToOne: false
            referencedRelation: "waitlist_signups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          deleted_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          deleted_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          deleted_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: number
          push_enrollment_token: string | null
          push_enrollment_token_created_at: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email: string
          id?: never
          push_enrollment_token?: string | null
          push_enrollment_token_created_at?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: never
          push_enrollment_token?: string | null
          push_enrollment_token_created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      amend_ministry_status_month: {
        Args: { p_month: string; p_monthly_goal?: number; p_status: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          duration: string
          month: string
          monthly_goal_hours: number | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ministry_status_months"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      assert_ministry_month_writable: {
        Args: { p_month: string; p_user: string }
        Returns: undefined
      }
      close_ministry_assignment_after: {
        Args: { p_month: string; p_user: string }
        Returns: undefined
      }
      close_ministry_month: {
        Args: { p_month: string }
        Returns: {
          closed_at: string
          created_at: string
          deleted_at: string | null
          month: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ministry_month_closures"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      forget_user_push_subscription: {
        Args: { p_endpoint: string; p_user_id: string }
        Returns: boolean
      }
      freeze_ministry_month_after: {
        Args: { p_month: string; p_user: string }
        Returns: undefined
      }
      is_ministry_month_closed: {
        Args: { p_month: string; p_user: string }
        Returns: boolean
      }
      join_waitlist: {
        Args: { p_email: string }
        Returns: {
          already_joined: boolean
          list_position: number
          push_enrollment_token: string
        }[]
      }
      ministry_days_monthly_minutes: {
        Args: { p_from: string; p_to: string }
        Returns: {
          minutes: number
          month: string
        }[]
      }
      ministry_days_total_minutes: {
        Args: { p_from: string; p_to: string }
        Returns: number
      }
      ministry_status_for_month: {
        Args: { p_month: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          duration: string
          month: string
          monthly_goal_hours: number | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ministry_status_months"
          isOneToOne: true
          isSetofReturn: true
        }
      }
      ministry_status_shape: {
        Args: { p_monthly_goal: number; p_status: string }
        Returns: Record<string, unknown>
      }
      ministry_status_year_goal: {
        Args: { p_year_start: string }
        Returns: number
      }
      ministry_status_year_months: {
        Args: { p_year_start: string }
        Returns: {
          month: string
          monthly_goal_hours: number
          status: string
        }[]
      }
      register_user_push_subscription: {
        Args: {
          p_auth: string
          p_endpoint: string
          p_p256dh: string
          p_user_id: string
        }
        Returns: boolean
      }
      register_waitlist_push_subscription: {
        Args: {
          p_auth: string
          p_endpoint: string
          p_p256dh: string
          p_token: string
        }
        Returns: boolean
      }
      reopen_ministry_month: { Args: { p_month: string }; Returns: undefined }
      set_ministry_day_minutes: {
        Args: { p_day: string; p_minutes: number }
        Returns: {
          created_at: string
          day: string
          deleted_at: string | null
          minutes: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ministry_days"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_ministry_status: {
        Args: { p_month: string; p_monthly_goal?: number; p_status: string }
        Returns: {
          created_at: string
          deleted_at: string | null
          duration: string
          month: string
          monthly_goal_hours: number | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ministry_status_months"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_ministry_status_from: {
        Args: {
          p_month: string
          p_monthly_goal?: number
          p_pioneering_cleared_from?: string
          p_status: string
        }
        Returns: {
          created_at: string
          deleted_at: string | null
          duration: string
          month: string
          monthly_goal_hours: number | null
          status: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ministry_status_months"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "user" | "admin"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["user", "admin"],
    },
  },
} as const

