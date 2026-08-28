import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { normalizeSyrianPhone } from "@/lib/format";
import type { Patient, ProcedureWithTotals } from "@/lib/types";

async function assertPatientOwned(patientId: number, dentistId: number) {
  const rows = await query<Patient[]>(
    "SELECT * FROM patients WHERE id = :id AND dentist_id = :dentistId LIMIT 1",
    { id: patientId, dentistId }
  );
  return rows[0] || null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const patientId = Number(id);
    const patient = await assertPatientOwned(patientId, session.id);
    if (!patient) {
      return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
    }

    const procedures = await query<ProcedureWithTotals[]>(
      `SELECT p.*,
        COALESCE((SELECT SUM(s.amount_paid) FROM sessions s WHERE s.procedure_id = p.id), 0) AS paid_total,
        (SELECT COUNT(*) FROM sessions s WHERE s.procedure_id = p.id) AS sessions_count
       FROM procedures p
       WHERE p.patient_id = :patientId
       ORDER BY p.created_at DESC`,
      { patientId }
    );

    const withRemaining = procedures.map((p) => ({
      ...p,
      paid_total: Number(p.paid_total),
      remaining: Math.max(0, Number(p.total_price) - Number(p.paid_total)),
      sessions_count: Number(p.sessions_count),
      total_price: Number(p.total_price),
    }));

    return NextResponse.json({ patient, procedures: withRemaining });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const patientId = Number(id);
    const patient = await assertPatientOwned(patientId, session.id);
    if (!patient) {
      return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
    }

    const body = await request.json();
    const name = String(body.name || patient.name).trim();
    const phone = normalizeSyrianPhone(String(body.phone || patient.phone));

    await query(
      "UPDATE patients SET name = :name, phone = :phone WHERE id = :id",
      { name, phone, id: patientId }
    );

    return NextResponse.json({ ok: true, patient: { ...patient, name, phone } });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const patientId = Number(id);
    const patient = await assertPatientOwned(patientId, session.id);
    if (!patient) {
      return NextResponse.json({ error: "المريض غير موجود" }, { status: 404 });
    }

    await query("DELETE FROM patients WHERE id = :id", { id: patientId });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}

