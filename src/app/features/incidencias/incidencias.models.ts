export interface Discrepancy {
  id: number;
  code: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'TOLERANCE';
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'FALSE_POSITIVE' | 'IGNORED';
  operation_id: number | null;
  operation_type: string | null;
  operation_date: string | null;
  compared_field: string;
  value_cgr_bo: number | null;
  value_cgr_cl: number | null;
  value_conta: number | null;
  unit: string;
  description: string;
  detail_technical: Record<string, unknown> | null;
  absolute_difference: number | null;
  percentage_difference: number | null;
  is_auto_detected: boolean;
  requires_audit: boolean;
  is_recurring: boolean;
  resolution_type: string | null;
  resolution_notes: string | null;
  resolved_by: number | null;
  resolved_at: string | null;
  detected_by: string;
  created_at: string;
  updated_at: string;
}

export interface DiscrepancyListResponse {
  total: number;
  discrepancies: Discrepancy[];
}

export interface DiscrepancySummary {
  totalOpen: number;
  bySeverity: { severity: string; total: number }[];
  byType: { type: string; total: number }[];
  byStatus: { status: string; total: number }[];
}

export interface DiscrepancyTypeGroup {
  [category: string]: { code: string; label: string }[];
}
