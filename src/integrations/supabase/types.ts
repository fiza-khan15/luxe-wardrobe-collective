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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      condition_photos: {
        Row: {
          created_at: string
          id: string
          kind: string
          path: string
          request_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          path: string
          request_id: string
          uploaded_by?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          path?: string
          request_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "condition_photos_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "condition_photos_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          id: string
          raised_by: string
          reason: string
          request_id: string
          resolution: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          raised_by: string
          reason: string
          request_id: string
          resolution?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          raised_by?: string
          reason?: string
          request_id?: string
          resolution?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_raised_by_fkey"
            columns: ["raised_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          path: string
          position: number
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          path: string
          position?: number
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          path?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category: string
          city: string
          cleaning_instructions: string
          cleaning_method: string
          condition: string
          created_at: string
          deposit: number
          description: string
          id: string
          item_value: number
          measurements: string
          owner_id: string
          ownership_confirmed: boolean
          price_per_day: number
          size: string
          status: string
          title: string
        }
        Insert: {
          category: string
          city: string
          cleaning_instructions?: string
          cleaning_method: string
          condition: string
          created_at?: string
          deposit: number
          description?: string
          id?: string
          item_value: number
          measurements?: string
          owner_id: string
          ownership_confirmed: boolean
          price_per_day: number
          size: string
          status?: string
          title: string
        }
        Update: {
          category?: string
          city?: string
          cleaning_instructions?: string
          cleaning_method?: string
          condition?: string
          created_at?: string
          deposit?: number
          description?: string
          id?: string
          item_value?: number
          measurements?: string
          owner_id?: string
          ownership_confirmed?: boolean
          price_per_day?: number
          size?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          giver_payout_status: string
          id: string
          razorpay_order_id: string
          razorpay_payment_id: string | null
          refunded_amount: number
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          giver_payout_status?: string
          id?: string
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          refunded_amount?: number
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          giver_payout_status?: string
          id?: string
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          refunded_amount?: number
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          agreement_accepted_at: string | null
          city: string
          created_at: string
          full_name: string
          id: string
          is_18_plus: boolean
          kyc_consent_at: string | null
          phone: string
          pincode: string | null
          rejection_reason: string | null
          suspended: boolean
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          address?: string | null
          agreement_accepted_at?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id: string
          is_18_plus?: boolean
          kyc_consent_at?: string | null
          phone?: string
          pincode?: string | null
          rejection_reason?: string | null
          suspended?: boolean
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          address?: string | null
          agreement_accepted_at?: string | null
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_18_plus?: boolean
          kyc_consent_at?: string | null
          phone?: string
          pincode?: string | null
          rejection_reason?: string | null
          suspended?: boolean
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      rental_requests: {
        Row: {
          accepted_at: string | null
          blocked_end: string
          blocked_start: string
          cancel_reason: string | null
          cleaning_attested: boolean
          completed_at: string | null
          created_at: string
          days: number
          deposit: number
          dispatched_at: string | null
          end_date: string
          expires_at: string | null
          id: string
          listing_id: string
          owner_id: string
          paid_at: string | null
          received_at: string | null
          rental_fee: number
          renter_id: string
          returned_at: string | null
          same_city: boolean
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          blocked_end: string
          blocked_start: string
          cancel_reason?: string | null
          cleaning_attested?: boolean
          completed_at?: string | null
          created_at?: string
          days: number
          deposit: number
          dispatched_at?: string | null
          end_date: string
          expires_at?: string | null
          id?: string
          listing_id: string
          owner_id: string
          paid_at?: string | null
          received_at?: string | null
          rental_fee: number
          renter_id: string
          returned_at?: string | null
          same_city: boolean
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          blocked_end?: string
          blocked_start?: string
          cancel_reason?: string | null
          cleaning_attested?: boolean
          completed_at?: string | null
          created_at?: string
          days?: number
          deposit?: number
          dispatched_at?: string | null
          end_date?: string
          expires_at?: string | null
          id?: string
          listing_id?: string
          owner_id?: string
          paid_at?: string | null
          received_at?: string | null
          rental_fee?: number
          renter_id?: string
          returned_at?: string | null
          same_city?: boolean
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_requests_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_requests_renter_id_fkey"
            columns: ["renter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          instagram: string | null
          intent: string
          linkedin: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          instagram?: string | null
          intent?: string
          linkedin?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          instagram?: string | null
          intent?: string
          linkedin?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_resolve_dispute: {
        Args: { _id: string; _resolution: string }
        Returns: undefined
      }
      admin_set_verification: {
        Args: {
          _reason?: string
          _status: Database["public"]["Enums"]["verification_status"]
          _user: string
        }
        Returns: undefined
      }
      admin_suspend_user: {
        Args: { _suspended: boolean; _user: string }
        Returns: undefined
      }
      create_rental_request: {
        Args: { _end: string; _listing: string; _start: string }
        Returns: string
      }
      get_blocked_ranges: {
        Args: { _listing: string }
        Returns: {
          blocked_end: string
          blocked_start: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify: {
        Args: { _body: string; _link: string; _title: string; _user: string }
        Returns: undefined
      }
      rental_action: {
        Args: { _action: string; _id: string; _note?: string }
        Returns: Database["public"]["Enums"]["request_status"]
      }
      submit_profile_verification: {
        Args: {
          _address: string
          _agreement: boolean
          _city: string
          _full_name: string
          _is_18_plus: boolean
          _kyc_consent: boolean
          _phone: string
          _pincode: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      request_status:
        | "pending"
        | "accepted"
        | "paid"
        | "dispatched"
        | "received"
        | "returned"
        | "completed"
        | "cancelled"
        | "declined"
        | "expired"
        | "disputed"
      verification_status: "none" | "pending" | "approved" | "rejected"
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
    Enums: {
      app_role: ["admin", "user"],
      request_status: [
        "pending",
        "accepted",
        "paid",
        "dispatched",
        "received",
        "returned",
        "completed",
        "cancelled",
        "declined",
        "expired",
        "disputed",
      ],
      verification_status: ["none", "pending", "approved", "rejected"],
    },
  },
} as const
