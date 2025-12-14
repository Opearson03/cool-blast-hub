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
      bookings: {
        Row: {
          created_at: string | null
          customer_id: string | null
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string
          preferred_date: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone: string
          preferred_date?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string
          preferred_date?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          company_name: string | null
          contact_name: string
          created_at: string | null
          customer_type: Database["public"]["Enums"]["customer_type"]
          email: string | null
          id: string
          notes: string | null
          phone: string | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          contact_name: string
          created_at?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string | null
          contact_name?: string
          created_at?: string | null
          customer_type?: Database["public"]["Enums"]["customer_type"]
          email?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price: number
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_id: string
          due_date: string | null
          id: string
          invoice_number: string
          job_id: string | null
          notes: string | null
          paid_date: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total: number | null
          updated_at: string | null
          xero_invoice_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_number: string
          job_id?: string | null
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string | null
          xero_invoice_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          job_id?: string | null
          notes?: string | null
          paid_date?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          updated_at?: string | null
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          job_id: string
          role_on_job: string | null
          staff_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          job_id: string
          role_on_job?: string | null
          staff_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          job_id?: string
          role_on_job?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_assignments_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_hours: number | null
          booking_id: string | null
          completion_date: string | null
          created_at: string | null
          created_by: string | null
          customer_id: string | null
          deposit_amount: number | null
          deposit_notes: string | null
          deposit_paid_date: string | null
          deposit_payment_method: string | null
          deposit_percentage: number | null
          deposit_reference: string | null
          deposit_required: boolean | null
          deposit_status: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          job_number: string | null
          job_type: Database["public"]["Enums"]["job_type"]
          location: string | null
          quoted_amount: number | null
          scheduled_date: string | null
          scheduled_time: string | null
          special_requirements: string | null
          status: Database["public"]["Enums"]["job_status"]
          stripe_payment_intent_id: string | null
          stripe_payment_link: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          booking_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_notes?: string | null
          deposit_paid_date?: string | null
          deposit_payment_method?: string | null
          deposit_percentage?: number | null
          deposit_reference?: string | null
          deposit_required?: boolean | null
          deposit_status?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          job_number?: string | null
          job_type: Database["public"]["Enums"]["job_type"]
          location?: string | null
          quoted_amount?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          stripe_payment_intent_id?: string | null
          stripe_payment_link?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          booking_id?: string | null
          completion_date?: string | null
          created_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deposit_amount?: number | null
          deposit_notes?: string | null
          deposit_paid_date?: string | null
          deposit_payment_method?: string | null
          deposit_percentage?: number | null
          deposit_reference?: string | null
          deposit_required?: boolean | null
          deposit_status?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          job_number?: string | null
          job_type?: Database["public"]["Enums"]["job_type"]
          location?: string | null
          quoted_amount?: number | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          stripe_payment_intent_id?: string | null
          stripe_payment_link?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invites: {
        Row: {
          accepted_at: string | null
          email: string
          full_name: string
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted_at?: string | null
          email: string
          full_name: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      safety_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date: string | null
          file_name: string
          file_url: string
          id: string
          job_id: string | null
          notes: string | null
          title: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_name: string
          file_url: string
          id?: string
          job_id?: string | null
          notes?: string | null
          title: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          expiry_date?: string | null
          file_name?: string
          file_url?: string
          id?: string
          job_id?: string | null
          notes?: string | null
          title?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safety_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_documents: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          high_risk_work_types: Json | null
          id: string
          job_id: string | null
          location: string | null
          prepared_by: string | null
          principal_contractor: string | null
          review_date: string | null
          status: string | null
          subcontractor: string | null
          swms_number: string
          title: string
          updated_at: string | null
          valid_from: string
          valid_to: string | null
          version: number | null
          work_description: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          high_risk_work_types?: Json | null
          id?: string
          job_id?: string | null
          location?: string | null
          prepared_by?: string | null
          principal_contractor?: string | null
          review_date?: string | null
          status?: string | null
          subcontractor?: string | null
          swms_number: string
          title: string
          updated_at?: string | null
          valid_from: string
          valid_to?: string | null
          version?: number | null
          work_description: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          high_risk_work_types?: Json | null
          id?: string
          job_id?: string | null
          location?: string | null
          prepared_by?: string | null
          principal_contractor?: string | null
          review_date?: string | null
          status?: string | null
          subcontractor?: string | null
          swms_number?: string
          title?: string
          updated_at?: string | null
          valid_from?: string
          valid_to?: string | null
          version?: number | null
          work_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "swms_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_emergency_procedures: {
        Row: {
          assembly_point: string | null
          created_at: string | null
          emergency_contacts: string | null
          emergency_type: string
          id: string
          procedure: string
          swms_id: string
        }
        Insert: {
          assembly_point?: string | null
          created_at?: string | null
          emergency_contacts?: string | null
          emergency_type: string
          id?: string
          procedure: string
          swms_id: string
        }
        Update: {
          assembly_point?: string | null
          created_at?: string | null
          emergency_contacts?: string | null
          emergency_type?: string
          id?: string
          procedure?: string
          swms_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swms_emergency_procedures_swms_id_fkey"
            columns: ["swms_id"]
            isOneToOne: false
            referencedRelation: "swms_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_hazards: {
        Row: {
          administrative_controls: string | null
          consequence: string | null
          created_at: string | null
          elimination_controls: string | null
          engineering_controls: string | null
          hazard: string
          id: string
          initial_risk_rating: string | null
          likelihood: string | null
          potential_harm: string
          ppe_required: string | null
          residual_risk_rating: string | null
          responsible_person: string
          step_number: number
          substitution_controls: string | null
          swms_id: string
          work_activity: string
        }
        Insert: {
          administrative_controls?: string | null
          consequence?: string | null
          created_at?: string | null
          elimination_controls?: string | null
          engineering_controls?: string | null
          hazard: string
          id?: string
          initial_risk_rating?: string | null
          likelihood?: string | null
          potential_harm: string
          ppe_required?: string | null
          residual_risk_rating?: string | null
          responsible_person: string
          step_number: number
          substitution_controls?: string | null
          swms_id: string
          work_activity: string
        }
        Update: {
          administrative_controls?: string | null
          consequence?: string | null
          created_at?: string | null
          elimination_controls?: string | null
          engineering_controls?: string | null
          hazard?: string
          id?: string
          initial_risk_rating?: string | null
          likelihood?: string | null
          potential_harm?: string
          ppe_required?: string | null
          residual_risk_rating?: string | null
          responsible_person?: string
          step_number?: number
          substitution_controls?: string | null
          swms_id?: string
          work_activity?: string
        }
        Relationships: [
          {
            foreignKeyName: "swms_hazards_swms_id_fkey"
            columns: ["swms_id"]
            isOneToOne: false
            referencedRelation: "swms_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_signoffs: {
        Row: {
          acknowledged: boolean | null
          id: string
          signature_data: string | null
          signed_at: string | null
          signer_name: string
          signer_role: string | null
          staff_id: string | null
          swms_id: string
        }
        Insert: {
          acknowledged?: boolean | null
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_name: string
          signer_role?: string | null
          staff_id?: string | null
          swms_id: string
        }
        Update: {
          acknowledged?: boolean | null
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          signer_name?: string
          signer_role?: string | null
          staff_id?: string | null
          swms_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swms_signoffs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swms_signoffs_swms_id_fkey"
            columns: ["swms_id"]
            isOneToOne: false
            referencedRelation: "swms_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          billable: boolean | null
          break_minutes: number | null
          created_at: string | null
          date: string
          edit_request: string | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          job_id: string | null
          notes: string | null
          staff_id: string
          start_time: string
          status: Database["public"]["Enums"]["timesheet_status"]
          total_hours: number | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean | null
          break_minutes?: number | null
          created_at?: string | null
          date: string
          edit_request?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          job_id?: string | null
          notes?: string | null
          staff_id: string
          start_time: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          total_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          billable?: boolean | null
          break_minutes?: number | null
          created_at?: string | null
          date?: string
          edit_request?: string | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          job_id?: string | null
          notes?: string | null
          staff_id?: string
          start_time?: string
          status?: Database["public"]["Enums"]["timesheet_status"]
          total_hours?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
    }
    Enums: {
      app_role: "admin" | "staff"
      booking_status: "pending" | "contacted" | "converted" | "cancelled"
      customer_type: "retail" | "industrial"
      document_type: "swms" | "risk_assessment" | "permit" | "jsa" | "other"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      job_status:
        | "quoted"
        | "scheduled"
        | "in_progress"
        | "completed"
        | "invoiced"
        | "cancelled"
      job_type: "retail" | "industrial"
      service_type: "industrial" | "automotive" | "restoration" | "other"
      timesheet_status: "draft" | "submitted" | "approved" | "rejected"
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
      app_role: ["admin", "staff"],
      booking_status: ["pending", "contacted", "converted", "cancelled"],
      customer_type: ["retail", "industrial"],
      document_type: ["swms", "risk_assessment", "permit", "jsa", "other"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      job_status: [
        "quoted",
        "scheduled",
        "in_progress",
        "completed",
        "invoiced",
        "cancelled",
      ],
      job_type: ["retail", "industrial"],
      service_type: ["industrial", "automotive", "restoration", "other"],
      timesheet_status: ["draft", "submitted", "approved", "rejected"],
    },
  },
} as const
