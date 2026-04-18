export type UserRole =
  | 'md'
  | 'project_manager'
  | 'project_planner'
  | 'production_planner'
  | 'store'
  | 'worker'
  | 'supervisor'
  | 'qc_inspector'
  | 'qc_manager'
  | 'hr'
  | 'accounts'
  | 'vendor'

export type ProjectStatus =
  | 'enquiry' | 'order_confirmed' | 'planning'
  | 'in_production' | 'qc_pending' | 'dispatched'
  | 'closed' | 'on_hold'

export type BucketStatus =
  | 'planned' | 'waiting' | 'wip' | 'qc_pending'
  | 'qc_passed' | 'qc_failed' | 'rework' | 'closed'

export type QcResult = 'pass' | 'fail' | 'partial_pass' | 'hold'

export type NcrStatus = 'open' | 'under_capa' | 'capa_done' | 'closed' | 'rejected'

export type PlateStatus = 'available' | 'partially_used' | 'consumed' | 'scrapped'

export type PoStatus =
  | 'draft' | 'approved' | 'sent'
  | 'partially_received' | 'fully_received' | 'cancelled'

export type AttendanceStatus =
  | 'present' | 'absent' | 'half_day' | 'leave' | 'holiday' | 'week_off'

export type LeaveType = 'cl' | 'sl' | 'el' | 'lop' | 'festival' | 'ml' | 'pl'

export type EmployeeType = 'permanent' | 'contract' | 'trainee' | 'apprentice'

export type ZohoSyncStatus = 'pending' | 'synced' | 'failed' | 'skipped'

export type ProcessCategory = 'machine' | 'labour' | 'vendor'

export type ParamFieldType = 'numeric' | 'text' | 'dropdown' | 'boolean' | 'date'

// Core entity types
export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  employee_id?: string
  phone?: string
  avatar_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  project_code: string
  name: string
  customer_id: string
  po_number?: string
  po_date?: string
  contract_value?: number
  delivery_date?: string
  status: ProjectStatus
  project_type?: string
  applicable_code?: string
  description?: string
  created_at: string
  updated_at: string
  created_by?: string
  // joined
  customers?: { name: string; code: string }
}

export interface Bucket {
  id: string
  bucket_code: string
  project_id: string
  assembly_id?: string
  parent_bucket_id?: string
  input_product_type_id: string
  input_qty: number
  input_uom_id?: string
  planned_output_product_type_id?: string
  planned_output_qty?: number
  actual_output_product_type_id?: string
  actual_output_qty?: number
  process_type_id: string
  station_id?: string
  planned_start_date?: string
  planned_end_date?: string
  actual_start_at?: string
  actual_end_at?: string
  status: BucketStatus
  qc_pass_qty?: number
  qc_fail_qty?: number
  remarks?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface ProcessType {
  id: string
  code: string
  name: string
  category: ProcessCategory
  default_station_id?: string
  std_cycle_time_mins?: number
  requires_qc: boolean
  qc_is_blocking: boolean
  is_active: boolean
  created_at: string
}

export interface ProcessParameterSchema {
  id: string
  process_type_id: string
  field_name: string
  field_key: string
  field_type: ParamFieldType
  unit?: string
  spec_min?: number
  spec_max?: number
  dropdown_options?: string[]
  is_required: boolean
  display_order: number
  is_qc_field: boolean
}

export interface Employee {
  id: string
  employee_code: string
  full_name: string
  date_of_joining: string
  employee_type: EmployeeType
  department_id?: string
  designation_id?: string
  phone?: string
  qr_code?: string
  is_active: boolean
  created_at: string
  // joined
  departments?: { name: string }
  designations?: { name: string }
}

export interface Plate {
  id: string
  plate_code: string
  heat_number: string
  vendor_id?: string
  material_grade_id: string
  thickness_mm: number
  original_length_mm: number
  original_width_mm: number
  original_weight_kg: number
  available_area_sqmm?: number
  current_weight_kg?: number
  location_id?: string
  status: PlateStatus
  qr_code?: string
  mtc_document_url?: string
  created_at: string
  // joined
  material_grades?: { code: string; name: string }
  vendors?: { name: string }
  stock_locations?: { name: string }
}

// Supabase Database type wrapper (simplified for scaffolding)
export type Database = {
  public: {
    Tables: {
      user_profiles: { Row: UserProfile; Insert: Partial<UserProfile>; Update: Partial<UserProfile> }
      projects: { Row: Project; Insert: Partial<Project>; Update: Partial<Project> }
      buckets: { Row: Bucket; Insert: Partial<Bucket>; Update: Partial<Bucket> }
      process_types: { Row: ProcessType; Insert: Partial<ProcessType>; Update: Partial<ProcessType> }
      employees: { Row: Employee; Insert: Partial<Employee>; Update: Partial<Employee> }
      plates: { Row: Plate; Insert: Partial<Plate>; Update: Partial<Plate> }
    }
    Views: {
      v_bucket_live: { Row: Record<string, unknown> }
      v_station_constraints: { Row: Record<string, unknown> }
      v_project_ev: { Row: Record<string, unknown> }
      v_plate_utilisation: { Row: Record<string, unknown> }
      v_attendance_monthly: { Row: Record<string, unknown> }
    }
    Functions: {}
    Enums: {
      user_role: UserRole
      bucket_status: BucketStatus
      project_status: ProjectStatus
    }
  }
}
