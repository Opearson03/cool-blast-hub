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
      business_subscriptions: {
        Row: {
          business_id: string
          created_at: string | null
          current_period_end: string | null
          employee_limit: number | null
          id: string
          plan_tier: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          current_period_end?: string | null
          employee_limit?: number | null
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          current_period_end?: string | null
          employee_limit?: number | null
          id?: string
          plan_tier?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          abn: string | null
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          inbound_email_alias: string | null
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          owner_id: string
          phone: string | null
          preferred_suppliers: Json | null
          quote_font: string | null
          quote_primary_color: string | null
          quote_secondary_color: string | null
          quote_template: string | null
          subscription_exempt: boolean | null
          updated_at: string | null
        }
        Insert: {
          abn?: string | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inbound_email_alias?: string | null
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id: string
          phone?: string | null
          preferred_suppliers?: Json | null
          quote_font?: string | null
          quote_primary_color?: string | null
          quote_secondary_color?: string | null
          quote_template?: string | null
          subscription_exempt?: boolean | null
          updated_at?: string | null
        }
        Update: {
          abn?: string | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          inbound_email_alias?: string | null
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id?: string
          phone?: string | null
          preferred_suppliers?: Json | null
          quote_font?: string | null
          quote_primary_color?: string | null
          quote_secondary_color?: string | null
          quote_template?: string | null
          subscription_exempt?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      concrete_tests: {
        Row: {
          actual_strength: number | null
          created_at: string | null
          id: string
          job_id: string
          lab_report_url: string | null
          notes: string | null
          passed: boolean | null
          pour_date: string | null
          pour_id: string | null
          sample_count: number | null
          supplier: string | null
          target_strength: number | null
          test_date: string | null
          test_id: string
          test_type: Database["public"]["Enums"]["test_type"]
          updated_at: string | null
        }
        Insert: {
          actual_strength?: number | null
          created_at?: string | null
          id?: string
          job_id: string
          lab_report_url?: string | null
          notes?: string | null
          passed?: boolean | null
          pour_date?: string | null
          pour_id?: string | null
          sample_count?: number | null
          supplier?: string | null
          target_strength?: number | null
          test_date?: string | null
          test_id: string
          test_type: Database["public"]["Enums"]["test_type"]
          updated_at?: string | null
        }
        Update: {
          actual_strength?: number | null
          created_at?: string | null
          id?: string
          job_id?: string
          lab_report_url?: string | null
          notes?: string | null
          passed?: boolean | null
          pour_date?: string | null
          pour_id?: string | null
          sample_count?: number | null
          supplier?: string | null
          target_strength?: number | null
          test_date?: string | null
          test_id?: string
          test_type?: Database["public"]["Enums"]["test_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "concrete_tests_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concrete_tests_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      crew_members: {
        Row: {
          created_at: string | null
          crew_id: string
          employee_id: string
          id: string
          is_supervisor: boolean | null
        }
        Insert: {
          created_at?: string | null
          crew_id: string
          employee_id: string
          id?: string
          is_supervisor?: boolean | null
        }
        Update: {
          created_at?: string | null
          crew_id?: string
          employee_id?: string
          id?: string
          is_supervisor?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crew_members_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crew_members_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crews: {
        Row: {
          business_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          business_id: string
          category: Database["public"]["Enums"]["document_category"]
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          reference_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          business_id: string
          category: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          reference_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          business_id?: string
          category?: Database["public"]["Enums"]["document_category"]
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          reference_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_tickets: {
        Row: {
          created_at: string | null
          document_url: string | null
          employee_id: string
          expiry_date: string | null
          id: string
          issue_date: string | null
          notes: string | null
          ticket_number: string | null
          ticket_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          employee_id: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          ticket_number?: string | null
          ticket_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          employee_id?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          notes?: string | null
          ticket_number?: string | null
          ticket_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_tickets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          last_service_date: string | null
          name: string
          next_service_date: string | null
          purchase_date: string | null
          serial_number: string | null
          service_interval_days: number | null
          service_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          last_service_date?: string | null
          name: string
          next_service_date?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          service_interval_days?: number | null
          service_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          last_service_date?: string | null
          name?: string
          next_service_date?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          service_interval_days?: number | null
          service_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          id: string
          quantity: number
          sort_order: number | null
          total: number | null
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          estimate_id: string
          id?: string
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit?: string | null
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          id?: string
          quantity?: number
          sort_order?: number | null
          total?: number | null
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "estimate_items_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_takeoffs: {
        Row: {
          created_at: string
          current_page: number | null
          estimate_id: string
          id: string
          page_count: number | null
          plan_type: string | null
          plan_url: string | null
          scale_calibration_method: string | null
          scale_pixels_per_meter: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_page?: number | null
          estimate_id: string
          id?: string
          page_count?: number | null
          plan_type?: string | null
          plan_url?: string | null
          scale_calibration_method?: string | null
          scale_pixels_per_meter?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_page?: number | null
          estimate_id?: string
          id?: string
          page_count?: number | null
          plan_type?: string | null
          plan_url?: string | null
          scale_calibration_method?: string | null
          scale_pixels_per_meter?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "estimate_takeoffs_estimate_id_fkey"
            columns: ["estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      estimate_usage: {
        Row: {
          business_id: string
          created_at: string | null
          estimate_count: number | null
          id: string
          month_year: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          estimate_count?: number | null
          id?: string
          month_year: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          estimate_count?: number | null
          id?: string
          month_year?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimate_usage_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          business_id: string
          client_email: string | null
          client_name: string
          client_phone: string | null
          client_signature: string | null
          client_signature_name: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          deposit_percentage: number | null
          description: string | null
          estimate_number: string | null
          estimate_type: string
          follow_up_date: string | null
          id: string
          notes: string | null
          payment_terms_type: string | null
          quote_validity_days: number | null
          scope_data: Json | null
          selected_scopes: Json | null
          signed_at: string | null
          signing_token: string | null
          signing_token_expires_at: string | null
          site_address: string
          site_visit_date: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          total_amount: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          business_id: string
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          client_signature?: string | null
          client_signature_name?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deposit_percentage?: number | null
          description?: string | null
          estimate_number?: string | null
          estimate_type?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          payment_terms_type?: string | null
          quote_validity_days?: number | null
          scope_data?: Json | null
          selected_scopes?: Json | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          site_address: string
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          business_id?: string
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          client_signature?: string | null
          client_signature_name?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          deposit_percentage?: number | null
          description?: string | null
          estimate_number?: string | null
          estimate_type?: string
          follow_up_date?: string | null
          id?: string
          notes?: string | null
          payment_terms_type?: string | null
          quote_validity_days?: number | null
          scope_data?: Json | null
          selected_scopes?: Json | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          site_address?: string
          site_visit_date?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          total_amount?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      external_invite_events: {
        Row: {
          event_at: string
          event_type: string
          external_invite_id: string
          id: string
          metadata: Json | null
        }
        Insert: {
          event_at?: string
          event_type: string
          external_invite_id: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          event_at?: string
          event_type?: string
          external_invite_id?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "external_invite_events_external_invite_id_fkey"
            columns: ["external_invite_id"]
            isOneToOne: false
            referencedRelation: "external_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      external_invites: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          email_delivery_status: string | null
          email_error_message: string | null
          email_message_id: string | null
          id: string
          invite_type: string
          job_id: string
          job_pour_id: string
          notes: string | null
          recipient_email: string | null
          recipient_name: string
          recipient_phone: string | null
          responded_at: string | null
          role: string
          sent_at: string | null
          sent_via: string | null
          sms_delivery_status: string | null
          sms_error_message: string | null
          sms_message_sid: string | null
          status: string
          token_expires_at: string
          token_hash: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          email_delivery_status?: string | null
          email_error_message?: string | null
          email_message_id?: string | null
          id?: string
          invite_type?: string
          job_id: string
          job_pour_id: string
          notes?: string | null
          recipient_email?: string | null
          recipient_name: string
          recipient_phone?: string | null
          responded_at?: string | null
          role: string
          sent_at?: string | null
          sent_via?: string | null
          sms_delivery_status?: string | null
          sms_error_message?: string | null
          sms_message_sid?: string | null
          status?: string
          token_expires_at?: string
          token_hash: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          email_delivery_status?: string | null
          email_error_message?: string | null
          email_message_id?: string | null
          id?: string
          invite_type?: string
          job_id?: string
          job_pour_id?: string
          notes?: string | null
          recipient_email?: string | null
          recipient_name?: string
          recipient_phone?: string | null
          responded_at?: string | null
          role?: string
          sent_at?: string | null
          sent_via?: string | null
          sms_delivery_status?: string | null
          sms_error_message?: string | null
          sms_message_sid?: string | null
          status?: string
          token_expires_at?: string
          token_hash?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_invites_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "external_invites_job_pour_id_fkey"
            columns: ["job_pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_id: string
          business_id: string
          content: string
          created_at: string
          crew_mentions: string[] | null
          id: string
          mentions: string[] | null
          updated_at: string
        }
        Insert: {
          author_id: string
          business_id: string
          content: string
          created_at?: string
          crew_mentions?: string[] | null
          id?: string
          mentions?: string[] | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          business_id?: string
          content?: string
          created_at?: string
          crew_mentions?: string[] | null
          id?: string
          mentions?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      itp_templates: {
        Row: {
          business_id: string | null
          checklist_items: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          itp_type: Database["public"]["Enums"]["itp_type"]
          name: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          checklist_items?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          itp_type: Database["public"]["Enums"]["itp_type"]
          name: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          checklist_items?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          itp_type?: Database["public"]["Enums"]["itp_type"]
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      job_boq: {
        Row: {
          created_at: string
          id: string
          items: Json
          job_id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: Json
          job_id: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: Json
          job_id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_boq_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_equipment: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          job_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          job_id: string
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_equipment_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_itps: {
        Row: {
          assigned_to: string | null
          checklist_data: Json
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          employee_signature: string | null
          employee_signed_at: string | null
          id: string
          itp_type: Database["public"]["Enums"]["itp_type"]
          job_id: string
          name: string
          notes: string | null
          pour_id: string | null
          status: string | null
          supervisor_signature: string | null
          supervisor_signed_at: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          checklist_data?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_signature?: string | null
          employee_signed_at?: string | null
          id?: string
          itp_type: Database["public"]["Enums"]["itp_type"]
          job_id: string
          name: string
          notes?: string | null
          pour_id?: string | null
          status?: string | null
          supervisor_signature?: string | null
          supervisor_signed_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          checklist_data?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          employee_signature?: string | null
          employee_signed_at?: string | null
          id?: string
          itp_type?: Database["public"]["Enums"]["itp_type"]
          job_id?: string
          name?: string
          notes?: string | null
          pour_id?: string | null
          status?: string | null
          supervisor_signature?: string | null
          supervisor_signed_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_itps_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_itps_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_itps_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "itp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_pours: {
        Row: {
          actual_m3: number | null
          concrete_supplier: string | null
          created_at: string | null
          estimated_m3: number | null
          id: string
          job_id: string
          mpa_strength: string | null
          notes: string | null
          pour_date: string | null
          pour_name: string
          scheduled_time: string | null
          slump: string | null
          status: string | null
          updated_at: string | null
          visit_type: string | null
        }
        Insert: {
          actual_m3?: number | null
          concrete_supplier?: string | null
          created_at?: string | null
          estimated_m3?: number | null
          id?: string
          job_id: string
          mpa_strength?: string | null
          notes?: string | null
          pour_date?: string | null
          pour_name: string
          scheduled_time?: string | null
          slump?: string | null
          status?: string | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Update: {
          actual_m3?: number | null
          concrete_supplier?: string | null
          created_at?: string | null
          estimated_m3?: number | null
          id?: string
          job_id?: string
          mpa_strength?: string | null
          notes?: string | null
          pour_date?: string | null
          pour_name?: string
          scheduled_time?: string | null
          slump?: string | null
          status?: string | null
          updated_at?: string | null
          visit_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_pours_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_swms: {
        Row: {
          content: Json
          created_at: string | null
          hazards: Json
          id: string
          job_id: string
          name: string
          required_signers: string[] | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          hazards?: Json
          id?: string
          job_id: string
          name: string
          required_signers?: string[] | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          hazards?: Json
          id?: string
          job_id?: string
          name?: string
          required_signers?: string[] | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_swms_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_swms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "swms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_variations: {
        Row: {
          amount: number
          approval_reference: string | null
          approved_at: string | null
          approved_by: string | null
          business_id: string
          client_signature: string | null
          client_signature_name: string | null
          created_at: string | null
          created_by: string | null
          days_extension: number | null
          description: string
          id: string
          items: Json
          job_id: string
          notes: string | null
          reason: string | null
          signed_at: string | null
          signing_token: string | null
          signing_token_expires_at: string | null
          status: string
          submitted_at: string | null
          submitted_to_email: string | null
          updated_at: string | null
          variation_number: string
        }
        Insert: {
          amount?: number
          approval_reference?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          client_signature?: string | null
          client_signature_name?: string | null
          created_at?: string | null
          created_by?: string | null
          days_extension?: number | null
          description: string
          id?: string
          items?: Json
          job_id: string
          notes?: string | null
          reason?: string | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          status?: string
          submitted_at?: string | null
          submitted_to_email?: string | null
          updated_at?: string | null
          variation_number: string
        }
        Update: {
          amount?: number
          approval_reference?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          client_signature?: string | null
          client_signature_name?: string | null
          created_at?: string | null
          created_by?: string | null
          days_extension?: number | null
          description?: string
          id?: string
          items?: Json
          job_id?: string
          notes?: string | null
          reason?: string | null
          signed_at?: string | null
          signing_token?: string | null
          signing_token_expires_at?: string | null
          status?: string
          submitted_at?: string | null
          submitted_to_email?: string | null
          updated_at?: string | null
          variation_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_variations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          builder_client: string | null
          business_id: string
          concrete_supplier: string | null
          created_at: string | null
          created_by: string | null
          crew_id: string | null
          estimated_m3: number | null
          finish_type: string | null
          id: string
          job_notes: string | null
          job_number: string | null
          job_type: string
          mpa_strength: string | null
          name: string
          ordered_m3: number | null
          po_number: string | null
          pour_time: string | null
          scheduled_date: string | null
          site_address: string
          slump: string | null
          source_estimate_id: string | null
          startup_completed: boolean | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
        }
        Insert: {
          builder_client?: string | null
          business_id: string
          concrete_supplier?: string | null
          created_at?: string | null
          created_by?: string | null
          crew_id?: string | null
          estimated_m3?: number | null
          finish_type?: string | null
          id?: string
          job_notes?: string | null
          job_number?: string | null
          job_type?: string
          mpa_strength?: string | null
          name: string
          ordered_m3?: number | null
          po_number?: string | null
          pour_time?: string | null
          scheduled_date?: string | null
          site_address: string
          slump?: string | null
          source_estimate_id?: string | null
          startup_completed?: boolean | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Update: {
          builder_client?: string | null
          business_id?: string
          concrete_supplier?: string | null
          created_at?: string | null
          created_by?: string | null
          crew_id?: string | null
          estimated_m3?: number | null
          finish_type?: string | null
          id?: string
          job_notes?: string | null
          job_number?: string | null
          job_type?: string
          mpa_strength?: string | null
          name?: string
          ordered_m3?: number | null
          po_number?: string | null
          pour_time?: string | null
          scheduled_date?: string | null
          site_address?: string
          slump?: string | null
          source_estimate_id?: string | null
          startup_completed?: boolean | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_crew_id_fkey"
            columns: ["crew_id"]
            isOneToOne: false
            referencedRelation: "crews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_source_estimate_id_fkey"
            columns: ["source_estimate_id"]
            isOneToOne: false
            referencedRelation: "estimates"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          business_id: string
          created_at: string | null
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      pending_test_results: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          business_id: string
          created_at: string
          extracted_data: Json | null
          from_email: string
          id: string
          lab_report_url: string | null
          linked_job_id: string | null
          linked_pour_id: string | null
          received_at: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["pending_test_status"]
          subject: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          business_id: string
          created_at?: string
          extracted_data?: Json | null
          from_email: string
          id?: string
          lab_report_url?: string | null
          linked_job_id?: string | null
          linked_pour_id?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["pending_test_status"]
          subject?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          business_id?: string
          created_at?: string
          extracted_data?: Json | null
          from_email?: string
          id?: string
          lab_report_url?: string | null
          linked_job_id?: string | null
          linked_pour_id?: string | null
          received_at?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["pending_test_status"]
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_test_results_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_test_results_linked_job_id_fkey"
            columns: ["linked_job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_test_results_linked_pour_id_fkey"
            columns: ["linked_pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      pour_employees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          pour_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          pour_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          pour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pour_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pour_employees_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      pour_equipment: {
        Row: {
          created_at: string | null
          equipment_id: string
          id: string
          pour_id: string
        }
        Insert: {
          created_at?: string | null
          equipment_id: string
          id?: string
          pour_id: string
        }
        Update: {
          created_at?: string | null
          equipment_id?: string
          id?: string
          pour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pour_equipment_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pour_equipment_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_items: {
        Row: {
          business_id: string
          category: string
          created_at: string | null
          custom_price: number | null
          default_price: number
          id: string
          is_active: boolean | null
          item_code: string
          item_name: string
          notes: string | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          business_id: string
          category: string
          created_at?: string | null
          custom_price?: number | null
          default_price: number
          id?: string
          is_active?: boolean | null
          item_code: string
          item_name: string
          notes?: string | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string
          category?: string
          created_at?: string | null
          custom_price?: number | null
          default_price?: number
          id?: string
          is_active?: boolean | null
          item_code?: string
          item_name?: string
          notes?: string | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          position: string | null
          terms_accepted_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name: string
          hourly_rate?: number | null
          id: string
          phone?: string | null
          position?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          phone?: string | null
          position?: string | null
          terms_accepted_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      project_startup: {
        Row: {
          caulking_required: boolean | null
          client: string | null
          client_contact_email: string | null
          client_contact_name: string | null
          client_contact_phone: string | null
          communication_setup: boolean | null
          completion_percentage: number | null
          concrete_supplier: string | null
          concrete_supply: boolean | null
          concrete_testing: boolean | null
          created_at: string | null
          curing_required: boolean | null
          id: string
          invoice_billing_address: string | null
          invoice_payment_terms: string | null
          itps_prepared: boolean | null
          job_id: string
          long_longs_required: boolean | null
          mix_design_approval: boolean | null
          mix_design_approval_notes: string | null
          mix_design_file_url: string | null
          mix_design_text: string | null
          plans_printed: boolean | null
          project_name: string | null
          reo_fixing_subcontractor: boolean | null
          reo_fixing_who: string | null
          reo_supplier: string | null
          reo_supply: boolean | null
          risk_assessment_completed: boolean | null
          site_manager: string | null
          swms_prepared: boolean | null
          updated_at: string | null
        }
        Insert: {
          caulking_required?: boolean | null
          client?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          communication_setup?: boolean | null
          completion_percentage?: number | null
          concrete_supplier?: string | null
          concrete_supply?: boolean | null
          concrete_testing?: boolean | null
          created_at?: string | null
          curing_required?: boolean | null
          id?: string
          invoice_billing_address?: string | null
          invoice_payment_terms?: string | null
          itps_prepared?: boolean | null
          job_id: string
          long_longs_required?: boolean | null
          mix_design_approval?: boolean | null
          mix_design_approval_notes?: string | null
          mix_design_file_url?: string | null
          mix_design_text?: string | null
          plans_printed?: boolean | null
          project_name?: string | null
          reo_fixing_subcontractor?: boolean | null
          reo_fixing_who?: string | null
          reo_supplier?: string | null
          reo_supply?: boolean | null
          risk_assessment_completed?: boolean | null
          site_manager?: string | null
          swms_prepared?: boolean | null
          updated_at?: string | null
        }
        Update: {
          caulking_required?: boolean | null
          client?: string | null
          client_contact_email?: string | null
          client_contact_name?: string | null
          client_contact_phone?: string | null
          communication_setup?: boolean | null
          completion_percentage?: number | null
          concrete_supplier?: string | null
          concrete_supply?: boolean | null
          concrete_testing?: boolean | null
          created_at?: string | null
          curing_required?: boolean | null
          id?: string
          invoice_billing_address?: string | null
          invoice_payment_terms?: string | null
          itps_prepared?: boolean | null
          job_id?: string
          long_longs_required?: boolean | null
          mix_design_approval?: boolean | null
          mix_design_approval_notes?: string | null
          mix_design_file_url?: string | null
          mix_design_text?: string | null
          plans_printed?: boolean | null
          project_name?: string | null
          reo_fixing_subcontractor?: boolean | null
          reo_fixing_who?: string | null
          reo_supplier?: string | null
          reo_supply?: boolean | null
          risk_assessment_completed?: boolean | null
          site_manager?: string | null
          swms_prepared?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_startup_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: true
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string | null
          id: string
          platform: string
          token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          platform: string
          token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          platform?: string
          token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_signoffs: {
        Row: {
          employee_id: string | null
          employee_name: string
          id: string
          signature_data: string | null
          signed_at: string | null
          swms_id: string
        }
        Insert: {
          employee_id?: string | null
          employee_name: string
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          swms_id: string
        }
        Update: {
          employee_id?: string | null
          employee_name?: string
          id?: string
          signature_data?: string | null
          signed_at?: string | null
          swms_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swms_signoffs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swms_signoffs_swms_id_fkey"
            columns: ["swms_id"]
            isOneToOne: false
            referencedRelation: "job_swms"
            referencedColumns: ["id"]
          },
        ]
      }
      swms_templates: {
        Row: {
          business_id: string | null
          content: Json
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          content?: Json
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      takeoff_files: {
        Row: {
          created_at: string
          file_name: string
          file_type: string
          file_url: string
          id: string
          page_count: number | null
          sort_order: number | null
          takeoff_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_type: string
          file_url: string
          id?: string
          page_count?: number | null
          sort_order?: number | null
          takeoff_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_type?: string
          file_url?: string
          id?: string
          page_count?: number | null
          sort_order?: number | null
          takeoff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_files_takeoff_id_fkey"
            columns: ["takeoff_id"]
            isOneToOne: false
            referencedRelation: "estimate_takeoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      takeoff_markups: {
        Row: {
          area_sqm: number | null
          color: string | null
          created_at: string
          depth_mm: number | null
          diameter_mm: number | null
          file_id: string | null
          height_mm: number | null
          id: string
          length_m: number | null
          markup_type: string | null
          name: string | null
          page_number: number | null
          parent_markup_id: string | null
          perimeter_m: number | null
          pier_quantity: number | null
          pod_count: number | null
          pod_thickness_mm: number | null
          points: Json
          scope_id: string
          shape_type: string
          spacer_2way_count: number | null
          spacer_4way_count: number | null
          takeoff_id: string
          toe_mm: number | null
          width_mm: number | null
        }
        Insert: {
          area_sqm?: number | null
          color?: string | null
          created_at?: string
          depth_mm?: number | null
          diameter_mm?: number | null
          file_id?: string | null
          height_mm?: number | null
          id?: string
          length_m?: number | null
          markup_type?: string | null
          name?: string | null
          page_number?: number | null
          parent_markup_id?: string | null
          perimeter_m?: number | null
          pier_quantity?: number | null
          pod_count?: number | null
          pod_thickness_mm?: number | null
          points?: Json
          scope_id: string
          shape_type: string
          spacer_2way_count?: number | null
          spacer_4way_count?: number | null
          takeoff_id: string
          toe_mm?: number | null
          width_mm?: number | null
        }
        Update: {
          area_sqm?: number | null
          color?: string | null
          created_at?: string
          depth_mm?: number | null
          diameter_mm?: number | null
          file_id?: string | null
          height_mm?: number | null
          id?: string
          length_m?: number | null
          markup_type?: string | null
          name?: string | null
          page_number?: number | null
          parent_markup_id?: string | null
          perimeter_m?: number | null
          pier_quantity?: number | null
          pod_count?: number | null
          pod_thickness_mm?: number | null
          points?: Json
          scope_id?: string
          shape_type?: string
          spacer_2way_count?: number | null
          spacer_4way_count?: number | null
          takeoff_id?: string
          toe_mm?: number | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_markups_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "takeoff_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_markups_parent_markup_id_fkey"
            columns: ["parent_markup_id"]
            isOneToOne: false
            referencedRelation: "takeoff_markups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takeoff_markups_takeoff_id_fkey"
            columns: ["takeoff_id"]
            isOneToOne: false
            referencedRelation: "estimate_takeoffs"
            referencedColumns: ["id"]
          },
        ]
      }
      takeoff_page_scales: {
        Row: {
          created_at: string
          file_id: string
          id: string
          page_number: number
          scale_pixels_per_meter: number
        }
        Insert: {
          created_at?: string
          file_id: string
          id?: string
          page_number?: number
          scale_pixels_per_meter: number
        }
        Update: {
          created_at?: string
          file_id?: string
          id?: string
          page_number?: number
          scale_pixels_per_meter?: number
        }
        Relationships: [
          {
            foreignKeyName: "takeoff_page_scales_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "takeoff_files"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          auto_clocked_out: boolean | null
          break_applied_at: string | null
          break_applied_by: string | null
          break_end: string | null
          break_start: string | null
          business_id: string
          clock_in: string
          clock_in_latitude: number | null
          clock_in_longitude: number | null
          clock_out: string | null
          clock_out_latitude: number | null
          clock_out_longitude: number | null
          created_at: string | null
          edited_at: string | null
          edited_by: string | null
          employee_id: string
          id: string
          notes: string | null
          pour_id: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          auto_clocked_out?: boolean | null
          break_applied_at?: string | null
          break_applied_by?: string | null
          break_end?: string | null
          break_start?: string | null
          business_id: string
          clock_in: string
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          pour_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          auto_clocked_out?: boolean | null
          break_applied_at?: string | null
          break_applied_by?: string | null
          break_end?: string | null
          break_start?: string | null
          business_id?: string
          clock_in?: string
          clock_in_latitude?: number | null
          clock_in_longitude?: number | null
          clock_out?: string | null
          clock_out_latitude?: number | null
          clock_out_longitude?: number | null
          created_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          pour_id?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_break_applied_by_fkey"
            columns: ["break_applied_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_edited_by_fkey"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_pour_id_fkey"
            columns: ["pour_id"]
            isOneToOne: false
            referencedRelation: "job_pours"
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
      visitor_analytics: {
        Row: {
          created_at: string
          date: string
          id: string
          page_views: number
          unique_visitors: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          page_views?: number
          unique_visitors?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          page_views?: number
          unique_visitors?: number
          updated_at?: string
        }
        Relationships: []
      }
      waiting_list: {
        Row: {
          bonus_estimates: number | null
          business_name: string | null
          created_at: string | null
          email: string
          founder_reward: string | null
          founder_status: boolean | null
          full_name: string | null
          id: string
          last_position_email_at: string | null
          last_position_notified: number | null
          referral_code: string | null
          referral_count: number | null
          referred_by: string | null
          vip_status: boolean | null
        }
        Insert: {
          bonus_estimates?: number | null
          business_name?: string | null
          created_at?: string | null
          email: string
          founder_reward?: string | null
          founder_status?: boolean | null
          full_name?: string | null
          id?: string
          last_position_email_at?: string | null
          last_position_notified?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          vip_status?: boolean | null
        }
        Update: {
          bonus_estimates?: number | null
          business_name?: string | null
          created_at?: string | null
          email?: string
          founder_reward?: string | null
          founder_status?: boolean | null
          full_name?: string | null
          id?: string
          last_position_email_at?: string | null
          last_position_notified?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          vip_status?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "waiting_list_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "waiting_list"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_queue_position: { Args: { _user_id: string }; Returns: number }
      check_employee_limit: { Args: { _business_id: string }; Returns: Json }
      check_invite_email: { Args: { _email: string }; Returns: boolean }
      get_all_users_for_staff: {
        Args: never
        Returns: {
          business_id: string
          business_name: string
          created_at: string
          email: string
          full_name: string
          id: string
          last_sign_in_at: string
          role: string
          subscription_exempt: boolean
          subscription_status: string
        }[]
      }
      get_dashboard_stats: { Args: { p_business_id: string }; Returns: Json }
      get_referrer_by_code: { Args: { code: string }; Returns: string }
      get_signup_trends: {
        Args: { days_back?: number }
        Returns: {
          business_count: number
          signup_date: string
          user_count: number
        }[]
      }
      get_subscription_stats: { Args: never; Returns: Json }
      get_team_profiles: {
        Args: never
        Returns: {
          avatar_url: string | null
          business_id: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string
          hourly_rate: number | null
          id: string
          phone: string | null
          position: string | null
          terms_accepted_at: string | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_team_profiles_safe: {
        Args: never
        Returns: {
          avatar_url: string
          business_id: string
          full_name: string
          id: string
          position: string
        }[]
      }
      get_user_business_id: { Args: { _user_id: string }; Returns: string }
      get_user_crew_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_estimate_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_job_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_pour_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_swms_ids: { Args: { _user_id: string }; Returns: string[] }
      get_user_team_ids: { Args: { _user_id: string }; Returns: string[] }
      get_waiting_list_count: { Args: never; Returns: number }
      get_waiting_list_entries: {
        Args: never
        Returns: {
          business_name: string
          created_at: string
          email: string
          full_name: string
          id: string
        }[]
      }
      get_waitlist_by_email: { Args: { _email: string }; Returns: Json }
      get_waitlist_status: { Args: { _user_id: string }; Returns: Json }
      has_active_subscription: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pourhub_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "staff" | "pourhub_staff"
      booking_status: "pending" | "contacted" | "converted" | "cancelled"
      customer_type: "retail" | "industrial"
      document_category:
        | "itp"
        | "swms"
        | "project_startup"
        | "concrete_test"
        | "equipment"
        | "employee"
        | "job"
        | "general"
      document_type: "swms" | "risk_assessment" | "permit" | "jsa" | "other"
      estimate_status: "draft" | "pending" | "sent" | "accepted" | "declined"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      itp_type:
        | "formwork"
        | "reinforcement"
        | "pre_pour"
        | "post_pour"
        | "custom"
      job_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      job_type: "retail" | "industrial"
      leave_status: "pending" | "approved" | "rejected"
      pending_test_status: "pending" | "approved" | "rejected"
      service_type: "industrial" | "automotive" | "restoration" | "other"
      test_type:
        | "7_day"
        | "14_day"
        | "28_day"
        | "slump"
        | "cylinder"
        | "air"
        | "other"
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
      app_role: ["admin", "staff", "pourhub_staff"],
      booking_status: ["pending", "contacted", "converted", "cancelled"],
      customer_type: ["retail", "industrial"],
      document_category: [
        "itp",
        "swms",
        "project_startup",
        "concrete_test",
        "equipment",
        "employee",
        "job",
        "general",
      ],
      document_type: ["swms", "risk_assessment", "permit", "jsa", "other"],
      estimate_status: ["draft", "pending", "sent", "accepted", "declined"],
      invoice_status: ["draft", "sent", "paid", "overdue", "cancelled"],
      itp_type: [
        "formwork",
        "reinforcement",
        "pre_pour",
        "post_pour",
        "custom",
      ],
      job_status: ["scheduled", "in_progress", "completed", "cancelled"],
      job_type: ["retail", "industrial"],
      leave_status: ["pending", "approved", "rejected"],
      pending_test_status: ["pending", "approved", "rejected"],
      service_type: ["industrial", "automotive", "restoration", "other"],
      test_type: [
        "7_day",
        "14_day",
        "28_day",
        "slump",
        "cylinder",
        "air",
        "other",
      ],
      timesheet_status: ["draft", "submitted", "approved", "rejected"],
    },
  },
} as const
