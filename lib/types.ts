export type Dentist = {
  id: number;
  name: string;
  username: string;
  clinic_percentage: number;
  created_at: string;
};

export type Patient = {
  id: number;
  dentist_id: number;
  name: string;
  phone: string;
  created_at: string;
};

export type ProcedureStatus = "active" | "finished";

export type Procedure = {
  id: number;
  patient_id: number;
  name: string;
  total_price: number;
  status: ProcedureStatus;
  created_at: string;
  finished_at: string | null;
};

export type SessionRecord = {
  id: number;
  procedure_id: number;
  notes: string;
  amount_paid: number;
  teeth: number[];
  session_date: string;
  created_at: string;
};

export type ProcedureWithTotals = Procedure & {
  paid_total: number;
  remaining: number;
  sessions_count: number;
};
