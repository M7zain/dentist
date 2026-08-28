import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Procedure, SessionRecord } from "@/lib/types";

async function getOwnedProcedure(procedureId: number, dentistId: number) {
  const rows = await query<
    (Procedure & { patient_id: number; patient_name: string })[]
  >(
    `SELECT pr.*, pt.name AS patient_name
     FROM procedures pr
     JOIN patients pt ON pt.id = pr.patient_id
     WHERE pr.id = :id AND pt.dentist_id = :dentistId
     LIMIT 1`,
    { id: procedureId, dentistId }
  );
  return rows[0] || null;
}

function parseTeeth(raw: unknown): number[] {
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const procedureId = Number(id);
    const procedure = await getOwnedProcedure(procedureId, session.id);
    if (!procedure) {
      return NextResponse.json({ error: "الإجراء غير موجود" }, { status: 404 });
    }

    const sessionsRaw = await query<SessionRecord[]>(
      "SELECT * FROM sessions WHERE procedure_id = :id ORDER BY session_date DESC, id DESC",
      { id: procedureId }
    );

    const sessions = sessionsRaw.map((s) => ({
      ...s,
      amount_paid: Number(s.amount_paid),
      teeth: parseTeeth(s.teeth),
    }));

    const paidTotal = sessions.reduce((sum, s) => sum + s.amount_paid, 0);
    const totalPrice = Number(procedure.total_price);

    return NextResponse.json({
      procedure: {
        ...procedure,
        total_price: totalPrice,
        paid_total: paidTotal,
        remaining: Math.max(0, totalPrice - paidTotal),
      },
      sessions,
    });
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
    const procedureId = Number(id);
    const procedure = await getOwnedProcedure(procedureId, session.id);
    if (!procedure) {
      return NextResponse.json({ error: "الإجراء غير موجود" }, { status: 404 });
    }

    const body = await request.json();

    if (body.action === "finish") {
      await query(
        "UPDATE procedures SET status = 'finished', finished_at = NOW() WHERE id = :id",
        { id: procedureId }
      );
      return NextResponse.json({ ok: true, status: "finished" });
    }

    if (body.action === "reopen") {
      await query(
        "UPDATE procedures SET status = 'active', finished_at = NULL WHERE id = :id",
        { id: procedureId }
      );
      return NextResponse.json({ ok: true, status: "active" });
    }

    const name = String(body.name || procedure.name).trim();
    const totalPrice = Number(body.total_price ?? procedure.total_price);
    await query(
      "UPDATE procedures SET name = :name, total_price = :totalPrice WHERE id = :id",
      { name, totalPrice, id: procedureId }
    );

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }
}
