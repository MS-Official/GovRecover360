export type Role =
  | 'admin'
  | 'field_officer'
  | 'verifier'
  | 'program_manager'
  | 'finance_officer'
  | 'warehouse_officer'
  | 'gis_officer'
  | 'ngo_partner'
  | 'auditor'
  | 'citizen';

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'users:delete'
  | 'disasters:read'
  | 'disasters:write'
  | 'disasters:delete'
  | 'households:read'
  | 'households:write'
  | 'households:verify'
  | 'applications:read'
  | 'applications:write'
  | 'applications:approve'
  | 'payments:read'
  | 'payments:write'
  | 'payments:approve'
  | 'inventory:read'
  | 'inventory:write'
  | 'warehouse:read'
  | 'warehouse:write'
  | 'dispatch:read'
  | 'dispatch:write'
  | 'zones:read'
  | 'zones:write'
  | 'reports:read'
  | 'reports:write'
  | 'audit:read'
  | 'ngo:read'
  | 'ngo:write';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  permissions: Permission[];
  district?: string;
  organization?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface DisasterEvent {
  id: string;
  name: string;
  type: string;
  severity: string;
  status: string;
  district: string;
  location?: GISLocation;
  started_at: string;
  ended_at?: string;
  affected_population: number;
  displaced_count: number;
  fatality_count: number;
  damage_estimate: number;
  description?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Household {
  id: string;
  head_name: string;
  head_nic: string;
  address: string;
  district: string;
  division?: string;
  gn_division?: string;
  family_members: number;
  vulnerable_members: number;
  damage_level: string;
  status: string;
  contact_number?: string;
  registered_by: string;
  disaster_id?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ReliefApplication {
  id: string;
  household_id: string;
  household?: Household;
  disaster_id: string;
  disaster?: DisasterEvent;
  status: string;
  priority: string;
  required_items?: string;
  notes?: string;
  submitted_by: string;
  assigned_ngo?: string;
  assigned_ngo_name?: string;
  verified_by?: string;
  verified_at?: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentRequest {
  id: string;
  application_id: string;
  household_id: string;
  household_name?: string;
  amount: number;
  status: string;
  payment_method?: string;
  transaction_id?: string;
  approved_by?: string;
  approved_at?: string;
  processed_by?: string;
  processed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  warehouse_id: string;
  warehouse_name?: string;
  unit_cost: number;
  total_value: number;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  district: string;
  capacity: number;
  current_usage: number;
  manager_name?: string;
  contact_number?: string;
  status: string;
  created_at: string;
}

export interface DispatchOrder {
  id: string;
  warehouse_id: string;
  warehouse_name?: string;
  application_id?: string;
  ngo_id?: string;
  ngo_name?: string;
  items: DispatchItem[];
  status: string;
  dispatched_by: string;
  dispatched_at?: string;
  delivered_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DispatchItem {
  item_id: string;
  item_name: string;
  quantity: number;
  unit: string;
}

export interface DisasterZone {
  id: string;
  name: string;
  disaster_id: string;
  district: string;
  severity: string;
  status: string;
  affected_population?: number;
  geometry?: string;
  center_lat?: number;
  center_lng?: number;
  radius_km?: number;
  created_at: string;
  updated_at: string;
}

export interface GISLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface Shelter {
  id: string;
  name: string;
  district: string;
  capacity: number;
  current_occupancy: number;
  status: string;
  latitude?: number;
  longitude?: number;
  contact_number?: string;
  created_at: string;
}

export interface DistributionPoint {
  id: string;
  name: string;
  district: string;
  location: string;
  status: string;
  assigned_ngo?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_id?: string;
  created_at: string;
}

export interface ReportSummary {
  total_households: number;
  total_applications: number;
  total_approved: number;
  total_dispatched: number;
  total_disasters: number;
  total_users: number;
  total_payments: number;
  by_district: ByDistrict[];
  by_status: ByStatus[];
  by_damage_level?: ByStatus[];
}

export interface ByDistrict {
  district: string;
  count: number;
}

export interface ByStatus {
  status: string;
  count: number;
}

export interface AIRequest {
  prompt: string;
  context?: string;
  model?: string;
}

export interface AIResponse {
  response: string;
  model: string;
  tokens_used?: number;
  latency_ms?: number;
}

export type IntegrationStatusValue =
  | 'ok'
  | 'configured'
  | 'aligned'
  | 'documented'
  | 'mock_mode'
  | 'manual_setup_required'
  | 'manual_check_required'
  | 'not_configured'
  | 'error'
  | 'mock'
  | 'asgardeo';

export interface IntegrationStatus {
  backend: IntegrationStatusValue;
  database: IntegrationStatusValue;
  redis: IntegrationStatusValue;
  odoo: IntegrationStatusValue;
  openg2p: IntegrationStatusValue;
  wso2: IntegrationStatusValue;
  asgardeo: IntegrationStatusValue;
  choreo: IntegrationStatusValue;
  superset: IntegrationStatusValue;
  geonode: IntegrationStatusValue;
  aiService: IntegrationStatusValue;
  authMode: 'mock' | 'asgardeo';
  timestamp: string;
}
