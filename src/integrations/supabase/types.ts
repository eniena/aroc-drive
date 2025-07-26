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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          created_at: string
          id: string
          passenger_id: string
          seats_booked: number
          status: Database["public"]["Enums"]["booking_status"]
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          passenger_id: string
          seats_booked?: number
          status?: Database["public"]["Enums"]["booking_status"]
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          passenger_id?: string
          seats_booked?: number
          status?: Database["public"]["Enums"]["booking_status"]
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_passenger_id_fkey"
            columns: ["passenger_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      call_feedback: {
        Row: {
          call_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          call_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          call_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_feedback_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      call_requests: {
        Row: {
          created_at: string
          id: string
          language: Database["public"]["Enums"]["language"]
          status: Database["public"]["Enums"]["call_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language: Database["public"]["Enums"]["language"]
          status?: Database["public"]["Enums"]["call_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: Database["public"]["Enums"]["language"]
          status?: Database["public"]["Enums"]["call_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          callee_id: string
          caller_id: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          language: Database["public"]["Enums"]["language"]
          room_id: string | null
          started_at: string
          status: Database["public"]["Enums"]["call_status"]
        }
        Insert: {
          callee_id: string
          caller_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          language: Database["public"]["Enums"]["language"]
          room_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["call_status"]
        }
        Update: {
          callee_id?: string
          caller_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          language?: Database["public"]["Enums"]["language"]
          room_id?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["call_status"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          member_since: string | null
          preferred_language: Database["public"]["Enums"]["language"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          member_since?: string | null
          preferred_language: Database["public"]["Enums"]["language"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          member_since?: string | null
          preferred_language?: Database["public"]["Enums"]["language"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          available_seats: number
          car_model: string | null
          car_plate: string | null
          created_at: string
          departure_time: string
          driver_id: string
          from_location: string
          gender_preference: Database["public"]["Enums"]["gender_preference"]
          id: string
          notes: string | null
          price_per_seat: number
          to_location: string
          total_seats: number
          updated_at: string
        }
        Insert: {
          available_seats: number
          car_model?: string | null
          car_plate?: string | null
          created_at?: string
          departure_time: string
          driver_id: string
          from_location: string
          gender_preference?: Database["public"]["Enums"]["gender_preference"]
          id?: string
          notes?: string | null
          price_per_seat: number
          to_location: string
          total_seats: number
          updated_at?: string
        }
        Update: {
          available_seats?: number
          car_model?: string | null
          car_plate?: string | null
          created_at?: string
          departure_time?: string
          driver_id?: string
          from_location?: string
          gender_preference?: Database["public"]["Enums"]["gender_preference"]
          id?: string
          notes?: string | null
          price_per_seat?: number
          to_location?: string
          total_seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          cin_verified: boolean
          created_at: string
          email: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          name: string
          phone_number: string | null
          profile_picture: string | null
          rating: number | null
          total_ratings: number | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          cin_verified?: boolean
          created_at?: string
          email: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          name: string
          phone_number?: string | null
          profile_picture?: string | null
          rating?: number | null
          total_ratings?: number | null
          updated_at?: string
          user_id: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          cin_verified?: boolean
          created_at?: string
          email?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          name?: string
          phone_number?: string | null
          profile_picture?: string | null
          rating?: number | null
          total_ratings?: number | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_activity: {
        Args: {
          p_user_id: string
          p_activity_type: string
          p_description?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      update_user_status: {
        Args: {
          p_user_id: string
          p_status: Database["public"]["Enums"]["user_status"]
        }
        Returns: undefined
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "cancelled"
      call_status: "waiting" | "connected" | "ended"
      gender_preference: "any" | "men" | "women"
      gender_type: "male" | "female" | "other"
      language:
        | "english"
        | "spanish"
        | "french"
        | "german"
        | "italian"
        | "portuguese"
        | "arabic"
        | "chinese"
        | "japanese"
        | "korean"
        | "russian"
        | "hindi"
      user_status: "offline" | "online" | "in_call"
      user_type: "driver" | "passenger"
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
      booking_status: ["pending", "confirmed", "cancelled"],
      call_status: ["waiting", "connected", "ended"],
      gender_preference: ["any", "men", "women"],
      gender_type: ["male", "female", "other"],
      language: [
        "english",
        "spanish",
        "french",
        "german",
        "italian",
        "portuguese",
        "arabic",
        "chinese",
        "japanese",
        "korean",
        "russian",
        "hindi",
      ],
      user_status: ["offline", "online", "in_call"],
      user_type: ["driver", "passenger"],
    },
  },
} as const
