export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      companies: {
        Row: {
          address: string | null
          cnpj: string | null
          created_at: string | null
          description: string | null
          email: string
          id: string
          logo_url: string | null
          max_monthly_guests: number | null
          monthly_revenue: number | null
          monthly_usage: Json | null
          name: string
          next_payment_due: string | null
          payment_status: string | null
          phone: string | null
          plan: string | null
          plan_expires_at: string | null
          plan_id: string
          plan_status: string | null
          primary_color: string | null
          secondary_color: string | null
          slug: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          description?: string | null
          email: string
          id?: string
          logo_url?: string | null
          max_monthly_guests?: number | null
          monthly_revenue?: number | null
          monthly_usage?: Json | null
          name: string
          next_payment_due?: string | null
          payment_status?: string | null
          phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_id: string
          plan_status?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          created_at?: string | null
          description?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          max_monthly_guests?: number | null
          monthly_revenue?: number | null
          monthly_usage?: Json | null
          name?: string
          next_payment_due?: string | null
          payment_status?: string | null
          phone?: string | null
          plan?: string | null
          plan_expires_at?: string | null
          plan_id?: string
          plan_status?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          status?: string | null
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
          address: string | null
          capacity: number
          company_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          image_url: string | null
          location: string
          price: number | null
          status: string | null
          time: string
          title: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number
          company_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          image_url?: string | null
          location: string
          price?: number | null
          status?: string | null
          time: string
          title: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number
          company_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string
          price?: number | null
          status?: string | null
          time?: string
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
          cpf: string
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          id: string
          message_sent: string | null
          status: string
          updated_at: string
          whatsapp: string
        }
        Insert: {
          company_id: string
          cpf: string
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          message_sent?: string | null
          status?: string
          updated_at?: string
          whatsapp: string
        }
        Update: {
          company_id?: string
          cpf?: string
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          message_sent?: string | null
          status?: string
          updated_at?: string
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invites_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_invites_event"
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
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          checkin_alert: boolean | null
          company_id: string | null
          created_at: string | null
          email_confirmation: boolean | null
          event_reminder: boolean | null
          id: string
          new_registration: boolean | null
          updated_at: string | null
        }
        Insert: {
          checkin_alert?: boolean | null
          company_id?: string | null
          created_at?: string | null
          email_confirmation?: boolean | null
          event_reminder?: boolean | null
          id?: string
          new_registration?: boolean | null
          updated_at?: string | null
        }
        Update: {
          checkin_alert?: boolean | null
          company_id?: string | null
          created_at?: string | null
          email_confirmation?: boolean | null
          event_reminder?: boolean | null
          id?: string
          new_registration?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          paid_at: string | null
          payment_method: string
          payment_provider_data: Json | null
          plan_id: string
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method: string
          payment_provider_data?: Json | null
          plan_id: string
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string
          payment_provider_data?: Json | null
          plan_id?: string
          status?: string
          transaction_id?: string
          updated_at?: string
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
          company_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      registrations: {
        Row: {
          checked_in: boolean | null
          checkin_time: string | null
          created_at: string | null
          document: string | null
          document_type: string | null
          email: string
          event_id: string | null
          id: string
          name: string
          phone: string | null
          qr_code: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          checked_in?: boolean | null
          checkin_time?: string | null
          created_at?: string | null
          document?: string | null
          document_type?: string | null
          email: string
          event_id?: string | null
          id?: string
          name: string
          phone?: string | null
          qr_code?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          checked_in?: boolean | null
          checkin_time?: string | null
          created_at?: string | null
          document?: string | null
          document_type?: string | null
          email?: string
          event_id?: string | null
          id?: string
          name?: string
          phone?: string | null
          qr_code?: string | null
          status?: string | null
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
          email: string
          id: string
          name: string
          password_hash: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name: string
          password_hash: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          password_hash?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
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
          max_registrations_per_event: number | null
          max_total_registrations: number | null
          name: string
          price: number
          slug: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_events?: number | null
          max_registrations_per_event?: number | null
          max_total_registrations?: number | null
          name: string
          price?: number
          slug: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_events?: number | null
          max_registrations_per_event?: number | null
          max_total_registrations?: number | null
          name?: string
          price?: number
          slug?: string
          sort_order?: number | null
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
          type: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      user_behavior_stats: {
        Row: {
          avg_registration_time_hours: number | null
          created_at: string | null
          document: string
          document_type: string
          favorite_companies: string[] | null
          favorite_event_types: string[] | null
          favorite_locations: string[] | null
          id: string
          last_activity: string | null
          punctuality_score: number | null
          total_checkins: number | null
          total_events: number | null
          total_registrations: number | null
          updated_at: string | null
        }
        Insert: {
          avg_registration_time_hours?: number | null
          created_at?: string | null
          document: string
          document_type: string
          favorite_companies?: string[] | null
          favorite_event_types?: string[] | null
          favorite_locations?: string[] | null
          id?: string
          last_activity?: string | null
          punctuality_score?: number | null
          total_checkins?: number | null
          total_events?: number | null
          total_registrations?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_registration_time_hours?: number | null
          created_at?: string | null
          document?: string
          document_type?: string
          favorite_companies?: string[] | null
          favorite_event_types?: string[] | null
          favorite_locations?: string[] | null
          id?: string
          last_activity?: string | null
          punctuality_score?: number | null
          total_checkins?: number | null
          total_events?: number | null
          total_registrations?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          company_id: string | null
          created_at: string | null
          document: string | null
          document_type: string | null
          email: string
          id: string
          last_login: string | null
          name: string
          password_hash: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          document?: string | null
          document_type?: string | null
          email: string
          id?: string
          last_login?: string | null
          name: string
          password_hash: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          document?: string | null
          document_type?: string | null
          email?: string
          id?: string
          last_login?: string | null
          name?: string
          password_hash?: string
          phone?: string | null
          role?: string | null
          status?: string | null
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
      auto_inactivate_expired_events: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_qr_data: {
        Args:
          | { event_uuid: string; document_text: string }
          | { event_uuid: string; document_text: string }
        Returns: string
      }
      is_super_admin: {
        Args: { user_email: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
