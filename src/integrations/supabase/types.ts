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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          max_monthly_guests: number | null
          name: string
          next_payment_due: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          phone: string | null
          plan_id: string | null
          plan_status: Database["public"]["Enums"]["plan_status"] | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          max_monthly_guests?: number | null
          name: string
          next_payment_due?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          phone?: string | null
          plan_id?: string | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          max_monthly_guests?: number | null
          name?: string
          next_payment_due?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          phone?: string | null
          plan_id?: string | null
          plan_status?: Database["public"]["Enums"]["plan_status"] | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "system_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          company_id: string
          created_at: string | null
          date: string
          description: string | null
          end_time: string | null
          id: string
          image_url: string | null
          location: string | null
          price: number | null
          status: Database["public"]["Enums"]["event_status"] | null
          time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          capacity?: number | null
          company_id: string
          created_at?: string | null
          date: string
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["event_status"] | null
          time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number | null
          company_id?: string
          created_at?: string | null
          date?: string
          description?: string | null
          end_time?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          price?: number | null
          status?: Database["public"]["Enums"]["event_status"] | null
          time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      invites: {
        Row: {
          company_id: string
          confirmed_at: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          event_id: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invite_status"] | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          confirmed_at?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          event_id?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"] | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          confirmed_at?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          event_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invite_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invites_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          company_id: string
          content: string
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          subject: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          company_id: string
          created_at: string | null
          email_notifications: boolean | null
          id: string
          reminder_days_before: number | null
          sms_notifications: boolean | null
          updated_at: string | null
          whatsapp_notifications: boolean | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          reminder_days_before?: number | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          whatsapp_notifications?: boolean | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          reminder_days_before?: number | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          whatsapp_notifications?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          payment_provider: string | null
          payment_provider_data: Json | null
          payment_provider_id: string | null
          plan_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_provider_data?: Json | null
          payment_provider_id?: string | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_provider?: string | null
          payment_provider_data?: Json | null
          payment_provider_id?: string | null
          plan_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "system_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_id: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          barcode: string | null
          checked_in_at: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          event_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["registration_status"] | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          checked_in_at?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          event_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          checked_in_at?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          event_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          qr_code?: string | null
          status?: Database["public"]["Enums"]["registration_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "system_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "super_admins"
            referencedColumns: ["id"]
          },
        ]
      }
      system_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          max_events: number | null
          max_guests_per_event: number | null
          name: string
          price: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_events?: number | null
          max_guests_per_event?: number | null
          name: string
          price?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_events?: number | null
          max_guests_per_event?: number | null
          name?: string
          price?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      user_behavior_stats: {
        Row: {
          event_id: string | null
          id: string
          metric_type: string
          metric_value: number | null
          recorded_at: string | null
          registration_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string
          metric_type: string
          metric_value?: number | null
          recorded_at?: string | null
          registration_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string
          metric_type?: string
          metric_value?: number | null
          recorded_at?: string | null
          registration_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_behavior_stats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_behavior_stats_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_inactivate_expired_events: { Args: never; Returns: number }
      checkin_by_cpf: {
        Args: { p_cpf: string; p_event_id: string }
        Returns: {
          message: string
          registration_id: string
          registration_name: string
          success: boolean
        }[]
      }
      find_registration_by_barcode: {
        Args: { p_barcode: string }
        Returns: {
          checked_in_at: string
          email: string
          event_id: string
          id: string
          name: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      find_registration_by_hash: {
        Args: { p_hash: string }
        Returns: {
          barcode: string
          checked_in_at: string
          cpf: string
          email: string
          event_id: string
          id: string
          name: string
          phone: string
          qr_code: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      generate_barcode_data_simple: {
        Args: { p_registration_id: string }
        Returns: string
      }
      generate_qr_data: { Args: { p_registration_id: string }; Returns: string }
      generate_qr_data_simple: {
        Args: { p_registration_id: string }
        Returns: string
      }
      get_company_public: {
        Args: { p_slug: string }
        Returns: {
          id: string
          logo_url: string
          name: string
          slug: string
        }[]
      }
      get_invite_public: {
        Args: { p_invite_id: string }
        Returns: {
          company_logo: string
          company_name: string
          event_date: string
          event_location: string
          event_time: string
          event_title: string
          id: string
          name: string
          status: Database["public"]["Enums"]["invite_status"]
        }[]
      }
      get_registration_public: {
        Args: { p_registration_id: string }
        Returns: {
          company_name: string
          event_date: string
          event_location: string
          event_time: string
          event_title: string
          id: string
          name: string
          qr_code: string
          status: Database["public"]["Enums"]["registration_status"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      perform_checkin: {
        Args: { p_registration_id: string }
        Returns: {
          message: string
          registration_name: string
          success: boolean
        }[]
      }
      update_user_behavior_stats: {
        Args: {
          p_event_id: string
          p_metric_type: string
          p_metric_value: number
          p_registration_id: string
        }
        Returns: undefined
      }
      user_belongs_to_company: {
        Args: { _company_id: string }
        Returns: boolean
      }
      user_owns_event: { Args: { _event_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      event_status: "active" | "inactive" | "cancelled"
      invite_status: "pending" | "confirmed" | "cancelled"
      payment_status: "active" | "pending" | "expired" | "cancelled"
      plan_status: "active" | "inactive" | "cancelled" | "expired"
      registration_status: "pending" | "confirmed" | "cancelled" | "checked_in"
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
      app_role: ["admin", "user"],
      event_status: ["active", "inactive", "cancelled"],
      invite_status: ["pending", "confirmed", "cancelled"],
      payment_status: ["active", "pending", "expired", "cancelled"],
      plan_status: ["active", "inactive", "cancelled", "expired"],
      registration_status: ["pending", "confirmed", "cancelled", "checked_in"],
    },
  },
} as const
