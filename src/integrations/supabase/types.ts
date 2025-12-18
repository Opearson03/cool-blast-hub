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
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_step: number | null
          owner_id: string
          phone: string | null
          preferred_suppliers: Json | null
          updated_at: string | null
        }
        Insert: {
          abn?: string | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id: string
          phone?: string | null
          preferred_suppliers?: Json | null
          updated_at?: string | null
        }
        Update: {
          abn?: string | null
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          owner_id?: string
          phone?: string | null
          preferred_suppliers?: Json | null
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
          mpa_strength: string | null
          name: string
          ordered_m3: number | null
          po_number: string | null
          pour_time: string | null
          scheduled_date: string | null
          site_address: string
          slump: string | null
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
          mpa_strength?: string | null
          name: string
          ordered_m3?: number | null
          po_number?: string | null
          pour_time?: string | null
          scheduled_date?: string | null
          site_address: string
          slump?: string | null
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
          mpa_strength?: string | null
          name?: string
          ordered_m3?: number | null
          po_number?: string | null
          pour_time?: string | null
          scheduled_date?: string | null
          site_address?: string
          slump?: string | null
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
      timesheets: {
        Row: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      app_role: ["admin", "staff"],
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
